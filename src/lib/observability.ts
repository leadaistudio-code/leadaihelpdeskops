// Central error sink. Today it logs structured context to the server console;
// it's the single place to wire a real provider (Sentry, Axiom, Datadog) later
// without touching every call site:
//
//   import * as Sentry from "@sentry/nextjs";
//   Sentry.captureException(error, { extra: context });
//
export function logError(error: unknown, context: Record<string, unknown> = {}) {
  const payload = {
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };
  // Structured single-line log so it's grep-able and ready for log shippers.
  console.error("[app-error]", JSON.stringify(payload));
}
