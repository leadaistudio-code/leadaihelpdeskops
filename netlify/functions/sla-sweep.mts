// Scheduled trigger for the SLA breach sweep.
//
// `vercel.json` declares this cron, but the app deploys to Netlify, where that
// file is inert — so the sweep has never actually run in production and breach
// escalation only happened lazily, when somebody opened a ticket. This is the
// Netlify-native equivalent; both files are kept so the cron follows the app if
// it moves back to Vercel.
//
// The function does not do the work itself. It authenticates to the existing
// route with CRON_SECRET, which keeps a single code path (and a single set of
// auth checks) for both schedulers.

export default async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[sla-sweep] CRON_SECRET is not set; the sweep endpoint will refuse the request");
    return new Response("CRON_SECRET not configured", { status: 503 });
  }

  const base = process.env.URL ?? process.env.APP_URL;
  if (!base) {
    console.error("[sla-sweep] No site URL available to call");
    return new Response("site URL not configured", { status: 503 });
  }

  const res = await fetch(`${base}/api/sla/sweep`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`[sla-sweep] ${res.status} ${body}`);
  return new Response(body, { status: res.status });
};

export const config = {
  schedule: "*/15 * * * *",
};
