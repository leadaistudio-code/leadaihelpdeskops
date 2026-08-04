# Phase 1 & 13 — Architecture Assessment and Technical Debt

**Scope:** the whole repository as of this audit. Every claim below is traceable to a file and line.

---

## 1. What this system actually is

A **modular monolith** on Next.js 16 App Router, deployed as serverless functions on Netlify, with a
separate native Go agent that runs on customer endpoints.

| Layer | Choice | Assessment |
|---|---|---|
| Framework | Next.js 16.2.9, React 19.2.4 | Current. Reasonable. |
| Data | PostgreSQL via Prisma 7.8 + `@prisma/adapter-pg` driver adapter (`src/lib/prisma.ts`) | Right database. Wrong access pattern at scale (§5). |
| Auth | Clerk 7.5 (`src/middleware.ts`) with Clerk Organizations as the tenant | Sound choice; the integration has holes (Phase 9). |
| AI | Vercel AI SDK 6 + `@ai-sdk/openai`, exclusively `gpt-4o-mini` (`src/lib/ai.ts`) | Works. Single-model, no evals (Phase 7). |
| Endpoint agent | Go 1.22, `gopsutil`, 1,698 LOC (`agent-go/`) | The strongest engineering in the repo (Phase 5). |
| Styling | Tailwind v4, CSS-first config in `src/app/globals.css` | Modern. The theming layer is fragile (Phase 11). |
| Charts | Recharts 3.8 | Fine. |

**Size:** ~19,400 lines in `src/`; 38 pages; 19 API routes; 17 server-action files; 33 Prisma models;
12 test files.

The monolith is the correct choice at this stage. I am **not** going to tell you to move to
microservices — that would be the wrong advice for a team this size, and it is the single most common
way early platforms destroy themselves. The problems below are about *discipline inside the monolith*,
not about its shape.

---

## 2. The central architectural problem: the API surface is undefended by construction

**Your real API is Server Actions, not route handlers.** 17 action files (~3,266 lines) versus 19 route
handlers (~700 lines). This matters more than it appears.

A `"use server"` export is a **public, unauthenticated HTTP POST endpoint**. It is reachable by anyone
who can find its action ID, regardless of what the UI renders. Your own code says so —
`src/lib/auth-utils.ts:59` carries a comment acknowledging exactly this.

But the codebase does not enforce it uniformly. Authorization is applied **per function, by hand,
by memory**:

| Pattern | Where |
|---|---|
| Correct: `requireAgent()` + domain on read *and* write | `src/app/actions/incidentActions.ts:215, 316` |
| Role check inlined by hand, ~12 times | `src/app/actions/dexActions.ts` |
| `requireAgent` re-implemented locally instead of imported | `src/app/actions/groupActions.ts:9` |
| Ad-hoc `requireAdmin` defined in the file that uses it | `src/app/actions/userActions.ts:47` |
| **No authorization at all** | `assetActions.ts` (all 4 exports), `flowActions.ts:25,39`, `slaActions.ts:22,43,49`, `knowledgeActions.ts:11` |

That last row is not a style inconsistency. It is a live vulnerability class, detailed in
[Phase 9](02-security.md). The architectural point is that **the design makes the insecure thing the
default and the secure thing a matter of author diligence.** With 17 action files and one developer,
that is survivable. At 40 files and five developers it is guaranteed breach.

`incidentActions.ts` shows you already know the right pattern. The problem is that nothing *forces* it.

### The fix: make authorization structural, not optional

Wrap every action in a policy-bearing helper so an unprotected action becomes impossible to write
by accident:

```ts
// src/lib/action.ts
export function action<TIn, TOut>(opts: {
  policy: "agent" | "admin" | "authenticated";
  input: z.ZodType<TIn>;
  handler: (input: TIn, ctx: { user: SessionUser; domain: string }) => Promise<TOut>;
}) {
  return async (raw: TIn): Promise<TOut> => {
    const user = await requireRole(opts.policy);   // throws
    const domain = await requireDomain();          // throws — never "global"
    return opts.handler(opts.input.parse(raw), { user, domain });
  };
}
```

