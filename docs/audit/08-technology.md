# Phase 8 — Technology Review

You listed ~50 technologies. Below is where each fits, **when** to adopt it, and — for a meaningful
number — why you should not.

**The governing principle:** you are a small team with a working product and a serious security backlog.
Every technology you adopt is permanent operational surface. The correct answer for most of this list is
*"later"* or *"never"*, and the discipline to say so is worth more than any individual tool.

---

## Adopt now (next 90 days)

| Tech | Where it fits | Why now |
|---|---|---|
| **PostgreSQL** | Already your primary store | Correct choice. Keep transactional ITSM here permanently |
| **Redis** | Rate limiting, caching, job queue backing | Fixes a live defect — in-memory limiting doesn't work on serverless ([Phase 10](03-scalability.md)) |
| **Job queue** (BullMQ / Inngest / Trigger.dev) | SLA sweep, prediction recompute, rollups, notifications, retention | **Your SLA cron doesn't run today** — `vercel.json` is inert on Netlify. This is a correctness bug |
| **OpenTelemetry** | Tracing across API, actions, ingest | Instrument once, re-target later. Cheapest observability decision available |
| **Sentry** | Error tracking | You have `console.error` and nothing else. ~1 hour to install |
| **Terraform** | All infrastructure | Start now while there are 6 resources, not 60. Retrofitting IaC is miserable |
| **Docker** | Local dev parity, future ingest service | Prerequisite for most of what follows |
| **Feature flags** (Flagsmith / PostHog / Unleash) | Gating new modules per tenant | Required for staged rollout of Change Management, agent updates, AI features |
| **CDN** | Agent binary distribution | You already worked around a 6 MB lambda limit; a CDN is the real fix |
| **pgvector** | Semantic KB and resolution search | Extension in the database you already run — no new infrastructure ([Phase 7](07-ai.md)) |

---

## Adopt at ~1,000 employees / first enterprise customer

| Tech | Where it fits | Trigger |
|---|---|---|
| **ClickHouse** | Telemetry store, replacing `DeviceMetric` in Postgres | When telemetry exceeds ~100M rows. **The single most important technology decision on this list.** 10-30× compression, sub-second fleet aggregation |
| **Kafka / NATS JetStream** | Ingest → processing decoupling | When ingest exceeds ~50 writes/sec. **NATS if you self-host** — dramatically simpler than Kafka and sufficient for your volume |
| **Prometheus + Grafana** | Service metrics and dashboards | Once you have more than one deployable |
| **Loki** | Log aggregation | Same trigger |
| **Tempo** | Distributed tracing backend for your OTel data | Same trigger |
| **WebSockets** (or SSE) | Live dashboards, replacing 15s polling of 11 actions | When concurrent agent sessions cause measurable DB load. **Prefer SSE** — your data flow is server→client only, and SSE is far simpler |
| **S3** | Attachments (currently `Bytes` in Postgres), agent binaries, cold telemetry | As soon as attachment volume is non-trivial |
| **AWS Secrets Manager** (or Vault) | Secrets, replacing env vars | First enterprise security review |
| **CloudFront** | CDN, if you consolidate on AWS | With the AWS migration |

---

## Adopt at ~10,000 employees

| Tech | Where it fits |
|---|---|
| **Kubernetes / EKS** | Ingest and processing services — **only** once you have 3+ deployables and someone who can operate it. K8s with a two-person team is a net loss |
| **OpenSearch** | Full-text search across tickets, KB, and audit at volume |
| **Step Functions** | Long-running orchestration (change implementation, agent rollout rings) |
| **EventBridge** | Event routing between services and to customer webhooks |
| **gRPC** | Agent↔server transport, replacing JSON/REST. Meaningful bandwidth and CPU savings at 100k+ endpoints; premature before that |
| **CQRS** | Read/write split for the dashboard-heavy read path. Adopt as a *pattern* — separate read models — not a framework |
| **Read replicas** | Reporting isolation |

---

## AWS services — targeted answers

You listed most of the AWS catalogue. Here is what genuinely applies:

| Service | Verdict | Reason |
|---|---|---|
| **RDS Aurora PostgreSQL** | ✅ Yes | Primary DB with managed HA. Your current DR posture is nil |
| **ElastiCache** | ✅ Yes | Managed Redis |
| **Fargate** | ✅ Yes | Ingest service without K8s overhead. **The right compute for you** |
| **S3** | ✅ Yes | Attachments, binaries, cold storage |
| **CloudFront** | ✅ Yes | CDN |
| **Secrets Manager** | ✅ Yes | Secrets |
| **KMS** | ✅ Yes | Encryption keys; customer-managed keys are a banking/healthcare requirement |
| **CloudWatch** | ⚠️ Partial | Fine for infra metrics; use Grafana for product dashboards |
| **CloudTrail** | ✅ Yes | Required for SOC 2 |
| **GuardDuty** | ✅ Yes | Cheap threat detection; a SOC 2 checkbox |
| **Security Hub** | ⚠️ Later | Useful once multi-account |
| **WAF** | ✅ Yes | Protects public ingest endpoints |
| **Shield Standard** | ✅ Free | Automatic |
| **IAM Identity Center** | ✅ Yes | Your own team's access — needed for SOC 2 |
| **AWS Organizations** | ✅ Yes | Separate prod/staging/dev accounts. Do this early; it is painful later |
| **AWS Config** | ⚠️ Later | Compliance drift, at SOC 2 time |
| **Lambda** | ⚠️ Careful | You are *already* on serverless and it is causing problems (in-memory rate limiting, 6 MB limits, connection exhaustion). **Sustained telemetry ingest is a poor fit for Lambda** — use Fargate |
| **Systems Manager** | ❌ No | This is *your competitor's* domain. Do not build on it |

