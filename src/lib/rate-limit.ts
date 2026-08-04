// Rate limiting with a shared store when one is configured, and an in-process
// fallback when it is not.
//
// The in-memory limiter is a `Map` inside one process. On Netlify/Vercel each
// lambda instance holds its own copy, so the limit a caller actually experiences
// is `configured_limit × instance_count` — which under load is no limit at all.
// That is fine for local development and materially wrong in production.
//
// Setting UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN switches every
// caller to a single shared counter with no other code change. The store is
// reached over its REST API rather than a Redis client so this stays dependency-
// free and works on edge runtimes.
//
// If the shared store is unreachable we fail OPEN (allow the request) and log.
// A rate limiter is a cost and abuse control, not an authorization control —
// nothing here is the thing standing between an attacker and your data, and
// taking the whole ingest path down because Redis blipped is the worse failure.

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingSharedRateLimitStore = Boolean(redisUrl && redisToken);

// In-process fixed-window counter. Exported because it is the fallback path and
// because it is directly unit-testable without a network.
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

// Shared fixed-window counter: INCR the key, and set its TTL on first use so the
// window expires on its own. Pipelined into one round trip.
async function sharedRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;

  const res = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", bucket],
      ["EXPIRE", bucket, String(windowSec), "NX"],
    ]),
    // Never let the limiter itself become the latency problem.
    signal: AbortSignal.timeout(1_000),
  });

  if (!res.ok) throw new Error(`rate-limit store responded ${res.status}`);

  const body = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(body?.[0]?.result ?? 0);
  if (!Number.isFinite(count) || count <= 0) throw new Error("rate-limit store returned no count");

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetMs: windowMs - (Date.now() % windowMs),
  };
}

// The entry point every route should use.
export async function checkRateLimit(key: string, limit = 20, windowMs = 60_000): Promise<RateLimitResult> {
  if (!usingSharedRateLimitStore) return rateLimit(key, limit, windowMs);
  try {
    return await sharedRateLimit(key, limit, windowMs);
  } catch (e) {
    console.error("[rate-limit] shared store unavailable, falling back to in-process:", e);
    return rateLimit(key, limit, windowMs);
  }
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

// Key an agent request by its bearer device key, hashed.
//
// Used *before* the device lookup so an unauthenticated caller cannot brute-
// force device keys at full speed, and so one compromised or malfunctioning
// agent cannot exhaust the endpoint for the rest of the fleet. The raw key is
// never used as a cache key — it is a permanent bearer secret and has no
// business sitting in a rate-limit store or a log line.
export async function deviceKeyBucket(deviceKey: string, scope: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deviceKey));
  const hex = Array.from(new Uint8Array(digest).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${scope}:${hex}`;
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