Then add an ESLint rule (or a CI grep) that fails the build on any `"use server"` export not created
through `action()`. This converts a recurring human error into a compile-time guarantee. It is roughly
a day of work and it is the highest-leverage refactor in this document.

---

## 3. Data model

33 models. The domain modelling is competent — `SlaInstance` with pause/resume accounting
(`schema.prisma:121`), `NumberCounter` for atomic per-tenant ticket numbering (`:501`), and an
append-only `AuditLog` (`:525`) are all things teams usually get wrong on the first attempt.

**Structural defects:**

| Issue | Location | Consequence |
|---|---|---|
| `Domain` has no foreign keys pointing at it | `schema.prisma:17` | Tenancy is a convention, not a constraint. The database cannot stop a cross-tenant write. |
| `User.email @unique` **globally** | `:23` | The same person cannot exist in two tenants. Fatal for MSPs — your named target market. |
| `Asset.assetTag @unique` **globally** | `:265` | Two customers cannot both use asset tag `LAPTOP-001`. |
| `Attachment` and `DeviceMetric` have **no `domain` column** | `:200`, `:346` | Tenancy is inferred through a parent join. Every query must remember to traverse it. |
| `domain` defaults to the literal `"global"` on 8 models | throughout | A shared bucket that real tenant data can silently fall into (§Phase 9). |
| **No `prisma/migrations/` directory** | verified — does not exist | See below. |

### No migrations is a genuine enterprise blocker

Confirmed: `prisma/` contains only `schema.prisma` and `seed.ts`. The workflow is `prisma db push`.

This means there is **no reproducible way to deploy a schema change**, no history, no rollback, and no
way to prove to an auditor what the production schema was on a given date. Every regulated buyer you
named — banking, healthcare, government — will ask for change control over the data layer. "We push
the schema directly" ends that conversation.

Fix before anything else ships: baseline the current schema as an initial migration
(`prisma migrate diff` → `migrate resolve --applied`), then require migrations in CI.

### Attachments in Postgres

`Attachment.data Bytes` (`schema.prisma:200`) stores file blobs in the database, capped at 5 MB
(`src/app/api/attachments/route.ts:9`). This inflates backup size and restore time, puts binary traffic
through the serverless body limit, and consumes DB connections for what is I/O. Move to S3 (or R2) with
presigned URLs; keep only metadata in Postgres.

---

## 4. Dependency management — two concrete defects

**1. `zod` is imported by 18 source files and is not in `package.json`.** Verified. It resolves today
only as a hoisted transitive dependency of `ai`/`@ai-sdk/openai`, currently v4.3.6 — and the code
depends on v4 semantics (`z.record(z.string(), z.any())`, the two-argument form, at
`src/app/api/agent/metrics/route.ts:22`).

**All of your agent-ingest payload validation and every AI tool schema rests on an undeclared
dependency whose major version is controlled by an unrelated package's resolution.** A routine `ai`
bump, or a change in npm hoisting, silently breaks every ingest endpoint. Declare it explicitly. This
is a one-line fix and it is a genuine production risk today.

**2. Dead dependencies from a removed auth stack.** `bcryptjs` + `@types/bcryptjs` are declared and
never imported. `User.password` (`schema.prisma:23`) is never read or written anywhere. `NEXTAUTH_SECRET`
and `NEXTAUTH_URL` are still in `.env` and in `netlify.toml`'s secret-scan omit list. `openai@^6.44` is
declared but never imported directly — everything goes through the AI SDK. Remove all of it; dead auth
scaffolding is exactly what a security reviewer will latch onto.

---

## 5. Scalability of the architecture (detail in [Phase 10](03-scalability.md))

