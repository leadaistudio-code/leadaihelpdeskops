import { z } from "zod";

// Validate configuration once, at module load, instead of discovering a missing
// or malformed variable at the first request that happens to need it.
//
// The split matters: `required` variables are ones the application cannot serve
// a single authenticated request without, so a bad value should be loud and
// immediate. `optional` variables gate a feature — an unset RESEND_API_KEY means
// email is skipped, not that the deploy is broken — so they are typed but not
// enforced.
//
// Build time is exempt. `next build` prerenders pages in an environment that
// legitimately has no database, and failing there would break CI for a reason
// that has nothing to do with correctness at runtime.

const required = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "DATABASE_URL must be a postgres:// connection string"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
});

const optional = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  // Inbox that "Request a demo" / contact submissions are forwarded to.
  LEAD_NOTIFY_EMAIL: z.string().email().optional(),
  APP_URL: z.string().url().optional(),
  WALKUP_TENANT_DOMAIN: z.string().min(1).optional(),
  SEED_DOMAIN: z.string().min(1).optional(),
  DEX_AGENT_DOWNLOAD_URL: z.string().url().optional(),
  // The scheduler's shared secret. Optional to *parse*, but `/api/sla/sweep`
  // refuses to run without it — see that route.
  CRON_SECRET: z.string().min(16, "CRON_SECRET should be at least 16 characters").optional(),
});

export type AppEnv = z.infer<typeof required> & z.infer<typeof optional>;

// Unit tests import modules that transitively reach Prisma (and therefore this
// file) without ever opening a connection, so a missing DATABASE_URL there is
// expected rather than a misconfiguration worth shouting about.
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build" ||
  process.env.VITEST === "true";

function parseEnv(): { env: Partial<AppEnv>; errors: string[] } {
  const errors: string[] = [];

  const r = required.safeParse(process.env);
  if (!r.success) {
    errors.push(...r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }

  const o = optional.safeParse(process.env);
  if (!o.success) {
    errors.push(...o.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }

  return { env: { ...(r.success ? r.data : {}), ...(o.success ? o.data : {}) }, errors };
}

const result = parseEnv();

// Names of the variables that failed validation. `/api/health` reports this so
// a misconfigured deploy is visible from outside rather than only in logs.
export const envErrors: string[] = result.errors;

if (envErrors.length > 0 && !isBuildPhase) {
  const message = `Invalid environment configuration:\n  - ${envErrors.join("\n  - ")}`;
  if (process.env.NODE_ENV === "production") {
    // Fail at boot. A production deploy that cannot reach its database or
    // verify a session is not partially working; it is broken, and it should
    // say so before it starts accepting traffic.
    throw new Error(message);
  }
  console.warn(`[env] ${message}`);
}

export const env = result.env as AppEnv;
