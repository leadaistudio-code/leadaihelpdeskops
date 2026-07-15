import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({
  appName: z.string().min(1).max(255),
  appVersion: z.string().max(50).nullish(),
  eventType: z.enum(["CRASH", "HANG", "BSOD"]),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) {
      return NextResponse.json({ error: "Missing device key." }, { status: 401 });
    }

    const limit = rateLimit(`crashes:${deviceKey}`, 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const device = await prisma.device.findUnique({
      where: { deviceKey },
      select: { id: true, domain: true, hostname: true },
    });
    if (!device) {
      return NextResponse.json({ error: "Unknown device." }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid crash payload." }, { status: 400 });
    }
    const data = parsed.data;

    await prisma.appCrashEvent.create({
      data: {
        deviceId: device.id,
        appName: data.appName,
        appVersion: data.appVersion ?? null,
        eventType: data.eventType,
        domain: device.domain,
      },
    });

    if (data.eventType === "BSOD") {
      const settings = await prisma.tenantSettings.findUnique({ where: { domain: device.domain } });
      if (settings?.autoHeal) {
        // Queue OS repair script
        await prisma.remoteCommand.create({
          data: { deviceId: device.id, action: "RUN_SCRIPT: sfc /scannow", domain: device.domain },
        });

        // Create zero-touch resolved incident
        const monitor = await prisma.user.upsert({
          where: { email: `dex-monitor_${device.domain}@leadaistudio.ai` },
          update: {},
          create: { email: `dex-monitor_${device.domain}@leadaistudio.ai`, name: "DEX Monitor", role: "EMPLOYEE", domain: device.domain },
        });
        const count = await prisma.incident.count({ where: { type: "INCIDENT" } });
        await prisma.incident.create({
          data: {
            number: `INC${String(count + 10000).padStart(7, "0")}`,
            title: `DEX Alert: BSOD (Blue Screen) on ${device.hostname}`,
            description: `Proactively detected by the DEX agent on ${device.hostname}.\nIssue: System Crash (BSOD)\n\nThis issue was AUTO-RESOLVED by AI - Zero Touch. Queued SFC repair script.`,
            type: "INCIDENT",
            priority: "HIGH",
            status: "RESOLVED",
            callerId: monitor.id,
            domain: device.domain,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/agent/crashes" });
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
