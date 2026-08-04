# Phase 14 — Prioritized Roadmap

**Effort:** S = 1-3 days · M = 1-3 weeks · L = 1-2 months · XL = 3+ months
**Impact:** business value · **Risk:** technical risk of the change itself

---

## CRITICAL — before this touches another customer endpoint

Nothing else on this roadmap should start until these are done. Most are hours, not weeks.

| # | Item | Effort | Impact | Risk | Why |
|---|---|:--:|:--:|:--:|---|
| C1 | **Remove `RUN_SCRIPT:` from `agent-go/remediate.go`** and ship an agent update | S | Critical | Low | RCE on every endpoint in a tenant ([Phase 9](02-security.md) P0-1) |
| C2 | **Remove fabricated stats, testimonials, SSO/SCIM and uptime-SLA claims** from the site | S | Critical | None | Deceptive-advertising exposure; destroys credibility on discovery |
| C3 | **Add authorization** to `assetActions`, `flowActions`, `slaActions`, `knowledgeActions` | S | Critical | Low | Unauthenticated public endpoints |
| C4 | **Domain-scope the six unscoped mutations** (`where: { id, domain }`) | S | Critical | Low | Cross-tenant writes, incl. remediation rules |
| C5 | **Make `getActiveDomain()` throw**; remove `/api/(.*)` from `isOnboardingRoute` | S | Critical | Med | Tenancy fails open to a shared `"global"` bucket |
| C6 | **Declare `zod`** in `package.json` | S | High | None | All input validation rests on an undeclared transitive dep |
| C7 | **Remove `seedDemoData()`** from the production path | S | High | Low | Writes fabricated security posture into real tenants |
| C8 | **Route both alert paths through `allocateNumber()`** | S | High | Low | Cross-tenant `count()` + a race that 500s |

**Total: roughly one week.** This is the highest value-per-hour work in the document by a wide margin.

---

## HIGH — first paying enterprise customer (months 1-3)

### Security and trust

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| H1 | `action()` wrapper + lint rule; migrate all 17 action files | M | Critical | Med |
| H2 | PostgreSQL Row-Level Security on tenant-scoped tables | M | Critical | Med |
| H3 | Baseline Prisma migrations; require in CI | S | High | Low |
| H4 | **EV code signing** for the agent; Go build + release job in CI | M | Critical | Low |
| H5 | Short-TTL, single-use, revocable enrollment tokens; out of the query string | M | High | Low |
| H6 | Shared-store rate limiting (Redis); cover the command endpoints | S | High | Low |
| H7 | Fail-closed `CRON_SECRET` + constant-time compare | S | Med | None |
| H8 | Hash-chained audit log; revoke UPDATE/DELETE; apply to every mutating action | M | High | Low |
| H9 | Enforce MFA; step-up auth for destructive operations | M | High | Low |
| H10 | Security headers, CSP, HSTS | S | Med | Low |
| H11 | `npm audit` + Dependabot + SBOM in CI | S | Med | None |

### Reliability

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| H12 | **Job queue** — and make the SLA sweep actually run | M | Critical | Med |
| H13 | Sentry + `/api/health` + env validation at boot | S | High | Low |
| H14 | Connection pooler (PgBouncer/Supavisor) | S | High | Low |
| H15 | **Telemetry retention + partitioning + hourly rollups** | M | Critical | Med |
| H16 | Move `recomputeHardwarePredictions` off the render path | S | High | Low |
| H17 | Pagination/limits on unbounded queries | S | High | Low |
| H18 | **Agent offline buffering + batched gzipped transmission** | M | High | Med |
| H19 | Agent self-update with signed manifests and rollout rings | L | Critical | High |

### Product

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| H20 | **Change Management** with CAB, calendar, approvals | L | Critical | Med |
| H21 | **Replace fabricated dashboard charts with real data** | S | High | None |
| H22 | **Surface boot time, login time, packet loss, WiFi** (already collected) | S | High | None |
| H23 | Responsive app shell; employee portal on mobile | M | High | Low |
| H24 | **SSO/SAML + SCIM provisioning** | L | Critical | Med |
| H25 | Radix primitives; dialog semantics and focus management; `axe-core` in CI | M | High | Low |
| H26 | Fix contradictory pricing; fix `/p/resources` 404 | S | Med | None |

---

## MEDIUM — competitive parity (months 4-9)

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| M1 | **macOS agent** with launchd + notarization | L | Critical | Med |
| M2 | **Teams/Zoom experience monitoring** | L | Critical | Med |
| M3 | Real CMDB with CI relationships, auto-populated from discovery | L | High | Med |
| M4 | Alert correlation and storm suppression | M | High | Low |
| M5 | Major Incident Management | M | High | Low |
| M6 | **AI evaluation harness** — golden sets, offline evals, online metrics | M | High | Low |
| M7 | pgvector + hybrid retrieval + rerank | M | High | Low |
| M8 | Ticket/thread summarisation; duplicate detection | S | High | Low |
| M9 | **Experience score v2** — three-pillar, time-weighted, with sentiment | M | High | Low |
| M10 | Executive + manager dashboards; add `MANAGER` role | M | High | Low |
| M11 | Patch and vulnerability compliance | M | High | Med |
| M12 | Approval chains; multi-tier escalation; on-call | M | Med | Low |
| M13 | Task management (sub-tasks, dependencies) | M | Med | Low |
| M14 | Asset lifecycle fields; link `Asset` ↔ `Device` | S | Med | Low |
| M15 | ChatOps (Teams + Slack) | M | High | Low |
| M16 | Public REST API + outbound webhooks | M | High | Low |
| M17 | **SOC 2 Type II programme** | XL | Critical | Low |
| M18 | Windows service (replacing scheduled task) with tamper protection | M | High | Med |
| M19 | Signed, versioned remediation library with approval workflow | M | High | Med |
| M20 | Data retention policy + GDPR erasure | M | High | Low |
| M21 | AWS migration (Aurora, Fargate, S3, Secrets Manager) | L | High | High |
| M22 | Per-tenant business hours and timezones | S | Med | Low |
| M23 | Delete `agent/`; purge ~190 MB of binaries from git history | S | Low | Low |

