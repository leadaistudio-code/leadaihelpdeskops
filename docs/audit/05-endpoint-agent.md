# Phase 5 — Endpoint Agent Review

**Verdict: 4/10.** The rewrite decision was right and the collection code is competent. The agent fails
on the three things enterprise endpoint software is actually judged on: **trust (signing, mTLS),
resilience (buffering), and manageability (updates, service model).**

---

## What exists

**`agent-go/`** — Go 1.22, 1,698 LOC across 15 files, `gopsutil` + pure-Go systray, `CGO_ENABLED=0`.
Built artifacts are real: `agent-go/dist/aiops-agent.exe` (6.9 MB) is **byte-identical** to
`public/aiops-agent.exe` (md5 `452f6f12d98193ee7204186f5c8951d1`), which is what the enrollment UI serves.

> `agent-go/README.md:8-12` still says *"Status: unbuilt… has not been compiled or run."* That is stale
> and actively misleading — fix it. A reviewer reading your own docs would conclude the shipping agent
> is the Electron one.

**`agent/`** — the superseded Electron agent, still on disk with **~190 MB of committed binaries**
(69 MB exe, 103 MB installer, full `win-unpacked/` Chromium tree). It also **fabricated telemetry**:
random personas (`telemetry.cjs:202`), hardcoded `wifiSsid = "Corp-Wifi"` with random dBm (`:209`),
random packet loss (`:230`), and random micro-survey ratings (`:560`).

**Replacing 69 MB of Electron that invented its data with 6.9 MB of Go that measures it was the single
best engineering decision in this repository.** Now finish the job: delete `agent/` and purge the
binaries from git history.

---

## Assessment against your checklist

| Criterion | Status | Detail |
|---|:--:|---|
| Resource usage | ✅ | 6.9 MB static binary, no runtime. 1s sampling window per 30s cycle. Genuinely light |
| Security | ❌ | **Arbitrary script execution** (`remediate.go:16`), no signing, no mTLS, permanent bearer key |
| Telemetry collection | ✅ | Broad and real — CPU, memory, disk, network throughput, WiFi, battery, GPU, top processes, crashes, boot, security posture, software |
| Offline buffering | ❌ | **None.** On POST failure the sample is discarded (`report.go:76-90`) |
| Compression | ❌ | None. Plain JSON |
| Encryption | ⚠️ | TLS not enforced by the agent — scheme comes from config (`config.go:114-140`). Default config uses HTTPS, but HTTP is accepted |
| Remote execution | ⚠️ | Works. 11 named runbooks — plus an unrestricted `RUN_SCRIPT:` escape hatch |
| Plugin architecture | ❌ | Monolithic binary; collectors are compiled in |
| Windows service | ❌ | **Scheduled task on logon** (`schtasks /SC ONLOGON`), not a service. Only runs when a user is logged in |
| Linux daemon | ✅ | Proper systemd unit with `Restart=always`, with user-service and cron fallbacks |
| macOS agent | ❌ | **Absent.** No launchd, no Darwin build in `build.ps1` |
| Cross-platform | ⚠️ | Windows + Linux. Missing macOS — typically 20-40% of an enterprise fleet |
| Upgrade mechanism | ❌ | **None.** Nothing fetches or replaces the binary |
| Rollback | ❌ | No versioned deployment, no rollback |
| Health monitoring | ⚠️ | Local `agent.log` and a tray status. No server-side agent-health telemetry or "agent stopped reporting" alert |
| Certificate validation | ⚠️ | Go defaults (system roots). No pinning |
| Mutual TLS | ❌ | Bearer token only |
| Zero trust | ❌ | Long-lived shared secret, no device attestation, no continuous verification |

---

## Critical gaps

### 1. No code signing — a hard enterprise blocker

`agent-go/build.ps1` is `go build -trimpath -ldflags "-s -w -H=windowsgui"`. No `signtool`. CI
(`.github/workflows/ci.yml`) has no Go toolchain and no release job at all.

Consequences: SmartScreen warnings on every install; Defender and CrowdStrike will flag an unsigned
binary that spawns PowerShell and makes outbound connections — that behaviour profile *is* the malware
signature; no customer can verify authenticity; and you cannot distinguish your agent from a trojanised
copy, which matters because `/api/agent/download` serves it publicly to anyone.

**No enterprise security team will approve unsigned software that executes remote commands.** This alone
blocks deployment at every organisation you named.

*Fix:* EV code-signing certificate (~$400/yr), Authenticode signing in CI, published SHA-256 checksums,
notarization when macOS ships.

### 2. No offline buffering — you lose exactly the data that matters

```go
// report.go:76-90 — on failure, the sample is simply dropped
```

Laptops are offline constantly: travel, home WiFi drops, VPN reconnects, standby. **The periods you lose
are disproportionately the periods with problems** — the network outage you most want to see is precisely
when reporting fails. Sub-polls (security, crashes, software) are skipped entirely when the metrics POST
fails, so a crash during an outage is lost permanently.

*Fix:* a bounded local spool (BoltDB or newline-delimited JSON, cap ~50 MB / 7 days), flushed on
reconnect with exponential backoff and jitter. Server-side, accept batches and dedupe on
`(deviceId, collectedAt)`. **Pair this with batching (below) — one change delivers both.**

### 3. No self-update — unmanageable at scale

Nothing updates the binary. With 10,000 endpoints and a security fix to ship, your only option is asking
IT to re-run an installer via their RMM. Meanwhile, **the P0 in [Phase 9](02-security.md) requires
shipping an agent update to remove `RUN_SCRIPT:`** — and you currently have no mechanism to do it.

