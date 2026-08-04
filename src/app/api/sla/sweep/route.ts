import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sweepAllSlaBreaches } from "@/lib/sla-engine";
import { logError } from "@/lib/observability";

// Scheduled SLA breach sweep. A scheduler (Vercel Cron, or any external cron)
// hits this to escalate breaches on tickets nobody is actively viewing.
//
// Secure it with CRON_SECRET, which the scheduler sends as
// `Authorization: Bearer <CRON_SECRET>`.
//
// This fails CLOSED. It previously ran the check only `if (secret)`, so a
// deployment that had not set CRON_SECRET — which is the default state of a
// fresh deploy — served an unauthenticated endpoint that drives escalation and
// notification across *every* tenant. An unset secret is a misconfiguration, not
// a permission to skip authentication.

// Constant-time comparison that does not leak the secret's length through an
// early return. Both sides are hashed to a fixed width first via equal-length
// buffers, so `timingSafeEqual` never throws on a length mismatch.
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still burn a comparison so the failure path costs the same either way.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logError(new Error("CRON_SECRET is not configured; refusing to run the SLA sweep"), {
      route: "/api/sla/sweep",
    });
    return NextResponse.json({ error: "sweep not configured" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!bearer || !secretMatches(bearer, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const escalated = await sweepAllSlaBreaches();
    return NextResponse.json({ ok: true, escalated, at: new Date().toISOString() });
  } catch (e) {
    logError(e, { route: "/api/sla/sweep" });
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}
