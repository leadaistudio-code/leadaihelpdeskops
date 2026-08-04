import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { envErrors } from "@/lib/env";

// Liveness + readiness probe.
//
// The audit's point was sharp: this product sells fleet observability while
// exposing no way to observe itself, and the pricing page advertised a 99.9%
// uptime SLA with nothing capable of measuring uptime. This is the minimum
// honest answer to "is it up?" — it actually touches the database rather than
// returning a static 200, because a process that is running but cannot reach
// Postgres is down from every caller's point of view.
//
// Deliberately unauthenticated (uptime monitors have no session) and
// deliberately terse: no version strings, no connection details, nothing that
// helps an attacker fingerprint the deployment.

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  let database: "ok" | "unreachable" = "unreachable";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "unreachable";
  }

  const configured = envErrors.length === 0;
  const healthy = database === "ok" && configured;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        database,
        // Names only — never the values, and never why they failed beyond the
        // variable name, which is enough to fix it and useless to an attacker.
        configuration: configured ? "ok" : "invalid",
      },
      latencyMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
