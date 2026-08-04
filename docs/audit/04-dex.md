# Phase 4 — Digital Employee Experience Review

**Verdict: 5/10.** The collection layer is better than the presentation layer. You gather genuinely
useful telemetry and then fail to surface a meaningful fraction of it — including two entire data
streams that are written to the database and read by nothing.

---

## Scorecard — all 28 requested capabilities

Legend: ✅ real · ⚠️ partial · ❌ absent

| # | Capability | Status | Evidence / gap |
|---|---|:--:|---|
| 1 | Device Health | ✅ | `experienceScore()` (`dexActions.ts:31`), per-device status, anomaly table |
| 2 | Application Health | ⚠️ | Crash/hang events only (`AppCrashEvent`). No per-app responsiveness, launch time, or error rates |
| 3 | Boot Time | ⚠️ | **Collected, never displayed.** `BootProfile` written at `api/agent/boot/route.ts:40`; zero read sites |
| 4 | Login Time | ⚠️ | `profileLoadSec` + `gpoSec` captured in `BootProfile` — same problem: no UI |
| 5 | Crash Analytics | ✅ | Real Windows Event Log ingestion (IDs 1000/1002/1001), crash stats + recent crashes on the dashboard |
| 6 | Memory Leaks | ❌ | Memory sampled, but no per-process growth-over-time detection |
| 7 | CPU Analysis | ⚠️ | Aggregate CPU% + top-5 processes in `extendedInfo`. No sustained-load or thermal-throttle analysis |
| 8 | Disk Analysis | ✅ | Disk %, free/total, per-drive breakdown, **and genuine predictive capacity forecasting** |
| 9 | Network Analysis | ⚠️ | Latency, packet loss, gateway RTT, throughput collected. **`packetLossPct` and `wifiSignalDbm` are displayed nowhere** |
| 10 | VPN Experience | ❌ | No VPN detection, tunnel health, or split-tunnel analysis |
| 11 | WiFi Quality | ⚠️ | SSID + signal collected (`extras_windows.go`). No roaming, band, channel congestion, or AP analysis. Not displayed |
| 12 | Teams/Zoom Experience | ❌ | **The single biggest gap.** No collaboration-app quality metrics at all |
| 13 | Browser Performance | ❌ | No browser telemetry, page load, or extension impact |
| 14 | Application Performance | ❌ | Foreground minutes only — usage, not performance |
| 15 | Battery Health | ⚠️ | Charge % + a 14-day cached `Win32_Battery` status. No cycle count, design-vs-full capacity, or wear % |
| 16 | Patch Compliance | ❌ | No OS patch level, no missing-update detection, no CVE mapping |
| 17 | Security Compliance | ⚠️ | BitLocker/AV/firewall booleans (`SecurityPosture`). No policy framework, drift, or benchmark scoring |
| 18 | Real-Time Alerts | ⚠️ | Threshold alerts create incidents; 15s polling, not real-time. No alert routing or dedup beyond a 1h cooldown |
| 19 | Root Cause Analysis | ❌ | No correlation engine. `Problem.rootCause` is a free-text field a human types |
| 20 | Experience Score | ✅ | Real, documented formula (`dexActions.ts:31-51`) — though see §Critique |
| 21 | Device Score | ✅ | Same computation, per device |
| 22 | Employee Score | ❌ | No per-person score aggregating their devices, tickets, and sentiment |
| 23 | Executive Dashboards | ❌ | No exec view. No cost, trend, or benchmark framing |
| 24 | Manager Dashboards | ❌ | **No manager role exists** — `Role` is only ADMIN/IT_AGENT/EMPLOYEE |
| 25 | Historical Trends | ⚠️ | `DeviceMetric` history exists and `/dex/report` covers 1/7/30 days. The main dashboard shows **no trend lines from real data** |
| 26 | Benchmarking | ❌ | No peer, industry, or internal cohort comparison |
| 27 | Predictive Analytics | ✅ | **Genuinely good** — see below |
| 28 | AI Recommendations | ⚠️ | Fleet Copilot answers questions (read-only). No proactive recommendation engine |
| — | Automated Remediation | ✅ | Real closed-loop execution — see [Phase 5](05-endpoint-agent.md) and the P0 in [Phase 9](02-security.md) |

