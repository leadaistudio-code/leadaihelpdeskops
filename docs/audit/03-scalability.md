# Phase 10 — Scalability Review

**Verdict: 3/10.** The architecture works to roughly 100 users / 500 devices and degrades sharply after
that. Three defects (unbounded telemetry, poll amplification, no queue) impose a hard ceiling well below
your stated ambitions.

**Modelling assumption:** ITSM/DEX load is driven by *devices*, not seats. I assume ~1.2 devices per
employee, a 30-second agent interval (`agent-go/config.go:85`), ~0.5 tickets per employee per month, and
that ~5% of seats are IT agents with a DEX dashboard open during business hours.

---

## The load math that governs everything

At a 30s interval, **one device writes 2,880 `DeviceMetric` rows per day** — plus security posture and
crash payloads every tick, software every 5 min, hardware every 15 min, boot every 24h.

| Employees | Devices | Metric rows/day | Rows/year | Ingest writes/sec |
|---:|---:|---:|---:|---:|
| 10 | 12 | 34,560 | 12.6M | 0.4 |
| 100 | 120 | 345,600 | 126M | 4 |
| 1,000 | 1,200 | 3.5M | 1.26B | 40 |
| 10,000 | 12,000 | 34.6M | **12.6B** | 400 |
| 100,000 | 120,000 | 345.6M | **126B** | 4,000 |
| 1,000,000 | 1.2M | 3.5B | **1.26 trillion** | 40,000 |

There is **no retention policy, no TTL, and no pruning job** — I searched; `deviceMetric.deleteMany`
does not exist anywhere in `src/`. Every row written is kept forever in the primary OLTP database.

At 1,000 employees you are storing 1.26 billion rows per year in PostgreSQL, in a table that is also on
the read path of a dashboard polling every 15 seconds. **That is the single hardest ceiling in the
system**, and it arrives at a customer size you could plausibly sign this year.

---

## Tier-by-tier assessment

### 10 users / 12 devices — ✅ Works

Current architecture is fine. Costs ~$25/month. No changes needed.

### 100 users / 120 devices — ✅ Works, with visible strain

4 ingest writes/sec is comfortable. First real symptom: an agent's DEX dashboard fires **11 server
actions every 15 seconds** (`src/app/dex/page.tsx:203`), one of which
(`getLifecycleArbitrage` → `recomputeHardwarePredictions`, `dexActions.ts:628`) runs an **N+1
regression recompute — one `deviceMetric.findMany` per device** — and then deletes and recreates the
tenant's prediction rows in a transaction.

With 5 agents watching: 5 × 11 = **55 server actions every 15s**, including 5 concurrent full-fleet
recomputes doing 120 queries each. ~600 queries per 15s window from dashboards alone, before any real
work. `DeviceMetric` reaches ~126M rows within a year.

**Do now:** move `recomputeHardwarePredictions` off the render path entirely — it is a scheduled job,
not a dashboard read.

### 1,000 users / 1,200 devices — ⚠️ Degrades badly

**Bottleneck 1 — connection exhaustion.** `src/lib/prisma.ts` creates a `pg.Pool` per lambda instance
with default sizing and no `connection_limit`. Netlify scales instances on demand; 40 writes/sec plus
dashboard reads spawns dozens of instances, each opening its own pool. PostgreSQL's default
`max_connections` is 100. **You will exhaust connections before you exhaust CPU.**
→ Mandatory: PgBouncer / Supabase pooler in transaction mode, with an explicit `connection_limit=1`.

**Bottleneck 2 — the metrics hot path does far too much.** `src/app/api/agent/metrics/route.ts` performs,
per request: validation → device lookup → transactional write of both `Device` and `DeviceMetric` →
threshold evaluation → SmartContract query **plus a query per matching contract** → possible incident
creation → possible command queue. At 40 req/sec that is 200-400 queries/sec from ingest alone.

**Bottleneck 3 — the unscoped, racy ticket counter.**
`src/app/api/agent/metrics/route.ts:191`:
```ts
const count = await prisma.incident.count({ where: { type: "INCIDENT" } });
const number = `INC${String(count + 10000).padStart(7, "0")}`;
```
A **full-table count across every tenant** on the alert path — O(n) and worsening as the incident table
grows. And it is racy: two concurrent alerts in one tenant compute the same number and collide with
`@@unique([domain, number])`, returning a 500. Duplicated at `api/agent/crashes/route.ts:64`. The
correct atomic allocator already exists at `src/lib/ticket-number.ts` and is simply not used here.

**Bottleneck 4 — unbounded queries.** `getIncidents()` (`incidentActions.ts:127`) is a full-table
`findMany` per tenant with no limit. `/api/ai/deflect` and `/api/ai/suggest` load **every published
article's full content** into memory before ranking in JavaScript. `getDexReportData`
(`reportActions.ts:136`) pulls every `DeviceMetric` in the window and `.reduce()`s it — at 1,200 devices
over 30 days that is ~104M rows into a lambda with a ~1GB memory limit. **This will OOM.**

**Bottleneck 5 — rate limiting no longer functions.** In-memory `Map` across many instances
(`src/lib/rate-limit.ts`).

### 10,000 users / 12,000 devices — ❌ Will not work

400 ingest writes/sec against a single Postgres primary that is simultaneously serving dashboards, with
a 12.6-billion-row/year table and no partitioning. The `DeviceMetric` index alone exceeds RAM; every
query becomes disk-bound. Serial SLA sweep over all overdue incidents cannot finish inside a lambda
timeout. Requires the redesign below.

