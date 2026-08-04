# Phase 9 — Enterprise Security Review

**Verdict: 2/10. This application must not be deployed to a production tenant carrying real customer
endpoints in its current state.**

That is a strong statement, so here is the standard I am applying: this product installs an agent that
executes commands as a privileged process on employee laptops. The blast radius of a defect is not
"data leak" — it is "attacker runs arbitrary code on every machine in the customer's fleet." Software in
that category is held to a higher bar than a normal SaaS CRUD app, and it should be.

Every finding below was verified by reading the source. No finding is inferred.

---

## P0 — Fix before this touches another customer endpoint

### P0-1. Remote code execution on every endpoint in a tenant

**`src/app/actions/dexActions.ts:733`**

```ts
export async function deployGlobalAgenticScript(prompt: string, script: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  const domain = await getActiveDomain();
  const devices = await prisma.device.findMany({ where: { domain }, ... });
  const actionStr = `RUN_SCRIPT: ${script.trim()}`;
  const commands = devices.map(d => ({ deviceId: d.id, action: actionStr, domain }));
  await prisma.remoteCommand.createMany({ data: commands });
```

**The `script` is a client-supplied parameter.** The intended flow is
`generateGlobalAgenticScript()` (which asks GPT-4o-mini to write PowerShell and refuses if the model
sets `isUnsafe`) followed by `deployGlobalAgenticScript()`. But these are two independent server
actions, and a server action is a public HTTP endpoint. **Any caller can invoke
`deployGlobalAgenticScript` directly with arbitrary PowerShell and skip the generation step and its
safety gate entirely.**

On the endpoint, `agent-go/remediate.go:16-22` handles it:

```go
if strings.HasPrefix(action, "RUN_SCRIPT:") {
    script := strings.TrimSpace(action[len("RUN_SCRIPT:"):])
    if win { return true, ps(script) }   // executes verbatim
    return true, sh(script)
}
```

This check sits **above** the `ALLOWED_ACTIONS` switch, so the allowlist is never consulted. There is no
signature, no server-side allowlist, no sandbox, no dry-run, and no second-person approval.

**Impact chain:** compromise (or simply misuse of) *one* IT_AGENT account → arbitrary code execution as
the agent process on **every enrolled device in that tenant**, simultaneously. For an MSP tenant, that is
every device across every client they manage.

Note the privilege level too: `IT_AGENT`, not `ADMIN`. Help-desk staff — typically your least-hardened,
highest-turnover accounts, often contractors — can do this.

**Remediation:**
1. Delete the `RUN_SCRIPT:` branch from `agent-go/remediate.go`. The agent must execute **only** named
   actions from its compiled-in vocabulary. This is the single most important change in this document.
2. If arbitrary scripting is a genuine product requirement, it must be: server-side allowlisted →
   signed with an asymmetric key the agent verifies → approved by a *second* human (`ADMIN`, not the
   requester) → executed on a canary ring before fleet-wide rollout → rate-limited and revocable.
3. Never let an LLM's self-assessment be a security control. `isUnsafe` at `dexActions.ts:720` asks the
   model that wrote the script to grade its own safety. That is not a control; it is a suggestion, and
   it is trivially bypassed by prompt injection *and* by simply not calling that function.

---

### P0-2. Server actions with no authorization

Verified — these are public HTTP endpoints callable by **any** signed-in user, and in some paths by
unauthenticated callers:

| File | Exports | Exposure |
|---|---|---|
| `src/app/actions/assetActions.ts` | `createAsset`, `getAssets`, `getAssetById`, `updateAssetStatus` | **Entire file has no auth check.** Read and write the asset register. |
| `src/app/actions/flowActions.ts` | `saveFlow`, `deleteFlow` | No auth. Backs `/admin/flow-designer`. |
| `src/app/actions/slaActions.ts:22, 43, 49` | `createSlaDefinition`, `toggleSlaStatus`, `deleteSlaDefinition` | No auth. **An employee can delete the SLA policies that govern their own tickets.** |
| `src/app/actions/knowledgeActions.ts:11` | `createKnowledgeArticle` | No auth, **and `authorId` is read from client FormData** (`:14`) — authorship is forgeable. Publish content under a colleague's name. |

