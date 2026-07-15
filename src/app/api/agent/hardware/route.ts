import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({
  component: z.string().min(1).max(100),
  probability: z.number().min(0).max(1),
  predictedDate: z.string().datetime().nullish(),
  status: z.enum(["WARNING", "CRITICAL", "RESOLVED"]),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) {
      return NextResponse.json({ error: "Missing device key." }, { status: 401 });
    }

    const limit = rateLimit(`hardware:${deviceKey}`, 20, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const device = await prisma.device.findUnique({
      where: { deviceKey },
      select: { id: true, domain: true },
    });
    if (!device) {
      return NextResponse.json({ error: "Unknown device." }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid hardware payload." }, { status: 400 });
    }
    const data = parsed.data;

    await prisma.hardwareFailurePrediction.create({
      data: {
        deviceId: device.id,
        component: data.component,
        probability: data.probability,
        predictedDate: data.predictedDate ? new Date(data.predictedDate) : null,
        status: data.status,
        domain: device.domain,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/agent/hardware" });
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
