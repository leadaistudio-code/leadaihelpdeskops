import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { pickOwner } from "@/lib/device-owner";

const schema = z.object({
  enrollmentToken: z.string().min(8),
  hostname: z.string().min(1).max(200),
  os: z.string().max(200).optional(),
  user: z.string().max(200).optional(),
});

// A laptop enrolls once with its tenant's enrollment token and receives a
// per-device key it uses to post metrics thereafter.
export async function POST(req: Request) {
  try {
    const limit = rateLimit(await callerKey(req, "enroll"), 30, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enrollment request." }, { status: 400 });
    }
    const { enrollmentToken, hostname, os, user } = parsed.data;

    const enrollment = await prisma.enrollmentToken.findUnique({ where: { token: enrollmentToken } });
    if (!enrollment) {
      return NextResponse.json({ error: "Invalid or expired enrollment token." }, { status: 401 });
    }

    const deviceKey = `dev_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;

    // Best-effort link to an app user by the reported OS username. Stays null
    // unless the match is unambiguous; IT can assign explicitly otherwise.
    const tenantUsers = await prisma.user.findMany({
      where: { domain: enrollment.domain },
      select: { id: true, name: true, email: true },
    });
    const ownerId = pickOwner(tenantUsers, user);

    const device = await prisma.device.create({
      data: {
        deviceKey,
        hostname,
        os,
        user,
        ownerId,
        domain: enrollment.domain,
      },
      select: { id: true },
    });

    return NextResponse.json({ deviceId: device.id, deviceKey });
  } catch (error) {
    logError(error, { route: "POST /api/agent/enroll" });
    return NextResponse.json({ error: "Enrollment failed." }, { status: 500 });
  }
}