Four architectural decisions cap this system well below your stated ambitions:

1. **No job queue.** One cron entry exists (`vercel.json`) — and the app deploys to **Netlify**, which
   does not read `vercel.json`. SLA breach escalation therefore runs *only* when a human opens the
   ticket (`escalateIfBreached` called from `getIncidentById`, `incidentActions.ts:192`). Your SLA
   engine is, in production, lazy-evaluated. That is a correctness bug disguised as an infra gap.
2. **In-memory rate limiting** (`src/lib/rate-limit.ts`) on a serverless deploy. Its own header comment
   admits it is single-instance-only. Each lambda has its own bucket; the limits do not hold.
3. **Unbounded telemetry growth.** `DeviceMetric` has no retention, no TTL, no pruning job. At a 30s
   interval that is ~2,880 rows per device per day — ~1M rows/year for a *single* device.
   Aggregation is on-read in JavaScript (`reportActions.ts:136` pulls every row in the window into
   memory and `.reduce()`s it).
4. **Everything is polling.** `src/app/dex/page.tsx:203` fires **11 server actions every 15 seconds**
   per open dashboard — one of which (`getLifecycleArbitrage` → `recomputeHardwarePredictions`) runs an
   N+1 regression recompute over every device in the tenant.

---

## 6. Observability — effectively absent

`src/lib/observability.ts` is 17 lines: one `logError()` that `console.error`s JSON. That is the entire
observability story.

- No error tracking (no Sentry/Datadog/Axiom).
- No metrics, no OpenTelemetry, no `instrumentation.ts`.
- **No health or readiness endpoint** — nothing for a load balancer or uptime monitor to probe.
- Several call sites bypass even `logError` for raw `console.error` (`src/lib/audit.ts:64`,
  `src/app/api/ai/deflect/route.ts:66`, `src/app/actions/userActions.ts:86`).

You are selling a product whose value proposition is *observing other people's fleets*, while running
blind on your own. Buyers notice this. The 99.9% uptime SLA advertised on your pricing page cannot be
measured with the instrumentation currently in the repo — you would have no way to prove or disprove a
breach claim.

---

## 7. Testing

Vitest, 12 files, ~700 lines. `.github/workflows/ci.yml` runs typecheck → lint → test → build. Having
CI at all puts you ahead of most products at this stage, and the tests that exist are well-chosen —
`chat-tools.test.ts` asserts that identity is not a model-supplied parameter, which is a genuinely
sophisticated thing to test.

**But: zero tests for any of the 19 API route handlers, and no tests for `assetActions`, `flowActions`,
`slaActions`, `knowledgeActions`, `problemActions`, `catalogActions`, or `userActions`** — which is
precisely the set carrying the authorization holes. The untested surface and the vulnerable surface are
the same surface. That is not a coincidence; it is cause and effect.

No integration tests, no E2E, no test database, no coverage gate, no `npm audit` or dependency scanning
in CI.

---

## 8. Technical debt inventory (Phase 13)

### Duplication

- **Agent ingest boilerplate repeated 7×.** `boot`, `crashes`, `hardware`, `security`, `software`,
  `surveys`, `metrics` each re-implement the same ~20 lines: read `Authorization`, slice `"Bearer "`,
  401, rate-limit, `device.findUnique`, 401, `safeParse`, 400. And the drift this invites has already
  happened — `commands` and `commands/result` copied the auth half and **omitted the rate-limit half**.
  Extract `withDevice(handler)`.
