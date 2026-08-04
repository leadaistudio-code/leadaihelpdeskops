# Phase 6 — ITSM Completeness Review

**Verdict: 4/10.** You have a competent incident-and-request desk with a genuinely good SLA engine. You
do not have an ITSM suite. **Change Management is the deal-breaker** — no enterprise, government,
healthcare, or banking buyer will replace their service desk with a platform that cannot manage change,
because change control is an audit requirement, not a feature preference.

---

## Scorecard — all 30 requested modules

Legend: ✅ real · ⚠️ partial · ❌ absent · *(verified against `prisma/schema.prisma` — 33 models, none
named Change, Release, Vendor, Contract, or ConfigurationItem)*

| # | Module | Status | Evidence / gap |
|---|---|:--:|---|
| 1 | Incident Management | ✅ | `Incident` + `IncidentNote` + full lifecycle, `incidentActions.ts` (374 lines), atomic per-tenant numbering |
| 2 | Major Incident Management | ❌ | No MI flag, war room, comms plan, or stakeholder updates. "Major Incident" appears only as a *Problem* notification label (`problemActions.ts:69`) — a mislabel |
| 3 | Problem Management | ✅ | `Problem` with `rootCause`, `workaround`, `knownError`; incident linking. **Missing role checks** ([Phase 9](02-security.md)) |
| 4 | Change Management | ❌ | **Absent entirely.** No model, no route, no page, no CAB |
| 5 | Release Management | ❌ | Absent. The word appears once, in a DEX network-reset dropdown |
| 6 | Knowledge Management | ✅ | `KnowledgeArticle`, AI drafting from resolved incidents, lexical ranking, thumbs feedback |
| 7 | CMDB | ⚠️ | **Synthetic.** No CI model, no relationships. `/cmdb` builds a fake tree at request time: hardcoded root → `Asset.category` groups → asset leaves (`cmdb/page.tsx:32-73`). **DEX devices are excluded** |
| 8 | Discovery | ⚠️ | The agent discovers devices and software, but there is no network discovery, no agentless scan, no CI reconciliation |
| 9 | Service Catalog | ✅ | `CatalogItem` with JSON `formSchema`, dynamic request forms |
| 10 | Request Fulfillment | ✅ | `CatalogRequest` → linked work-queue `Incident` |
| 11 | SLA | ✅ | **The strongest ITSM module.** Pause/resume accounting, business-hours math, live clocks |
| 12 | OLA | ❌ | No operational-level agreements between internal groups |
| 13 | Escalations | ⚠️ | Single-tier: breach → note + notify. No escalation matrix, no on-call, no manager chain |
| 14 | Approvals | ⚠️ | Single-step, triggered by a **hardcoded category set** `["Access"]` — duplicated in two files (`catalogActions.ts:48`, `catalog/page.tsx:11`). No chains, delegation, or quorum |
| 15 | Task Management | ❌ | No sub-tasks or task orchestration under a parent record |
| 16 | Asset Management | ⚠️ | `Asset` with 4 states. **No cost, warranty, vendor, depreciation, or location.** Not linked to `Device` |
| 17 | Software Asset Management | ⚠️ | Real discovery (`SoftwareInstallation`, `SoftwareUsage`). No entitlements or reconciliation |
| 18 | License Management | ⚠️ | Costs come from an **8-entry hardcoded price table** (`dexActions.ts:344-353`). "Revoke license" only deletes a usage row — the code comment admits it would need an Okta/Azure AD call |
| 19 | Vendor Management | ❌ | Absent |
| 20 | Contract Management | ❌ | Absent. (`SmartContract` is an automation rule, not a commercial contract) |
| 21 | Business Services | ❌ | No service model. The CMDB root is a hardcoded string |
| 22 | Service Mapping | ❌ | Absent |
| 23 | Event Management | ⚠️ | Threshold alerts create incidents (`api/agent/metrics/route.ts:33-48`). No event store, no third-party ingestion |
| 24 | Monitoring | ⚠️ | Endpoint telemetry only. No infrastructure, network, or application monitoring |
| 25 | Alert Correlation | ❌ | **Absent.** Each threshold breach creates its own incident. No dedup beyond a 1h per-device cooldown, no storm suppression |
| 26 | Automation | ⚠️ | Remediation works. But **saved `Flow` records are never executed by any code path** — the flow designer writes to a table nothing reads |
| 27 | AI Copilot | ✅ | Two real tool-use assistants — employee "Now Assist" and agent-facing Fleet Copilot |
| 28 | Virtual Agent | ✅ | AI deflection before ticket creation, grounded in ranked KB articles |
| 29 | ChatOps | ❌ | No Slack or Teams integration |
| 30 | Reporting | ⚠️ | Real MTTR/SLA/backlog metrics. No custom report builder, no scheduled delivery, no export |