**Totals: 7 real · 12 partial · 9 absent.**

---

## What is genuinely good

### Predictive analytics is real, and better than most vendors ship

`src/lib/hardware-prediction.ts` is the best-engineered file in the repository. Ordinary least-squares
regression over the real `DeviceMetric` series, returning slope, intercept, and r². Disk failure
predicted against a 92% threshold; battery against a 40% floor. Probability is
`clamp01(0.2 + 0.8 × proximity × confidence)` where confidence derives from r² — so a noisy signal
yields a low-confidence prediction rather than a confident wrong one.

It returns `evidence { current, perDay, r2, samples, daysToThreshold }` so every number is explainable,
requires `MIN_SAMPLES = 8` before emitting anything, and the header comment states the governing rule
plainly:

> "only emit a prediction a signal actually supports… a fabricated one is exactly the thing this module
> exists to remove."

That is the correct engineering instinct, and it is unit-tested. **Most commercial DEX products present
opaque risk scores with no evidence trail.** This is a real differentiator — market it.

Two caveats: it runs on the **dashboard render path** (via `getLifecycleArbitrage`, an N+1 recompute
every 15s — move it to a job), and the Go agent *separately* posts `HardwareFailurePrediction` rows with
hardcoded probabilities of 0.05/0.7/0.8 (`extras_windows.go:204-221`) which the recompute then
overwrites. Delete the agent-side fabrication; it contradicts the module's own stated principle.

### Telemetry collection depth

The Go agent collects more than the dashboard admits: swap usage, network throughput measured over the
same 1s window as the CPU sample, per-drive capacity, GPU model and driver, top-5 processes by RSS,
default gateway RTT, running service count, max temperature. That is a solid foundation.

### Closed-loop remediation

A working command channel — queue → agent poll → execute → report result — with eleven named runbooks.
Most competitors at this stage have a dashboard and nothing else. **The security design of this channel
is a P0 problem** ([Phase 9](02-security.md)), but the mechanism itself is real.

---

## The three problems that matter most

### 1. You collect data you never show

`BootProfile` and `MicroSurveyResponse` each have exactly **one write site and zero read sites**. Boot
time and login time are among the most-requested DEX metrics in the market — they are the metrics a CIO
actually feels — and you are already collecting them. Same for `packetLossPct` and `wifiSignalDbm`.

This is the cheapest value in the entire audit: **the data is in the database, the collection works, and
nobody can see it.** A boot-time trend page is days of work, not weeks.

### 2. Fabricated data sits next to real data, under a "Live agent data" badge

`src/app/dex/page.tsx` renders, on the same screen:

| Element | Reality |
|---|---|
| "Global Network Latency (ms)" — the largest chart | **7 hardcoded points** (`:214-222`), directly beneath a `Badge tone="success">Live agent data` at `:272` |
| "Fleet Health" bar chart (850/120/30) | **Hardcoded**, drifting off a client-side counter — and contradicts the real device count in the tile above it |
| "Auto-Remediations Today" | `useState(0)` — resets to zero on every page load, never read from `RemoteCommand` |
| "Estimated Admin Time Saved" | That same counter × 15 minutes |
| Remediation History seed log | Fixed timestamps shown identically to every user (`:46-48`) |

Worse, `seedDemoData()` (`dexActions.ts:55-101`) **auto-inserts fabricated crashes, software usage, a
security posture, and a smart contract into any tenant with empty tables** — on every `getDexSummary()`
call. A new customer's first login silently populates their security posture with fiction.

You have real latency data in `DeviceMetric.latencyMs` and real command counts in `RemoteCommand`. The
honest chart is a database query away. Until then, a technically literate buyer opening DevTools during a
demo sees hardcoded arrays behind a "Live" badge — and every real capability you have becomes suspect.
Remove `seedDemoData()` from the production path entirely.

### 3. The experience score is not credible enough to sell