- **Ticket numbering forked.** `src/lib/ticket-number.ts:allocateNumber` is the correct atomic
  per-tenant allocator. But `api/agent/metrics/route.ts:191` and `api/agent/crashes/route.ts:64` still
  carry the superseded `count()+1` version — and theirs is **not domain-scoped**
  (`prisma.incident.count({ where: { type: "INCIDENT" } })` counts every tenant's incidents) **and is
  racy** against `@@unique([domain, number])`. Two concurrent DEX alerts in one tenant collide and 500.
  The schema comment at `:491-500` describes this exact bug as already fixed. It is not, on these paths.
- **Two ROI calculators differing only in filename case** — `src/components/RoiCalculator.tsx` (honest,
  user-input) and `src/components/roi-calculator.tsx` (hardcoded 60% deflection, 45% MTTR reduction).
  On a case-insensitive filesystem (macOS, Windows — your dev machine) this is a live landmine. They
  also produce *different ROI numbers on the same website*.

### Oversized modules

| File | Lines | Problem |
|---|---|---|
| `src/app/dex/page.tsx` | 1,040 | Single client component: 12 polled data sources, 3 hand-rolled modals, chart config, business logic. Untestable. |
| `src/app/p/[slug]/page.tsx` | 1,004 | 13 marketing pages in one `switch`. |
| `src/app/actions/dexActions.ts` | 761 | 20+ exports, ~12 hand-inlined role checks. |

### Dead and stray code

- `src/components/ProductShowcase.tsx` — 469 lines, imported by nothing.
- `agent/` — the superseded Electron agent, **~190 MB of committed binaries** (`agent/dist/` holds a
  69 MB exe, a 103 MB installer, and a full `win-unpacked/` Chromium tree). Every clone pays for this.
- **15 loose `.mjs` scratch scripts tracked at the repo root** — including `clean_db.mjs`,
  `delete_mock_data.mjs`, `make_admin.mjs`. Destructive database operations sitting next to production
  source, with no guard rails. Commit `d656429` ("Remove scratch files breaking build") suggests these
  have already caused an incident once.
- `tsconfig.tsbuildinfo` (362 KB) and `dev-out.log` committed.

### TODO density: zero

Not a single TODO/FIXME/HACK marker across 19,400 lines. Combined with unusually thoughtful explanatory
comments, this suggests known issues get written into prose rather than tracked. That reads well but
means **there is no machine-readable backlog of known defects** — which is why several "already fixed"
issues (the ticket-numbering race) are still live on paths the author forgot about.

---

## 9. Architecture scorecard

| Dimension | Score | One-line justification |
|---|---:|---|
| Module boundaries | 5/10 | Sensible monolith; authorization is per-function rather than structural. |
| Data model | 5/10 | Competent domain modelling; global uniques and no FK-backed tenancy break the MSP case. |
| API design | 4/10 | Server-actions-as-API with hand-applied authz; no versioning; no public API at all. |
| Dependency hygiene | 4/10 | Undeclared `zod` carrying all validation; dead auth stack still present. |
| Config & secrets | 5/10 | `.env` correctly gitignored, no hardcoded secrets — but zero env validation. |
| Deployment | 3/10 | No migrations, no IaC, cron that doesn't fire, serverless limits already worked around. |
| Testing | 4/10 | Real CI and well-chosen unit tests; zero coverage of the vulnerable surface. |
| Observability | 2/10 | `console.error` and nothing else. No health endpoint. |
| **Overall architecture** | **5/10** | Good bones, correct framework choices, real engineering — undermined by the absence of enforced invariants. |

---

## 10. The five changes that matter most

1. **`action()` wrapper + lint rule** making unauthorized server actions impossible to write. (~1 day)
2. **Baseline Prisma migrations** and require them in CI. (~0.5 day)
3. **Declare `zod`**, delete the dead auth stack, purge `agent/` binaries and root scratch scripts
   from git history. (~1 day)
4. **Extract `withDevice()`** for the 7 duplicated ingest handlers, and route both stray call sites
   through `allocateNumber()`. (~1 day)
5. **Add Sentry + a `/api/health` endpoint + env validation at boot.** (~1 day)

One engineer-week removes the majority of the architectural risk in this document. That is an unusually
good ratio, and it reflects that the underlying design is sound — the gaps are in enforcement, not in
conception.
