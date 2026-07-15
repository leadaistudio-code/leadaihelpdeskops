import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

const schema = z.object({
  triggerEvent: z.string().min(1).max(255),
  question: z.string().min(1).max(1000),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullish(),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) {
      return NextResponse.json({ error: "Missing device key." }, { status: 401 });
    }

    const limit = rateLimit(`surveys:${deviceKey}`, 20, 60_000);
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
      return NextResponse.json({ error: "Invalid survey payload." }, { status: 400 });
    }
    const data = parsed.data;

    await prisma.microSurveyResponse.create({
      data: {
        deviceId: device.id,
        triggerEvent: data.triggerEvent,
        question: data.question,
        rating: data.rating,
        comment: data.comment ?? null,
        domain: device.domain,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/agent/surveys" });
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
