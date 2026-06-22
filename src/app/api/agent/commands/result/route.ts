import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logError } from "@/lib/observability";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["DONE", "FAILED"]),
  result: z.string().max(4000).optional(),
});

// The agent reports the outcome of a remediation command it executed.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) return NextResponse.json({ error: "Missing device key." }, { status: 401 });

    const device = await prisma.device.findUnique({ where: { deviceKey }, select: { id: true } });
    if (!device) return NextResponse.json({ error: "Unknown device." }, { status: 401 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    const { id, status, result } = parsed.data;

    // Scope the update to this device so it can only close its own commands.
    await prisma.remoteCommand.updateMany({
      where: { id, deviceId: device.id },
      data: { status, result, completedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "POST /api/agent/commands/result" });
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
