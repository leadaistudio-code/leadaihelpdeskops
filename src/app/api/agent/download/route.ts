import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import zlib from "zlib";
import { logError } from "@/lib/observability";

// Read the agent binary: from local build, or fetched from a hosted URL.
async function getAgentBinary(): Promise<Buffer | null> {
  const hosted = process.env.DEX_AGENT_DOWNLOAD_URL;
  if (hosted) {
    try {
      const res = await fetch(hosted);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* fall through to local */
    }
  }
  // Current build is aiops-agent.exe; fall back to the old name if present.
  for (const name of ["aiops-agent.exe", "dex-agent.exe"]) {
    // Check the new Go agent first, then fallback to the old Node agent.
    for (const subDir of ["agent-go/dist", "agent/dist"]) {
      const filePath = path.join(process.cwd(), subDir, name);
    try {
      await stat(filePath);
      return await readFile(filePath);
    } catch {
      /* try next */
    }
  }
  return null;
}

// Minimal stored (uncompressed) ZIP writer — no dependencies.
function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const DOS_DATE = 0x5221; // 2021-01-01, a valid DOS date
  const localChunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const crc = zlib.crc32(f.data) >>> 0;
    const size = f.data.length;
    const localOffset = offset; // offset of THIS entry's local header

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8); // method 0 = stored
    lh.writeUInt16LE(0, 10); // time
    lh.writeUInt16LE(DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(size, 18);
    lh.writeUInt32LE(size, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    localChunks.push(lh, name, f.data);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(DOS_DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(size, 20);
    ch.writeUInt32LE(size, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(localOffset, 42); // local header offset
    central.push(Buffer.concat([ch, name]));
    offset += 30 + name.length + size;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...localChunks, centralBuf, eocd]);
}

export async function GET(req: Request) {
  try {
    const bin = await getAgentBinary();
    if (!bin) {
      return NextResponse.json(
        { error: "Agent binary not available. Build it (cd agent && npm install && npm run build) or set DEX_AGENT_DOWNLOAD_URL." },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // Bare binary (for CLI / RMM that passes --server/--token).
    if (!token) {
      return new Response(new Uint8Array(bin), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="aiops-agent.exe"',
          "Cache-Control": "no-store",
        },
      });
    }

    // Zero-touch setup ZIP: exe + a config the agent auto-reads on double-click.
    const proto = req.headers.get("x-forwarded-proto") ?? (url.protocol.replace(":", "") || "http");
    const host = req.headers.get("host") ?? url.host;
    const server = process.env.APP_URL ?? `${proto}://${host}`;
    const config = JSON.stringify({ server, token, interval: 30 }, null, 2);
    const readme =
      "AIops Agent (LeadAIStudio) — setup\r\n\r\n" +
      "1. Keep aiops-agent.exe and aiops-agent.config.json together in this folder.\r\n" +
      "2. Double-click aiops-agent.exe. It runs silently in the system tray (no\r\n" +
      "   window). Right-click the tray icon for status, logs, dashboard, pause,\r\n" +
      "   or quit. It auto-starts on logon and adds a Desktop shortcut.\r\n\r\n" +
      "To remove it later: run  aiops-agent.exe --uninstall\r\n";

    const zip = buildZip([
      { name: "aiops-agent.exe", data: bin },
      { name: "aiops-agent.config.json", data: Buffer.from(config, "utf8") },
      { name: "README.txt", data: Buffer.from(readme, "utf8") },
    ]);

    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="aiops-agent-setup.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/agent/download" });
    return NextResponse.json({ error: "Download failed." }, { status: 500 });
  }
}
