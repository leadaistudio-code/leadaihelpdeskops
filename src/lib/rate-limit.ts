// Simple in-memory fixed-window rate limiter. Good enough to protect the AI
// routes (which cost money per call) in a single-instance deployment. For
// multi-instance/serverless scale, swap the Map for Redis/Upstash — the
// checkRateLimit signature stays the same.
type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }

  existing.count++;
  const remaining = Math.max(0, limit - existing.count);
  return { ok: existing.count <= limit, remaining, resetMs: existing.resetAt - now };
}

// Resolve a stable identifier for the caller: the signed-in user when
// available, otherwise the client IP from forwarding headers.
export async function callerKey(req: Request, scope: string): Promise<string> {
  let id = "anon";
  try {
    // Lazy import so this module stays free of the Next/Clerk runtime and can be
    // unit-tested in a plain Node environment.
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) id = userId;
  } catch {
    // auth() unavailable (e.g. unauthenticated route) — fall back to IP.
  }
  if (id === "anon") {
    const fwd = req.headers.get("x-forwarded-for");
    id = fwd?.split(",")[0]?.trim() || "unknown";
  }
  return `${scope}:${id}`;
}

// Standard 429 response with a Retry-After header.
export function tooManyRequests(resetMs: number) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please slow down and try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(resetMs / 1000)),
      },
    }
  );
}
