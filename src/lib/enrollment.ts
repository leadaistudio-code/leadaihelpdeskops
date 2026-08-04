import prisma from "@/lib/prisma";

// Enrollment token lifecycle.
//
// Kept out of `actions/` on purpose: `consumeEnrollmentToken` runs on the
// unauthenticated `/api/agent/enroll` route and must never be exported from a
// `"use server"` module, or it becomes a public endpoint that mints device
// enrolments on demand.

// Default validity. Long enough for an admin to hand the token to a technician
// and for that technician to get to the machine; short enough that a token
// leaked into a log or a screenshot is dead before anyone finds it.
export const DEFAULT_ENROLLMENT_TTL_HOURS = 24;
export const MAX_ENROLLMENT_TTL_HOURS = 24 * 30;

export function newEnrollmentTokenValue(): string {
  return `enr_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
}

export type EnrollmentTokenState = "ACTIVE" | "REVOKED" | "EXPIRED" | "EXHAUSTED";

export function tokenState(t: {
  revokedAt: Date | null;
  expiresAt: Date;
  useCount: number;
  maxUses: number;
}): EnrollmentTokenState {
  if (t.revokedAt) return "REVOKED";
  if (t.expiresAt.getTime() <= Date.now()) return "EXPIRED";
  if (t.useCount >= t.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}

export type ConsumeResult =
  | { ok: true; domain: string; tokenId: string }
  | { ok: false; reason: EnrollmentTokenState | "UNKNOWN" };

// Atomically claim one use of a token.
//
// The `useCount` guard lives in the `updateMany` WHERE clause rather than in a
// read-then-write, so two devices racing on a single-use token cannot both win:
// the second update matches zero rows because `useCount` has already moved.
export async function consumeEnrollmentToken(token: string): Promise<ConsumeResult> {
  const row = await prisma.enrollmentToken.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "UNKNOWN" };

  const state = tokenState(row);
  if (state !== "ACTIVE") return { ok: false, reason: state };

  const claimed = await prisma.enrollmentToken.updateMany({
    where: {
      id: row.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      useCount: { lt: row.maxUses },
    },
    data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
  });

  if (claimed.count === 0) {
    // Lost the race, or the token was revoked in between. Re-read to report why.
    const fresh = await prisma.enrollmentToken.findUnique({ where: { id: row.id } });
    return { ok: false, reason: fresh ? tokenState(fresh) : "UNKNOWN" };
  }

  return { ok: true, domain: row.domain, tokenId: row.id };
}
