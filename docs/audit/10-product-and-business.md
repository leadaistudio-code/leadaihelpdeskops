# Phase 2 & 12 — Product and Business Review

> **Sourcing note.** Everything about *your* product is verified from source. Everything about
> competitors is **analyst judgement** based on publicly documented capabilities and general market
> knowledge as of my January 2026 training cutoff. Competitor feature sets and pricing change frequently
> — verify current positioning before using any of this in a sales or fundraising context. I have not
> tested competitor products for this audit.

---

## Where you actually sit

You are building in a market with three distinct incumbent groups:

1. **ITSM platforms** — ServiceNow, Jira Service Management, Freshservice, HaloITSM, ManageEngine, Ivanti
2. **DEX platforms** — Nexthink, ControlUp, SysTrack (Lakeside), Riverbed Aternity
3. **Endpoint management** — Microsoft Intune, Tanium

**The convergence of groups 1 and 2 is real and it is your thesis.** ServiceNow bought Nexthink-adjacent
capability; Nexthink pushes into workflow; Intune adds analytics. Betting on ITSM+DEX as one product is a
**correct read of the market.**

The problem is that you are currently *behind in both categories individually* while being ahead on the
combination — and buyers purchase by category. That tension defines your go-to-market challenge.

---

## Comparison matrix

Scale: ●●● strong · ●●○ adequate · ●○○ weak · ○○○ absent
*(Your column is verified from source; all others are analyst judgement.)*

| Capability | **You** | ServiceNow | JSM | Freshservice | HaloITSM | ManageEngine | Ivanti | Nexthink | ControlUp | SysTrack | Intune | Tanium |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Incident Mgmt | ●●○ | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ○○○ | ○○○ | ○○○ | ○○○ | ●○○ |
| Problem Mgmt | ●●○ | ●●● | ●●○ | ●●○ | ●●● | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| **Change Mgmt** | **○○○** | ●●● | ●●○ | ●●○ | ●●● | ●●○ | ●●● | ○○○ | ○○○ | ○○○ | ○○○ | ●○○ |
| Release Mgmt | ○○○ | ●●● | ●●○ | ●○○ | ●●○ | ●○○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| Knowledge Mgmt | ●●○ | ●●● | ●●● | ●●○ | ●●● | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| **CMDB** | **●○○** | ●●● | ●●○ | ●●○ | ●●○ | ●●○ | ●●● | ●○○ | ●○○ | ●○○ | ●○○ | ●●● |
| Service Catalog | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| SLA Mgmt | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| Approvals | ●○○ | ●●● | ●●● | ●●○ | ●●● | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ |
| Asset/SAM | ●○○ | ●●● | ●●○ | ●●● | ●●● | ●●● | ●●● | ●○○ | ●○○ | ●●○ | ●●○ | ●●● |
| **Device telemetry** | **●●○** | ●○○ | ○○○ | ●○○ | ○○○ | ●●○ | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●●● |
| **Experience score** | **●●○** | ●○○ | ○○○ | ○○○ | ○○○ | ○○○ | ●○○ | ●●● | ●●● | ●●● | ●○○ | ○○○ |
| Boot/login analytics | ●○○ | ○○○ | ○○○ | ○○○ | ○○○ | ●○○ | ●○○ | ●●● | ●●● | ●●● | ●●○ | ●●○ |
| **Teams/Zoom quality** | **○○○** | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ | ○○○ | ●●● | ●●● | ●●○ | ●○○ | ○○○ |
| **Predictive failure** | **●●●** | ●○○ | ○○○ | ○○○ | ○○○ | ○○○ | ●○○ | ●●○ | ●●○ | ●●○ | ●○○ | ●○○ |
| **Auto-remediation** | **●●○** | ●●○ | ●○○ | ●○○ | ●○○ | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●●○ | ●●● |
| Patch compliance | ○○○ | ●●○ | ○○○ | ●●○ | ●○○ | ●●● | ●●● | ●●○ | ●●○ | ●●○ | ●●● | ●●● |
| AI copilot | ●●○ | ●●● | ●●○ | ●●○ | ●○○ | ●○○ | ●●○ | ●●○ | ●○○ | ●○○ | ●●○ | ●○○ |
| Virtual agent | ●●○ | ●●● | ●●○ | ●●○ | ●○○ | ●○○ | ●●○ | ●●○ | ○○○ | ○○○ | ○○○ | ○○○ |
| Workflow automation | ●○○ | ●●● | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | ●●○ | ●○○ | ●●○ | ●●○ |
| ChatOps | ○○○ | ●●● | ●●● | ●●○ | ●●○ | ●○○ | ●○○ | ●●○ | ●○○ | ○○○ | ●●○ | ●○○ |
| macOS support | ○○○ | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● | ●●● | ●●● |
| **SSO/SAML/SCIM** | **○○○** | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●● | ●●● | ●●○ | ●●○ | ●●● | ●●● |
| Multi-tenant/MSP | ●●○ | ●●○ | ●●○ | ●●○ | ●●● | ●●● | ●●○ | ●●○ | ●●● | ●●○ | ●●○ | ●●○ |
| Compliance certs | ○○○ | ●●● | ●●● | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●○ | ●●○ | ●●● | ●●● |
| Mobile | ●○○ | ●●● | ●●● | ●●● | ●●○ | ●●○ | ●●○ | ●●○ | ●○○ | ●○○ | ●●● | ●●○ |
| Accessibility/VPAT | ●○○ | ●●● | ●●● | ●●○ | ●●○ | ●○○ | ●●○ | ●●○ | ●○○ | ●○○ | ●●● | ●●○ |