---

## Explicitly do not adopt

| Tech | Why not |
|---|---|
| **Microservices** | You have one product, one team, and a security backlog. Microservices would multiply your authorization surface — the exact thing currently failing. **Modular monolith + one ingest service is the right shape for the next two years** |
| **Event Sourcing** | Enormous complexity for marginal benefit here. Your `AuditLog` already provides the audit trail people actually want. Revisit only if you need full temporal reconstruction |
| **RabbitMQ** | Redundant. Redis/BullMQ for jobs, NATS or Kafka for streams. Adding a third broker is operational cost with no gain |
| **Elastic** | OpenSearch is the equivalent with better licensing. Pick one; do not run both |
| **Kubernetes (now)** | Genuinely valuable at 10+ services. At your size it is a full-time job that produces no customer value |
| **Full DDD** | Adopt the useful parts — a ubiquitous language, clear module boundaries, aggregate roots for `Incident`/`Change`/`Device`. Skip the ceremony: repositories over Prisma, mandatory CQRS, domain events for everything |
| **Serverless-everywhere** | Already biting you. Serverless for the web app, containers for ingest and workers |

---

## MCP (Model Context Protocol)

Worth calling out separately because it is strategically interesting and cheap.

**Two uses:**
1. **Expose an MCP server** so customers' own AI tooling can query their ITSM/DEX data. This makes you
   infrastructure rather than a destination — a real differentiator in 2026, and a defensible reason for
   a platform team to prefer you over a closed competitor.
2. **Consume MCP servers** internally so your copilot can reach Jira, GitHub, Okta, and Azure AD without
   bespoke integrations for each.

*Effort: Small. Strategic value: high.* One of the better effort-to-differentiation ratios available.

---

## Migration sequence

**Phase A — fix what is broken (weeks)**
Redis · job queue · Sentry · OTel · Terraform baseline · CDN for the agent binary · declare `zod`.
*No platform migration. Fix correctness first.*

**Phase B — prepare (months 2-4)**
Dockerise · migrate to AWS (Aurora + Fargate + S3 + CloudFront) · Secrets Manager · Organizations with
separate accounts · Prometheus/Grafana/Loki · pgvector.

**Phase C — scale (months 5-12)**
Extract the ingest service to Fargate · NATS or Kafka · **ClickHouse for telemetry** · SSE for live
dashboards · OpenSearch · read replicas.

**Phase D — enterprise (year 2)**
Kubernetes *if* justified · gRPC for the agent · multi-region for data residency · Step Functions ·
EventBridge with customer-facing webhooks.

---

## On leaving Netlify

You should, and reasonably soon. The evidence is already in your commit history: four recent commits are
Netlify-specific workarounds, including moving the agent binary out of the bundle to dodge a 6 MB lambda
limit and explicitly tracing binary paths to fix a 404.

Beyond friction, three things are actually broken by the platform choice:

1. **Your cron does not run.** `vercel.json` crons are inert on Netlify, so SLA escalation is
   lazy-evaluated on ticket view.
2. **Rate limiting does not work** — per-instance memory across ephemeral functions.
3. **Connection exhaustion** — a `pg.Pool` per instance with no pooler.

Netlify is a good product for the marketing site. It is the wrong platform for sustained telemetry
ingest, background jobs, and stateful rate limiting. **Recommendation: marketing site stays on
Netlify/Vercel; the application and ingest move to AWS Fargate behind ALB, with Aurora and ElastiCache.**

---

## Cost estimate at 1,000 employees on AWS

| Component | Monthly |
|---|---:|
| Aurora PostgreSQL (r6g.large, Multi-AZ) | ~$250 |
| ElastiCache Redis (t4g.small) | ~$25 |
| Fargate (web + ingest + workers) | ~$150 |
| S3 + CloudFront | ~$30 |
| Observability (Grafana Cloud or self-hosted) | ~$100 |
| WAF, GuardDuty, Secrets Manager, CloudTrail | ~$60 |
| **Total** | **~$615/month** |

Against ~$72k/month revenue at 10,000 devices ($6/device), infrastructure is a rounding error. **Optimise
for engineering velocity and reliability, not infrastructure cost** — at your scale the expensive
resource is your time, and the retention work in [Phase 10](03-scalability.md) matters far more to
long-run margin than instance sizing.