**Totals: 8 real · 12 partial · 10 absent.**

---

## The three that block enterprise sales

### 1. Change Management — the single largest gap in the product

No `Change` model. No CAB. No change calendar. No risk assessment. No implementation or back-out plan.
No freeze windows. No post-implementation review.

**Why this ends deals:** change control is how organisations answer "who authorised this modification to
a production system, who approved it, and what was the rollback plan?" That question is asked by SOX
auditors, ISO 27001 assessors, HIPAA assessors, and every bank's third-party risk team. A platform
without it cannot be the system of record — it becomes a supplementary tool alongside ServiceNow, which
caps your deal size and your strategic position permanently.

There is also a product-integrity argument specific to you: **you already deploy scripts to entire
fleets** with no approval workflow ([Phase 9](02-security.md) P0-1). Change Management is not just a
missing module — it is the governance layer your existing most-dangerous feature is missing.

**Minimum credible implementation:**

```prisma
model Change {
  id            String   @id @default(cuid())
  number        String   // CHG0001234 — use allocateNumber()
  domain        String
  title         String
  description   String
  type          ChangeType    // STANDARD | NORMAL | EMERGENCY
  risk          ChangeRisk    // LOW | MEDIUM | HIGH
  status        ChangeStatus  // DRAFT|ASSESS|APPROVE|SCHEDULED|IMPLEMENT|REVIEW|CLOSED
  requesterId   String
  assigneeId    String?
  plannedStart  DateTime?
  plannedEnd    DateTime?
  implementation String?      // required before approval
  backoutPlan   String?       // required before approval
  testPlan      String?
  approvals     ChangeApproval[]
  affectedCis   String[]
  problemId     String?
  incidents     Incident[]    // caused-by linkage
  pirNotes      String?
  @@unique([domain, number])
  @@index([domain, status])
  @@index([domain, plannedStart])
}

model ChangeApproval {
  id         String   @id @default(cuid())
  changeId   String
  approverId String
  role       String        // CAB_MEMBER | TECHNICAL | BUSINESS
  decision   ApprovalDecision  // PENDING | APPROVED | REJECTED
  comment    String?
  decidedAt  DateTime?
}
```

Plus: a change calendar with conflict detection, standard (pre-approved) change templates, emergency
change with retrospective approval, and freeze windows. **Then route fleet-wide script deployment through
it as an Emergency Change** — which converts your worst security liability into a governance feature you
can demo.

*Effort: Large (6-8 weeks). Business impact: unblocks the entire enterprise segment.*

### 2. CMDB is synthetic

`/cmdb` looks like a CMDB and is not one. It builds a tree at request time from a hardcoded root node
labelled "IT Infrastructure", one branch per distinct `Asset.category` string, and asset leaves. There are
**no configuration items, no relationships, and no dependency model** — and DEX devices, your richest
data source, are not in it at all.

Meanwhile your marketing claims "See how business services map to physical infrastructure"
(`src/app/page.tsx:647`). That is not true today.

**What is needed:** a real `ConfigurationItem` model with a typed `CiRelationship` graph
(`DEPENDS_ON`, `RUNS_ON`, `CONNECTS_TO`, `MEMBER_OF`), CI classes (Server, Application, BusinessService,
Database, NetworkDevice, Endpoint), auto-population from agent discovery, and impact analysis that
traverses the graph — "this database is degraded; these three business services and 400 employees are
affected."

The good news: **you already discover more CI data than most CMDBs ever get populated with** — hostname,
OS, GPU, drives, installed software, running services. `Device` and `Asset` should both become CI
subtypes. You are closer than the current page suggests.

*Effort: Large. Impact: high — a populated CMDB is the classic ServiceNow implementation failure, and
agent-driven auto-population is a legitimate wedge against them.*

### 3. Alert correlation

Every threshold breach opens its own incident. A failing office switch means 200 devices report packet
loss and you create 200 incidents — burying the actual signal. There is dedup only via a 1-hour per-device
cooldown (`Device.lastAlertAt`).