**The pattern:** you are mid-tier on ITSM, mid-tier on DEX, **absent on the enterprise trust layer**
(SSO/SCIM, compliance certifications, macOS, accessibility) — and **leading on exactly one thing:
explainable predictive failure detection.**

That last cell is not a rounding error. It is your entire strategy.

---

## What customers expect in 2026 that you lack

| Expectation | Status | Severity |
|---|:--:|---|
| SSO/SAML + SCIM provisioning | ❌ | **Blocker** — asked on every enterprise RFP |
| SOC 2 Type II | ❌ | **Blocker** — asked before technical evaluation |
| Change Management | ❌ | **Blocker** for regulated buyers |
| macOS agent | ❌ | **Blocker** for most modern enterprises |
| Collaboration-app experience | ❌ | Blocker for a DEX-led sale |
| Mobile-capable employee portal | ❌ | Fails UAT |
| Accessibility/VPAT | ❌ | Blocker for public sector |
| Data residency (EU) | ❌ | Blocker for EU buyers |
| Open API + webhooks | ❌ | Expected by any platform team |
| Patch/vulnerability compliance | ❌ | Expected in a security-adjacent sale |
| AI transparency and controls | ⚠️ | Increasingly asked — model choice, opt-out, no-training guarantees |

---

## Gartner-style assessment

### Who should buy this today?

**Honest answer: nobody in your named target markets, yet.** With the [Phase 9](02-security.md) P0s
open, the responsible recommendation is that no organisation should deploy this to production endpoints
this week.

**After the Week-1 security fixes**, the realistic early buyer is:

> A **150-800 person technology-forward company** with a 2-5 person IT team, predominantly Windows,
> currently on Freshservice or Jira Service Management, frustrated that their ITSM tool is blind to what
> is happening on actual laptops — and with no compliance requirement forcing SOC 2 or SSO on day one.

Secondary: **small and mid-size MSPs** managing 500-5,000 endpoints who need multi-tenancy and would
value one tool instead of an RMM plus a ticketing system. Your `domain`-per-tenant model and Clerk
Organizations already fit this — but the **global unique on `User.email`** ([Phase 1](01-architecture.md))
means the same person cannot exist in two tenants, which is a direct blocker for the MSP case. Fix that
before selling to MSPs.

### What problem do you solve?

**"My ITSM tool tells me a ticket was raised. It cannot tell me why the laptop is slow."**

That gap is real and expensively felt. Today an IT team runs ServiceNow (or Freshservice) *plus* Nexthink
(or nothing), pays twice, integrates poorly, and still has no path from "employee is unhappy" to "this
device's disk is failing." You close that loop in one product.

### Unique value proposition

> **The only IT platform where a predicted hardware failure automatically becomes a ticket, a fix, and a
> resolved incident — without a human in the loop.**

That is genuinely differentiated because it requires three things in one product: telemetry, prediction,
and workflow. ServiceNow has workflow and weak telemetry. Nexthink has telemetry and weak workflow.
**Nobody has the full loop in a single product at SMB pricing.**

The proof is in your code: `hardware-prediction.ts` → `HardwareFailurePrediction` → `RemoteCommand` →
agent execution → incident resolution. That chain exists and works.

### Why would anyone switch from ServiceNow?

**Mostly, they would not — and you should stop trying to make them.** ServiceNow displacement takes 18-24
months, costs millions, and is career-risking for the sponsor. Attacking it head-on is the most common way
ITSM startups die.

Where switching *is* plausible:
- **Cost.** ServiceNow at 1,000 employees runs into six figures annually. Your $6/device is an order of
  magnitude cheaper. But note: **your own site publishes two contradictory price sheets** — $6/device on
  `/` and $8-18/employee on `/p/pricing`, with different unit bases. Fix that before any pricing
  conversation.
- **Time to value.** ServiceNow implementations take 6-18 months and a partner. You can be live in a day.
  This is your strongest commercial argument and it is verifiable — lead with it.
- **The DEX layer they do not have.** Land as a *complement* to ServiceNow, not a replacement.

Switching from **Jira Service Management** or **Freshservice** is far more realistic: shorter contracts,
less customisation debt, and neither has meaningful endpoint telemetry.

### Where you outperform

1. **Explainable prediction.** Slope, r², sample count, days-to-threshold. Competitors ship opaque risk
   scores. In a market drowning in unfalsifiable AI claims, showing your working is a real advantage —
   and it is *architecturally* differentiated because it is regression, not an LLM.