**Missing role check (domain-scoped, but any EMPLOYEE can drive ITIL Problem records):**
`problemActions.ts:118, 134, 145, 177` — `linkIncidentToProblem`, `unlinkIncidentFromProblem`,
`updateProblemState`, `updateProblemDetails`.

**Remediation:** the `action()` wrapper from [Phase 1 §2](01-architecture.md). Per-function fixes will
regress; make it structural.

---

### P0-3. Cross-tenant writes via unscoped `where: { id }`

These pass a role check but omit the tenant filter, so a valid user of tenant A can mutate tenant B's
rows by supplying an ID:

| Location | Operation |
|---|---|
| `src/app/actions/assetActions.ts:59` | `prisma.asset.update({ where: { id } })` |
| `src/app/actions/flowActions.ts:40` | `prisma.flow.delete({ where: { id } })` |
| `src/app/actions/slaActions.ts:44, :50` | toggle / delete SLA definition |
| `src/app/actions/dexActions.ts:557, :569` | `toggleSmartContract`, `deleteSmartContract` (role-checked, tenant-blind) |

**The SmartContract pair is the severe one.** `SmartContract` rows (`schema.prisma:661`) are
if-metric-then-action rules evaluated on every metrics POST that **automatically queue remediation
commands to endpoints**. Cross-tenant control of those rows means cross-tenant influence over what
executes on another customer's machines.

Cross-tenant data access is the finding that ends enterprise deals outright. In a multi-tenant SaaS
security questionnaire it is usually a single disqualifying question.

**Remediation:** every mutation becomes `where: { id, domain }`. `incidentActions.ts:316` already does
this correctly — copy that pattern. Then add the defence-in-depth layer: **PostgreSQL Row-Level
Security**, so the database rejects a cross-tenant write even when the application forgets.

---

### P0-4. Tenancy fails open to a shared `"global"` bucket

Two verified defects compound:

```ts
// src/lib/tenant.ts:10-17
export async function getActiveDomain(): Promise<string> {
  try {
    const { orgId } = await auth();
    return orgId ?? "global";
  } catch {
    return "global";          // ← any auth failure silently becomes a real tenant name
  }
}
```

```ts
// src/middleware.ts:20
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)', '/api/(.*)']);
```

The middleware comment says users without an org are redirected to onboarding — but `/api/(.*)` is in
the exemption list, so **every API route skips that check**. A signed-in user with no active
organization reaches every API route, and `getSessionUser()` (`auth-utils.ts:51`) writes
`domain: "global"` onto their user record. Eight models also *default* `domain` to `"global"`.

The result is a real, writable, shared tenant that unassigned users and mis-defaulted rows fall into.
The fail-open `catch` makes this reachable from any transient Clerk error.

**Remediation:** `getActiveDomain()` must **throw** when there is no `orgId` — never substitute a
string. Remove `/api/(.*)` from `isOnboardingRoute` and whitelist only the genuinely pre-tenant routes.
Remove every `@default("global")` and backfill existing rows deliberately.

---

### P0-5. Fabricated customer proof on the public site

**`src/app/p/[slug]/page.tsx:203-206`** publishes "52% Faster Resolution", **"3.4M Tickets Deflected"**,
**"1.2M Employees Supported"**, "99.9% SLA Compliance" — and `:211-229` presents three invented
testimonials attributed to invented organisations ("Global manufacturing · 14,000 employees",
"$2.1M downtime avoided").

Your own landing page at `src/app/page.tsx:456` says: *"LeadAIStudio is new. We're onboarding our first
IT teams by hand."*

This is not a code defect, but it is a P0 business risk and it belongs in a security review because it
is the category of claim that gets discovered during procurement diligence:

- **Regulatory exposure.** Fabricated performance statistics and invented testimonials are deceptive
  advertising under the FTC Act §5 (US) and the CPUTR/ASA regime (UK/EU). The FTC's endorsement rules
  specifically prohibit testimonials from non-existent customers.
- **Procurement failure.** Every enterprise buyer asks for referenceable customers. "3.4M tickets
  deflected" invites "from which customers, and may we call two of them?" There is no good answer.