**Minimum viable correlation:** group alerts within a time window sharing an attribute (subnet, office,
OS build, software version, gateway); create one parent incident with children; suppress the storm; and
surface "47 devices affected, common factor: gateway 10.2.4.1." Combined with cohort analysis this is the
foundation of the RCA capability in [Phase 4](04-dex.md).

*Effort: Medium. Impact: high — and it directly demonstrates AIOps value.*

---

## Second tier

**Major Incident Management** — an MI flag on `Incident`, a war-room view, a stakeholder comms template
with timed updates, a timeline for post-incident review, and automatic MI declaration when N incidents
correlate. *Medium effort, high visibility — MI handling is a standard demo scenario.*

**Multi-tier escalation and on-call** — today breach means notify assignee and group. Enterprises need
tiered escalation on a schedule, on-call rotas with handover, and PagerDuty/Opsgenie integration. Your
SLA engine is well built enough to carry this cheaply. *Medium.*

**Approval chains** — replace the hardcoded `["Access"]` category set with configurable rules: sequential
and parallel stages, cost-threshold routing, manager-of-requester lookup (which needs a manager
relationship on `User`), delegation, and expiry. *Medium.*

**Task management** — sub-tasks under incidents, changes, and requests; sequential and parallel
dependencies; per-task assignment. Required for any real fulfilment workflow (onboarding is 8 tasks
across 4 teams). *Medium.*

**Make the flow designer real** — `Flow` records are saved and **never executed**. Either build the
runtime (trigger → condition → action, executed by the job queue) or remove the feature. Shipping a
designer whose output does nothing is worse than not shipping it, because customers will build workflows
and discover they are inert. Your marketing also describes it as drag-and-drop; it is an add-to-list
builder. *Large to make real, Small to remove.*

**Asset lifecycle** — add cost, warranty expiry, vendor, depreciation, location, and lease terms; link
`Asset` to `Device` so discovered hardware reconciles with purchased hardware. That link is currently
missing and it is the foundation of both SAM and lifecycle reporting. *Small-Medium, high value.*

**ChatOps** — Slack and Teams integration. In 2026 a large share of tickets should never reach a portal.
A Teams bot that creates and updates tickets, plus channel notifications for MI and approvals, is
expected. *Medium.*

---

## What is genuinely strong

**The SLA engine.** `SlaDefinition`/`SlaInstance` with absolute-deadline computation, pause/resume that
correctly pushes `dueAt` by business time consumed while paused, a real business-hours calculator with an
iteration guard (`src/lib/business-hours.ts`), and idempotent breach escalation. Most products get
pause/resume wrong. Two gaps: business hours are **hardcoded Mon-Fri 09:00-17:00 UTC** with no per-tenant
timezone (the code comments say so), and the sweep **does not run in production** — `vercel.json` crons
are inert on Netlify, so breaches escalate only when someone opens the ticket.

**Per-tenant ticket numbering.** `NumberCounter` with an atomic allocator is the right design — though two
call sites still bypass it ([Phase 10](03-scalability.md)).

**AI deflection before ticket creation.** Genuinely modern: rank KB articles, generate a grounded answer,
offer the form only if unresolved. This is where the market is going and you are already there.

**Incident-to-problem linking** with proper ITIL semantics, and AI knowledge drafting from resolved
incidents — closing the loop from resolution to reusable knowledge is something many mature products do
poorly.

---

## Recommended sequence

**Quarter 1 — enterprise blockers**
1. Change Management with CAB and change calendar *(Large)*
2. Alert correlation *(Medium)*
3. Major Incident Management *(Medium)*
4. Make the SLA sweep actually run; per-tenant business hours and timezones *(Small)*

**Quarter 2 — depth**
5. Real CMDB with CI relationships, auto-populated from agent discovery *(Large)*
6. Approval chains and multi-tier escalation with on-call *(Medium)*
7. Task management *(Medium)*
8. Asset lifecycle fields and `Asset`↔`Device` linkage *(Small)*

**Quarter 3 — reach**
9. Flow runtime, or remove the designer *(Large / Small)*
10. ChatOps *(Medium)*
11. Release Management *(Medium)*
12. Vendor and contract management *(Medium)*

Change Management first. It is the module whose absence disqualifies you from the segment you are aiming
at, and it doubles as the governance layer your riskiest existing feature needs.