*Fix:* signed manifest (version, SHA-256, URL) polled on an interval; download to a temp path; verify
signature *and* hash; atomic swap; restart; roll back on failed health check. Staged rollout rings
(1% → 10% → 50% → 100%) with an automatic halt on error-rate regression. This is table stakes — every
competitor has it.

### 4. Scheduled-task-on-logon is not a service model

`schtasks /Create /TN "AIops Agent" /SC ONLOGON` means: no telemetry at the login screen, none for shared
kiosks between users, none while locked-and-logged-out, and any user can open Task Scheduler and disable
it. It runs per-user with no admin requirement — convenient for a demo, disqualifying for compliance
reporting, because "device not reporting" and "device compliant" become indistinguishable.

*Fix:* a real Windows service (`golang.org/x/sys/windows/svc`) running as LocalSystem, with recovery
actions and tamper protection. Keep a small user-context helper only for the tray UI and surveys.

### 5. No macOS agent

Typically 20-40% of an enterprise fleet, and far higher in tech and design organisations. A DEX product
that cannot report on Macs cannot be *the* DEX product — it becomes a supplementary tool, which caps
deal size. `gopsutil` already supports Darwin; the work is in `extras_darwin.go` (airport/wdutil for
WiFi, `pmset` for battery, `system_profiler`, unified log for crashes) plus a launchd daemon and
notarization.

### 6. Efficiency: 30s interval, no batching, no compression

At 30s with no batching, **1,000 devices generate 2,880 requests/second-equivalent** in daily volume —
2.88M requests/day. Each carries full JSON headers for a payload of a few hundred bytes.

*Fix:* collect every 30s, **transmit every 5 minutes as a batch of 10, gzipped.** ~10× fewer requests,
~70% less bandwidth, and it composes exactly with the offline spool. This is the cheapest scale win
available anywhere in this audit — see [Phase 10](03-scalability.md).

---

## How Nexthink and Tanium actually operate

### Nexthink

- **Collector** — a lightweight signed Windows service, typically well under 1% CPU, buffering locally
  and transmitting compressed batches on an interval. Same *shape* as yours; the difference is signing,
  buffering, and update management.
- **Behavioural focus.** Nexthink's core insight is that raw resource metrics are weak predictors of
  experience. They instrument application responsiveness, crash/hang correlation, and **collaboration-app
  quality** — which is what CIOs actually feel.
- **Employee sentiment loop.** In-product micro-surveys correlated against technical telemetry, so they
  can say "engineering reports poor experience *and* their boot times regressed 40% after the March
  image." **You already collect `MicroSurveyResponse` and display it nowhere** — this is the closest
  competitive parity available to you, and it is nearly free.
- **Remote Actions** — a signed, versioned, allowlisted library of scripts with approval workflow and
  staged rollout. Not free-text PowerShell. **This is precisely the control your P0 is missing.**

### Tanium

- **Linear chain architecture** — the genuinely novel idea. Agents form peer chains on the local network
  and pass queries neighbour-to-neighbour, so a question reaches 100,000 endpoints in seconds with a
  fraction of the server load and WAN traffic. Query-first, not stream-everything-centrally.
- **Real-time query.** Ask an arbitrary question ("which machines have this file hash?") and get answers
  in seconds because the agent evaluates locally rather than the server querying a warehouse.
- **Hardened service** with tamper protection, mTLS with per-endpoint certificates, and signed content
  packages.

### What to adopt, in order

1. **Signed, versioned, allowlisted action library** with approval and staged rollout (Nexthink Remote
   Actions). Fixes your P0 and is a product feature customers pay for.
2. **Local buffering with batched, compressed transmission.** Universal across both.
3. **Self-update with signed manifests and rollout rings.** Universal.
4. **Real service with tamper protection.** Universal.
5. **Sentiment correlated with telemetry** (Nexthink) — you have the data model already.
6. **mTLS with per-device certificates** issued at enrollment, replacing the permanent bearer key.
7. **On-demand query** (Tanium-lite): let the server ask a live question rather than waiting for the next
   scheduled push. Powerful for troubleshooting and a strong demo moment.

**Do not** attempt Tanium's linear chain. It is a decade of distributed-systems work and solves a problem
you will not have for years.

---

## Zero-trust target

| Principle | Today | Target |
|---|---|---|
| Device identity | Permanent shared bearer secret | Per-device X.509 issued at enrollment, short-lived, auto-rotated |
| Transport | TLS if the config says so | mTLS enforced in code; reject plaintext unconditionally |
| Attestation | None | TPM-backed key where available |
| Least privilege | Agent executes arbitrary scripts | Allowlisted signed actions only |
| Continuous verification | None | Periodic re-attestation; revoke on anomaly |
| Enrollment | Permanent tenant-wide token | Short-TTL, single-use, revocable, audited |

---

## Recommended roadmap

**Month 1 — trust and safety**
1. Remove `RUN_SCRIPT:` from `remediate.go`. *(P0)*
2. EV certificate; sign in CI; publish checksums.
3. Enforce HTTPS in code; reject plaintext.
4. Wire the Go build into CI with a release job.
5. Fix the stale README; delete `agent/` and purge its binaries from history.

**Month 2 — resilience and efficiency**
6. Local spool with backoff.
7. Batched + gzipped transmission.
8. Server-side batch ingest with dedupe.
9. Agent-health telemetry and "stopped reporting" alerting.

**Month 3 — manageability**
10. Self-update with signed manifests and rollout rings.
11. Windows service with recovery and tamper protection.
12. Signed, versioned action library with approval workflow.

**Months 4-6 — reach**
13. macOS agent with launchd and notarization.
14. mTLS with per-device certificates.
15. On-demand live query.
16. Collaboration-app quality collection ([Phase 4](04-dex.md) gap #1).

Items 1-5 are the ones blocking an enterprise deployment today. Everything after that is about becoming
a product rather than a capable prototype.