- **It poisons your true claims.** The genuinely impressive things in this codebase — real regression-
  based prediction, a working closed-loop remediation channel — become unbelievable once a buyer finds
  one fabricated number.

The same page advertises **"SSO, SCIM & advanced RBAC"** (`:304`) on the Enterprise tier. I grepped the
entire `src/` tree: that string is the *only* occurrence of SCIM or SAML anywhere in the repository.
You are selling a capability that does not exist in any form. Same for the "99.9% uptime SLA" — you have
no health endpoint and no monitoring with which to measure it.

**Remediation:** remove all fabricated statistics and testimonials today. Replace with honest
early-stage positioning — the landing page already models this well. Move SSO/SCIM to a clearly labelled
roadmap section. Do not advertise an uptime SLA until you can measure uptime.

---

## P1 — Fix before the first paying enterprise customer

### P1-1. Enrollment tokens are permanent, unrevocable, and travel in URLs

`EnrollmentToken` (`schema.prisma:389`) is `{ domain, token, createdAt }` — **no expiry, no use counter,
no revocation, no rotation.** One token per tenant, valid forever.

`src/app/api/agent/download/route.ts:105` accepts it as a **query-string parameter**, so it lands in
CDN logs, proxy logs, browser history, and `Referer` headers. Anyone who obtains it can enrol a rogue
device into the tenant indefinitely — and enrolled devices receive queued commands.

**Fix:** short-TTL, single-use, revocable enrollment tokens; move to `POST` body or an `Authorization`
header; add a tenant-visible enrollment audit and a revoke-all control.

### P1-2. `/api/agent/download` is fully public

On the public route matcher with no authentication — the agent binary is served to anyone. Combined with
no code signing (P1-3), this hands an attacker your exact binary for offline analysis and trivial
trojanisation.

### P1-3. No code signing on the agent

`agent-go/build.ps1` runs `go build` with no `signtool` step, and CI has no Go build or release job at
all. Consequences: SmartScreen and Defender warnings on install (a real deployment blocker in
enterprises), no way for a customer to verify authenticity, and **no way to distinguish your agent from
a trojanised copy**. An unsigned binary that executes remote commands will be rejected outright by any
mature security team.

**Fix:** EV code-signing certificate, signing in CI, publish SHA-256 checksums, and Authenticode for
Windows / notarization for macOS.

### P1-4. In-memory rate limiting on serverless

`src/lib/rate-limit.ts` is an in-process `Map`; its own comment (lines 1-4) admits it is single-instance
only. On Netlify each lambda instance keeps a separate bucket, so effective limits are
`configured_limit × instance_count` — unbounded under load. **`/api/agent/commands` and
`/api/agent/commands/result` have no rate limit at all.**

**Fix:** Upstash Redis or equivalent shared store; add limits to the two command endpoints.

### P1-5. `/api/sla/sweep` is open when `CRON_SECRET` is unset

```ts
if (secret) { /* check */ }   // no secret configured → no check at all
```

Fails open, uses non-constant-time `!==` comparison, is on the public route matcher, and `CRON_SECRET`
is **not in `.env.example`** — so a fresh deploy is unprotected by default. It triggers cross-tenant
work.

**Fix:** fail closed, `crypto.timingSafeEqual`, document the variable.

### P1-6. No MFA enforcement, no SSO, no SCIM

Clerk supports MFA, but nothing in this application enforces or verifies it —
`src/components/Header.tsx:303` simply directs users elsewhere. There is no step-up authentication for
destructive operations (fleet-wide script deployment requires no re-authentication).

No SAML, no OIDC federation, no SCIM provisioning/deprovisioning. **SCIM deprovisioning is a hard
requirement in regulated industries** — when HR terminates an employee, their access must drop
automatically. You cannot answer that question today.

### P1-7. Role/permission model is too coarse

`Role { ADMIN, IT_AGENT, EMPLOYEE }` plus a `moduleAccess String[]`. No ABAC, no custom roles, no
delegation, no field-level permissions, no separation of duties. Enterprises need "can approve changes
but not deploy scripts", "read-only auditor", "regional admin scoped to EMEA". Three roles cannot express
any of these — and as P0-1 shows, the coarseness is itself a security problem: `IT_AGENT` currently
implies fleet-wide code execution.