---

## NICE TO HAVE (months 10-18)

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| N1 | ClickHouse for telemetry | L | High | High |
| N2 | SSE replacing dashboard polling | M | Med | Low |
| N3 | Flow runtime — or remove the designer | L / S | Med | Med |
| N4 | Release Management | M | Med | Low |
| N5 | Vendor and contract management | M | Med | Low |
| N6 | Custom report builder; scheduled delivery; export | M | Med | Low |
| N7 | Three-pane agent workspace with keyboard shortcuts | M | High | Low |
| N8 | Mobile app / PWA for the employee portal | L | Med | Med |
| N9 | VPAT + WCAG 2.1 AA certification | M | High | Low |
| N10 | EU data residency | L | High | High |
| N11 | mTLS with per-device certificates | M | High | Med |
| N12 | Semantic theme tokens replacing the override layer | M | Med | Med |
| N13 | MCP server exposing ITSM/DEX data | S | Med | Low |
| N14 | Marketplace / integration directory | L | Med | Low |

---

## FUTURE INNOVATION (18+ months)

| # | Item | Effort | Impact | Risk |
|---|---|:--:|:--:|:--:|
| F1 | **Cross-tenant anonymised benchmarking** | XL | Very High | High |
| F2 | **Prediction outcome tracking → self-improving model** | M | Very High | Med |
| F3 | Diagnostic agent — iterative hypothesis testing with human-approved remediation | L | High | High |
| F4 | Remediation success-rate library as a community asset | L | High | Med |
| F5 | Vertical editions (healthcare, manufacturing, financial services) | XL | Very High | Med |
| F6 | Change-risk prediction from historical outcomes | M | High | Med |
| F7 | On-demand live device query (Tanium-lite) | L | High | High |
| F8 | Proactive recommendation engine | M | High | Low |
| F9 | FedRAMP | XL | High | High |

> **F2 deserves attention now despite its position here.** Today `recomputeHardwarePredictions` deletes
> and recreates predictions, destroying the historical record. Simply *versioning predictions and
> recording whether each came true* costs days and is the seed corn of a genuine model moat
> ([Phase 12](10-product-and-business.md)). Do the recording part in the next three months even if the
> model work waits two years.

---

## 12-month plan

### Q1 — Make it safe and true
Critical list (week 1) · H1-H3, H6, H7, H10, H13, H14, H16, H17 · H21, H22, H26 · start H20 (Change
Management) and H12 (job queue).

**Exit criteria:** no known P0s; SLA sweep actually runs; dashboards show only real data; marketing claims
are true; migrations in CI.

### Q2 — Make it deployable in an enterprise
H4, H5, H8, H9, H11 · H15, H18, H19 · finish H20 · H23, H24, H25 · start M17 (SOC 2) · M6.

**Exit criteria:** signed self-updating agent; SSO/SCIM live; Change Management shipped; mobile portal;
SOC 2 audit underway; telemetry retention working.

### Q3 — Reach competitive parity
M1 (macOS) · M2 (Teams/Zoom) · M4, M5 · M7, M8, M9 · M10 · M15, M16 · M18, M19.

**Exit criteria:** macOS shipped; collaboration experience live; correlation working; public API; exec
dashboards.

### Q4 — Differentiate
M3 (CMDB) · M11 (patch) · M20, M21 · N7, N9 · F2 (outcome tracking) · first vertical edition · SOC 2
Type II report issued.

**Exit criteria:** SOC 2 complete; CMDB real; VPAT published; prediction outcomes recorded; 10+
referenceable customers.

---

## Sequencing notes

**Do not parallelise the critical list with feature work.** One week of focus removes the majority of
existential risk. Feature work built on top of an unfixed authorization model has to be revisited anyway.

**H1 (`action()` wrapper) before any new modules.** Change Management adds a dozen new server actions.
Building them on the current hand-rolled pattern reproduces the vulnerability class in a module that
governs production change control — the worst possible place for it.

**H15 (retention) before signing a 1,000-employee customer.** Without it, `DeviceMetric` reaches ~1.26B
rows in the first year and the system degrades to unusable. This is the hardest technical ceiling in the
product.

**H19 (self-update) is on the critical path for everything else.** Until you can ship agent updates
remotely, every agent-side fix — including C1 — requires customer action. Ironically, C1 will be your
last manually-distributed update; build H19 immediately after.

**M17 (SOC 2) takes 6-12 months of elapsed time but little engineering.** Start the programme in Q2 so
the report lands when you need it commercially, not when you start wanting it.

---

## Resourcing

At current pace this is roughly **3-4 engineer-years**. With one engineer, Q1 and part of Q2 are
achievable in twelve months — meaning security, reliability, and Change Management, but not macOS,
collaboration monitoring, or SOC 2.

**If you can hire, the highest-leverage first three roles are:**
1. **A security-minded backend engineer** — owns the critical list, `action()`, RLS, and the agent trust
   model.
2. **A Go/systems engineer** — owns the agent: signing, buffering, self-update, service model, macOS.
   This is the most under-resourced surface relative to its strategic importance.
3. **A frontend engineer** — owns responsive, accessibility, the executive dashboard, and the agent
   workspace.

If you can only hire one, hire the second. **The agent is your differentiator and your largest liability
simultaneously**, and it is the area where the gap between what you have and what enterprises require is
widest.