```ts
score = 100 − max(0,cpu−50)×0.6 − max(0,memPct−60)×0.5
            − max(0,disk−70)×0.5 − max(0,latency−80)×0.15 − (battery<20 ? 10 : 0)
```

It is transparent and deterministic — good. But it is **instantaneous, not experiential**: computed from
the latest sample, weighted by hand-chosen constants, with no reference to boot time, crashes,
application responsiveness, or how the employee actually feels. A laptop that crashes twice daily but
idles cool scores 100.

It also has no time dimension. Momentary 95% CPU during a build scores identically to sustained
thrashing.

**Target model** — three weighted pillars, scored over a rolling 7 days:

- **Performance (40%)** — sustained CPU/memory pressure (time above threshold, not instantaneous), disk
  headroom, boot and login time.
- **Reliability (35%)** — crashes and hangs per week, unexpected reboots, application failures.
- **Connectivity (25%)** — packet loss, latency percentiles, WiFi signal quality, VPN health.

Then multiply by a sentiment modifier from `MicroSurveyResponse` (which you already collect and ignore).
Publish the weights in-product. Score at three levels: **device**, **employee** (worst-of / weighted
across their devices), and **organisational unit** — the last of which is what makes an executive
dashboard possible at all.

---

## Priority gaps, in order

### 1. Collaboration-app experience (Teams/Zoom) — the biggest competitive hole

This is the #1 DEX buying trigger in 2026. "Why was my video call bad?" is the question executives care
about, and it is the question that sells DEX to a CIO. Nexthink, ControlUp, and Intune Advanced Analytics
all lead with it.

*Implement:* sample Teams/Zoom process CPU and memory during calls; correlate with network quality at the
same timestamps; parse Teams client media logs for jitter, packet loss, and round-trip time; join with
WiFi signal and CPU pressure to produce a per-call quality score with a probable cause.

### 2. Executive and manager dashboards

You have no executive view and **no manager role to view one with**. Executives do not want device
tables; they want: experience score trending over quarters, cost of poor experience in hours and dollars,
department comparison, top-5 issues by employee impact, and a remediation ROI figure.

*Implement:* add `MANAGER` to the `Role` enum with an org-unit scope; build a single-screen exec view
with four tiles and one trend line. This is also what makes the product buyable above the IT-manager
level — it is a sales unlock, not just a feature.

### 3. Patch and vulnerability compliance

Absent entirely. Every regulated buyer asks for it. You already have an agent running on the endpoint —
collecting installed KBs, OS build, and missing updates is a modest addition to `extras_windows.go`, and
mapping to CVE severity turns DEX into a security-adjacent sale with a much larger budget line.

### 4. Root cause analysis

`Problem.rootCause` is a text field. Real RCA correlates: this crash spike began at this software
version rollout; these 40 devices share a driver; this latency degradation tracks one office's gateway.

*Implement:* start with cohort correlation — when an anomaly cluster appears, automatically test shared
attributes (OS build, GPU driver, installed software version, subnet, office) and surface the strongest
correlate with a confidence figure. This is achievable with the data you already store and does not
require ML.

### 5. Benchmarking

You are multi-tenant, which means you can offer something single-tenant competitors cannot: *"your boot
time is in the 40th percentile for manufacturing companies of your size."* Requires careful anonymisation
and explicit opt-in, but it is a genuine moat — it compounds with every customer and cannot be copied by
a new entrant. See [Phase 12](10-product-and-business.md).

---

## Recommended sequence

**Now (weeks):** surface boot/login time; surface packet loss and WiFi from real data; replace the three
fabricated charts; remove `seedDemoData()` from production; move prediction recompute to a job.

**Next (1-2 months):** rebuild the experience score on the three-pillar model; add `MANAGER` role and an
executive dashboard; add patch compliance.

**Then (3-6 months):** Teams/Zoom experience; cohort-correlation RCA; employee-level scoring with
sentiment; VPN and browser telemetry.

**Later:** anonymised cross-tenant benchmarking; proactive AI recommendations.

The first bucket is mostly *displaying data you already have*. That is an unusually favourable position —
your collection layer has run ahead of your presentation layer, which is the right way round to be behind.
