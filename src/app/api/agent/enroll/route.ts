import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit, callerKey, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { pickOwner, normalizeOsUser } from "@/lib/device-owner";
import { consumeEnrollmentToken } from "@/lib/enrollment";
import { logAudit } from "@/lib/audit";

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
    const limit = await checkRateLimit(await callerKey(req, "enroll"), 30, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enrollment request." }, { status: 400 });
    }
    const { enrollmentToken, hostname, os, user } = parsed.data;

    // Claims one use atomically, and refuses revoked, expired, or exhausted
    // tokens. The caller is told nothing beyond "invalid" — which token state
    // rejected them is not information an unauthenticated caller should get.
    const claim = await consumeEnrollmentToken(enrollmentToken);
    if (!claim.ok) {
      return NextResponse.json({ error: "Invalid or expired enrollment token." }, { status: 401 });
    }
    const enrollment = { domain: claim.domain };

    const deviceKey = `dev_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;

    // Best-effort link to an app user by the reported OS username. Stays null
    // unless the match is unambiguous; IT can assign explicitly otherwise.
    //
    // Only the plausible candidates are fetched. This previously loaded *every*
    // user in the tenant on every enrollment just to run an in-memory equality
    // check — fine at 20 users, a full table scan and serialization at 20,000.
    // `pickOwner` still decides, so the ambiguity rules are unchanged; the query
    // just pre-filters to rows those rules could possibly match.
    const osKey = normalizeOsUser(user);
    const candidates = osKey
      ? await prisma.user.findMany({
          where: {
            domain: enrollment.domain,
            OR: [
              { email: { startsWith: `${osKey}@`, mode: "insensitive" } },
              { name: { equals: osKey.replace(/[._-]+/g, " ").trim(), mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true },
          take: 25,
        })
      : [];
    const ownerId = pickOwner(candidates, user);

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

    // A device joining the fleet is a tenant-visible security event: the whole
    // point of revocable tokens is that an admin can see a rogue enrolment and
    // act on it.
    await logAudit({
      domain: enrollment.domain,
      action: "CREATE",
      entityType: "Device",
      entityId: device.id,
      entityLabel: hostname,
      summary: `Device "${hostname}" enrolled${user ? ` by OS user ${user}` : ""}`,
      actor: null,
    });

    return NextResponse.json({ deviceId: device.id, deviceKey });
  } catch (error) {
    logError(error, { route: "POST /api/agent/enroll" });
    return NextResponse.json({ error: "Enrollment failed." }, { status: 500 });
  }
}