### P1-8. Audit log immutability is convention, not enforcement

`src/lib/audit.ts` only ever calls `create`, and the schema comment says "append-only" — but there is no
DB trigger, no revoked UPDATE/DELETE grant, no hash chain, no signature, no WORM storage. Anyone with
`DATABASE_URL` can rewrite history. `logAudit` is also best-effort and swallows its own failures
(`audit.ts:64`), so audit records can be silently lost.

Worse, it is applied **inconsistently** — present in `incidentActions`, `problemActions`, `userActions`,
`dexActions`; absent from `assetActions`, `flowActions`, `slaActions`, `knowledgeActions`. An audit log
with gaps is worse than none, because it creates false confidence.

**Fix for SOC 2:** hash-chain each entry (`hash = H(prev_hash || payload)`), revoke UPDATE/DELETE from
the application role, ship to append-only external storage, and make `logAudit` failures loud.

---

## P2 — Before SOC 2 / regulated verticals

| Finding | Detail |
|---|---|
| **No env validation** | `DATABASE_URL` goes straight into `new Pool()` (`src/lib/prisma.ts:5`). Misconfiguration fails at first use, not at boot. Add a zod env schema. |
| **No encryption at rest controls** | Relies on the hosting provider's default. No column-level encryption for PII, no customer-managed keys (a common banking/healthcare requirement). |
| **No data retention or deletion** | `DeviceMetric` grows forever. **No GDPR erasure path** — no way to delete a data subject's telemetry. No documented retention schedule. |
| **No supply-chain security** | No `npm audit`/Snyk/Dependabot in CI, no SBOM, no lockfile-integrity policy, no pinned base images. For an agent vendor, an SBOM is increasingly a procurement requirement. |
| **No secrets management** | Environment variables only. No Vault/AWS Secrets Manager, no rotation policy. `deviceKey` is a permanent bearer secret with no rotation. |
| **No security headers / CSP** | No `Content-Security-Policy`, HSTS, or `X-Frame-Options` configured in `next.config.ts`. |
| **No threat model, no pen test, no SDLC** | No documented threat model, no third-party penetration test, no security review gate, no vulnerability disclosure policy or `security.txt`. |
| **`seedDemoData()` writes fake data into real tenants** | `dexActions.ts:55-101` auto-inserts fabricated crashes, software usage, a security posture, and a smart contract into any tenant with empty tables — on every `getDexSummary()` call. A customer's first login silently populates their "security posture" with fiction. |

---

## OWASP Top 10 (2021) assessment

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | **FAIL — critical** | P0-2, P0-3, P0-4. Missing authz, cross-tenant writes, fail-open tenancy. |
| A02 | Cryptographic Failures | **WEAK** | Agent does not enforce TLS (`agent-go/config.go` — scheme comes from config); no signing; permanent bearer secrets. |
| A03 | Injection | **FAIL — critical** | P0-1. Deliberate arbitrary command execution as a feature. |
| A04 | Insecure Design | **FAIL** | LLM self-assessment as a security control; no approval gate on fleet-wide execution. |
| A05 | Security Misconfiguration | **WEAK** | Fail-open cron secret; no CSP/HSTS; `"global"` default tenant. |
| A06 | Vulnerable Components | **UNKNOWN** | No scanning in CI. Undeclared `zod` means an unpinned transitive dependency validates all input. |
| A07 | Auth Failures | **WEAK** | Clerk is solid, but no MFA enforcement, no step-up, permanent enrollment tokens. |
| A08 | Data/Software Integrity | **FAIL** | Unsigned agent binary that executes remote commands. No update integrity. |
| A09 | Logging & Monitoring | **FAIL** | `console.error` only; no alerting; mutable audit log with gaps. |
| A10 | SSRF | **PASS** | No user-controlled outbound fetch found. |

---

## Compliance readiness

