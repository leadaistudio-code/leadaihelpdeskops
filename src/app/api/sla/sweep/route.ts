import { NextRequest, NextResponse } from "next/server";
import { sweepAllSlaBreaches } from "@/app/actions/slaActions";

// Scheduled SLA breach sweep. A scheduler (Vercel Cron, or any external cron)
// hits this to escalate breaches on tickets nobody is actively viewing.
//
// Secure it with CRON_SECRET — Vercel Cron automatically sends it as
// `Authorization: Bearer <CRON_SECRET>`. If CRON_SECRET is unset (local dev),
// the endpoint is open so it can be triggered manually.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const escalated = await sweepAllSlaBreaches();
  return NextResponse.json({ ok: true, escalated, at: new Date().toISOString() });
}