### 100,000 users / 1.2M devices — ❌ Requires a different system

4,000 writes/sec sustained. This is a genuine time-series workload and needs a purpose-built store.

### 1,000,000 users — ❌ Not a scaling exercise

40,000 writes/sec, 3.5B rows/day. Reaching this means rebuilding around streaming ingest, columnar
storage, and regional sharding. Nexthink and Tanium operate at this scale with fundamentally different
architectures. It is a legitimate 3-5 year destination, not a tuning target.

---

## Target architecture

### Stage 1 — to 1,000 employees (weeks, not months)

Keep the monolith. Five changes:

1. **Connection pooling.** PgBouncer/Supavisor, transaction mode, `connection_limit=1` per instance.
2. **Retention + rollups.** This is the highest-value change in the document for scale.
   - Raw `DeviceMetric`: keep **7 days**.
   - `device_metric_hourly` rollup (avg/min/max/p95 per device per hour): keep **90 days**.
   - `device_metric_daily`: keep **2 years**.
   - Partition `DeviceMetric` by day (`pg_partman`) so expiry is `DROP PARTITION`, not `DELETE`.

   This turns 1.26B rows/year into ~10M rows retained. It is the difference between a system that works
   at 1,000 employees and one that does not. All dashboard and report reads move to the rollup tables.
3. **A job queue.** BullMQ on Redis, or Inngest/Trigger.dev if you want to stay serverless. Move off the
   request path: prediction recompute, SLA sweep, rollup aggregation, notification fan-out, retention.
   **Critically: your SLA cron is in `vercel.json` and you deploy to Netlify — it does not run today.**
   SLA breaches currently escalate only when a human opens the ticket
   (`escalateIfBreached` from `getIncidentById`, `incidentActions.ts:192`). Fix this first; it is a
   correctness bug, not just a scale gap.
4. **Redis for rate limiting and caching.** Cache fleet summaries on a 30-60s TTL — several agents
   watching one dashboard should share one computation, not each trigger their own.
5. **Batch ingest.** Have the agent buffer and POST every 5 minutes with 10 samples, gzipped
   (§Phase 5). This alone cuts request volume **10×** and simultaneously fixes the agent's data-loss
   problem. It is the cheapest scale win available — a change in two files.

**Result:** comfortably supports 1,000-2,000 employees. Estimated infrastructure: ~$300-600/month.

### Stage 2 — to 10,000 employees

6. **Split telemetry ingest from the app.** A dedicated ingest service (Fastify/Go on Fargate or a
   Cloudflare Worker) writing to a queue. Ingest and UI have opposite scaling profiles; sharing a
   deployment means each constrains the other.
7. **Kafka / Kinesis / NATS JetStream** between ingest and processing. Decouples spikes, enables replay,
   and lets you add consumers (alerting, ML, analytics) without touching ingest.
8. **ClickHouse or TimescaleDB for telemetry.** ClickHouse compresses this data 10-30× and answers
   fleet-wide aggregations in milliseconds. Postgres keeps transactional ITSM data (incidents, problems,
   assets, users); telemetry moves out. This split is the defining architectural decision of the next
   two years — make it deliberately.
9. **Read replicas** for reporting.
10. **WebSockets/SSE** replacing polling for live dashboards.

**Result:** 10,000-25,000 employees. ~$3-6k/month.

### Stage 3 — to 100,000+

11. Regional sharding by tenant (also solves EU data residency, which you need for GDPR anyway).
12. Autoscaling ingest on Kubernetes/EKS.
13. Tiered storage — hot in ClickHouse, cold in S3 + Parquet queried via Athena.
14. Per-tenant quotas and backpressure.

---

## Quick wins ranked by value ÷ effort

| Change | Effort | Impact |
|---|---|---|
| Move `recomputeHardwarePredictions` off the dashboard poll | S | Removes N+1 from the hottest path |
| Route both alert paths through `allocateNumber()` | S | Fixes a cross-tenant O(n) count **and** a 500-causing race |
| Add `take`/pagination to `getIncidents`, deflect/suggest article loads | S | Prevents OOM |
| Connection pooler | S | Removes the first hard failure at ~1,000 |
| Agent batching + gzip | S | **10× fewer requests**, and fixes telemetry data loss |
| Retention + partitioning + rollups | M | Removes the hardest ceiling in the system |
| Real job queue (and make SLA sweep actually run) | M | Fixes a live correctness bug; unblocks async work |
| Redis cache + shared rate limiting | M | Makes limits real; cuts dashboard load |
| ClickHouse for telemetry | L | Unlocks 10,000+ |
| Split ingest service | L | Independent scaling |

The first five are days of work and roughly 10× your safe operating ceiling.

---

## Cost trajectory

| Scale | Monthly infra | Notes |
|---|---:|---|
| 100 employees | ~$50 | Current stack is fine |
| 1,000 | ~$400 | Pooler + Redis + queue + retention |
| 10,000 | ~$4,500 | ClickHouse + Kafka + separate ingest |
| 100,000 | ~$35,000 | Multi-region, tiered storage |

At $6/device/month (your landing-page price), 10,000 employees ≈ $72k/month revenue against ~$4.5k
infra — a healthy ~94% gross margin **if** the retention work is done. Without it, storage cost grows
without bound while revenue stays flat, and the margin inverts. Retention is not a technical nicety here;
it is the unit-economics fix.