| Framework | Readiness | The blocking items |
|---|---|---|
| **SOC 2 Type II** | **Not ready — 9-12 months** | No access-control enforcement (CC6.1), mutable audit log (CC7.2), no change management (CC8.1 — you have no migrations), no monitoring (CC7.1), no vendor management, no formal policies. |
| **ISO 27001** | **Not ready** | No ISMS, no risk register, no asset classification, no documented controls. |
| **GDPR** | **Not ready** | No erasure path, no retention policy, no DPA, no data-residency control, no processing register. You collect employee telemetry — GDPR applies squarely, and works-council approval is required in Germany/France for this data class. |
| **HIPAA** | **Not ready** | No BAA, no encryption-at-rest controls, no access review. Device telemetry in a hospital touches PHI-adjacent data. |
| **PCI-DSS** | **N/A directly** | But P0-1 means an agent on a cardholder-data-environment endpoint is itself a finding. |
| **FedRAMP** | **Not ready — years** | Requires FIPS 140-2 crypto, US-person support staff, continuous monitoring, GovCloud deployment, and ~325 controls. Do not pursue until the rest is done. |

---

## Prioritized remediation plan

### Week 1 — stop the bleeding
1. Remove the `RUN_SCRIPT:` branch from `agent-go/remediate.go`; ship an agent update. **(P0-1)**
2. Remove fabricated statistics, testimonials, and the SSO/SCIM/uptime-SLA claims from the site. **(P0-5)**
3. Add authorization to `assetActions`, `flowActions`, `slaActions`, `knowledgeActions`. **(P0-2)**
4. Add `domain` to all six unscoped mutations. **(P0-3)**
5. Make `getActiveDomain()` throw; remove `/api/(.*)` from `isOnboardingRoute`. **(P0-4)**
6. Declare `zod` in `package.json`.

### Weeks 2-4 — structural
7. `action()` wrapper + lint rule; migrate all 17 action files.
8. PostgreSQL Row-Level Security on every tenant-scoped table.
9. Baseline Prisma migrations.
10. Short-TTL revocable enrollment tokens; move out of the query string.
11. Shared-store rate limiting; cover the command endpoints.
12. Fail-closed `CRON_SECRET` with constant-time comparison.
13. Sentry, `/api/health`, env validation at boot.

### Months 2-3 — enterprise baseline
14. Code-sign the agent; wire the Go build into CI with checksums.
15. Enforce MFA; step-up auth for destructive operations.
16. Hash-chained audit log; revoke UPDATE/DELETE; apply it to every mutating action.
17. Data retention + GDPR erasure.
18. `npm audit` + Dependabot + SBOM in CI.
19. Security headers and CSP.
20. Third-party penetration test.

### Months 4-9 — compliance
21. SAML/OIDC SSO and SCIM provisioning.
22. Granular RBAC/ABAC with custom roles and separation of duties.
23. SOC 2 Type II programme.
24. Documented threat model and secure SDLC; vulnerability disclosure policy.

---

## What is genuinely well done

Being accurate about this matters, because it shows the team can build securely when it decides to:

- **AI tool identity design** (`src/lib/chat-tools.ts:9`). Identity is *never* a model-supplied
  parameter — `viewer` and `domain` are captured in the `execute` closure from the session, so the model
  physically cannot request another user's tickets. There is a unit test asserting the schemas contain
  no identity field. This is a more sophisticated defence than most production AI features ship with.
- **Fleet Copilot is read-only by construction** (`src/lib/fleet-tools.ts`), with risk classification
  computed in TypeScript rather than delegated to the model.
- **`incidentActions.ts`** is a genuinely well-secured module: `requireAgent()`, domain on read *and*
  write, employee-vs-agent note filtering, rejection of forged `SYSTEM` note types, and
  assignee-must-be-in-tenant validation.
- **Device command results are correctly scoped** — `updateMany({ where: { id, deviceId } })` means a
  device cannot close another device's commands.
- **Payload validation via zod on 8 of 9 ingest endpoints**, with bounded numerics and string caps.
- **`.env` correctly gitignored; no hardcoded secrets anywhere** in `src/` or `scripts/`.

The pattern is clear: where the author was thinking about security, the work is above average. The
failures are all in the places where the framework let them not think about it. That is a fixable
problem, and it is why the Week 1 list is short.