2. **Prediction-to-remediation loop in one product.**
3. **Time to value** — an agent installed in minutes vs. a multi-month implementation.
4. **Price point** — DEX capability at SMB pricing; Nexthink and Tanium are enterprise-only.
5. **AI-native from the start** rather than bolted on.

### Where you are weaker

1. No enterprise trust layer (SSO/SCIM, SOC 2, VPAT, data residency).
2. No Change Management — disqualifying for regulated buyers.
3. No macOS.
4. No collaboration-app experience — the #1 DEX buying trigger.
5. No ecosystem: no marketplace, no partners, no integrations, no public API.
6. **No referenceable customers** — and the fabricated ones on your site
   ([Phase 9](02-security.md) P0-5) actively damage credibility when discovered.
7. Single-founder-scale engineering against companies with hundreds of engineers.

---

## Moat strategy

Most of what you have is copyable. Feature parity is not a moat; ServiceNow can build any single feature
you have. **Four things could become genuinely defensible:**

### 1. Cross-tenant benchmarking (strongest)

You are multi-tenant with a homogeneous telemetry schema. That lets you say what no single-tenant
competitor can: *"your boot time is in the 40th percentile for manufacturing companies of your size"* and
*"this driver version correlates with a 3× crash rate across 40,000 devices we observe."*

**Why it is a moat:** it compounds with every customer, cannot be replicated by a new entrant regardless
of funding, and improves the product for existing customers as you grow. It is the only asset here with
genuine network effects.

**Requirements:** explicit opt-in, rigorous anonymisation and k-anonymity thresholds, and a clear data
agreement. Get the privacy design right early — retrofitting consent onto already-collected data is
legally messy, particularly under GDPR.

### 2. The prediction model improving with data

Every predicted-then-confirmed failure is a labelled training example. Over time you can predict failure
modes nobody else can — but only if you **record outcomes**. Today you delete and recreate predictions on
each recompute (`dexActions.ts:584`), destroying the historical record.

**Change this now.** Version predictions and record whether each came true. It costs almost nothing today
and is the seed corn of a real model advantage. This is the cheapest strategically important change in
this entire audit.

### 3. Remediation library as a community asset

A curated, signed, versioned library of remediation actions — with success rates measured across your
whole fleet — becomes more valuable with every customer. *"This runbook resolves the issue 94% of the
time across 12,000 executions."* Nobody can copy the success data.

### 4. Vertical depth

A generic ITSM+DEX platform competes with everyone. **"The ITSM+DEX platform for hospitals"** — with
clinical workstation profiles, shared-workstation login analytics, medical device inventory, and HIPAA
posture built in — competes with almost nobody, and commands higher prices. Manufacturing and financial
services are similarly under-served.

Given a small team, **vertical focus is likely your highest-probability path**, because it lets you win
without matching the breadth of platforms with 500× your engineering capacity.

---

## Win probability

**Today (P0s open, no SSO, no Change Management, no SOC 2, no macOS):**

| Segment | vs ServiceNow | vs JSM/Freshservice |
|---|---:|---:|
| SMB (<200) | ~10% | ~15% |
| Mid-market (200-2,000) | ~3% | ~7% |
| Enterprise (2,000+) | <1% | <2% |

**After 12 months executing the [roadmap](11-roadmap.md)** — security fixed, SSO/SCIM, SOC 2, Change
Management, macOS, collaboration experience, real references:

| Segment | vs ServiceNow | vs JSM/Freshservice |
|---|---:|---:|
| SMB (<200) | ~40% | ~35% |
| Mid-market (200-2,000) | ~20% | ~25% |
| Enterprise (2,000+) | ~5% | ~8% |

These are judgement calls, not measurements. The shape matters more than the numbers: **you can win SMB
and mid-market on the DEX differentiator and time-to-value. You will not win enterprise ServiceNow
displacements for several years, and you should not spend money trying.**

---

## Strategic recommendation

**Do not position as an ITSM platform.** You will lose that comparison on every RFP feature matrix, and
the matrix above shows why.

**Position as: "The IT platform that fixes problems before employees notice."** Lead with prediction and
automated remediation — the things you demonstrably do better. Let ITSM be the *table stakes* you happen
to include, not the headline.

**Land-and-expand:** sell DEX into companies that already have a service desk. Prove value in 30 days
with predicted failures and automated fixes. Then displace the incumbent service desk once you are
already delivering visible value and Change Management ships.

Three commercial actions this month:
1. **Remove the fabricated statistics and testimonials** ([Phase 9](02-security.md) P0-5). Replace with
   honest early-stage positioning — your landing page already does this well.
2. **Fix the contradictory pricing.** Two price sheets with different unit bases is a credibility problem
   before it is a revenue problem.
3. **Get three real design partners** and publish real numbers, even small ones. One honest customer
   result beats "3.4M tickets deflected" with every buyer who matters.
