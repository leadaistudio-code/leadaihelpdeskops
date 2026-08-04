import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, deviceKeyBucket, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

// The agent polls this (with its device key) to pull queued remediation
// commands, and marks them RUNNING so they aren't handed out twice.
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) return NextResponse.json({ error: "Missing device key." }, { status: 401 });

    // The two command endpoints were the only agent routes with no rate limit.
    // Limiting *before* the device lookup is the point: it caps how fast an
    // unauthenticated caller can guess device keys, and stops one looping agent
    // from monopolising the poller. The agent's normal cadence is far below 60/min.
    const limit = await checkRateLimit(await deviceKeyBucket(deviceKey, "commands"), 60, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const device = await prisma.device.findUnique({ where: { deviceKey }, select: { id: true } });
    if (!device) return NextResponse.json({ error: "Unknown device." }, { status: 401 });

    const queued = await prisma.remoteCommand.findMany({
      where: { deviceId: device.id, status: "QUEUED" },
      select: { id: true, action: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    if (queued.length > 0) {
      await prisma.remoteCommand.updateMany({
        where: { id: { in: queued.map((c) => c.id) } },
        data: { status: "RUNNING" },
      });
    }

    return NextResponse.json({ commands: queued });
  } catch (error) {
    logError(error, { route: "GET /api/agent/commands" });
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
