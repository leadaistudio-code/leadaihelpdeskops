# LeadAIStudio — Autonomous IT Operations Platform

An AI-native **IT Service Management (ITSM) & AIOps** platform: a single system of record for the service desk, digital employee experience, knowledge, service catalog, and asset management — with a live SLA engine, problem management, an immutable audit trail, and a device agent that predicts and heals endpoint issues.

> **Tagline:** *IT that fixes itself — before anyone files a ticket.*

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Feature Modules](#feature-modules)
- [Recent Updates](#recent-updates)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions, Turbopack) |
| Language | TypeScript · React 19 |
| Database | **PostgreSQL** (Supabase) via **Prisma 7** (`@prisma/adapter-pg`) |
| Auth & Tenancy | **Clerk** (Organizations = tenants, role-based access) |
| Styling | **Tailwind CSS v4** · custom "Mission Control" design system |
| Motion | `motion` (Framer Motion successor) · CSS 3D |
| Charts | Recharts |
| AI | Vercel AI SDK (currently OpenAI `gpt-4o-mini`; **Claude migration planned**) |
| Email | Resend (best-effort, env-gated) |
| Video | Remotion (marketing product demo) |

---

## Feature Modules

### 🎫 Incident Management
- Full incident lifecycle: `NEW → IN_PROGRESS → ON_HOLD → PENDING_APPROVAL → RESOLVED → CLOSED`
- **AI triage** on creation — auto-suggests priority and routes to the right assignment group
- Paginated, searchable, filterable queue (by status, group) + dedicated **Active / Assigned / Closed** views
- Activity timeline (comments, work notes, system events), assignment & assignment-group controls
- File attachments, priority levels (`LOW → CRITICAL`), unified **Incident/Request** ticket types

### ⏱️ Live SLA Engine
- Per-ticket **live SLA clock** with a real ticking countdown on the record
- **Business calendars:** `24×7` (calendar hours) or `8×5` (Mon–Fri, 09:00–17:00)
- Automatic lifecycle: **starts** on create → **pauses** on hold → **resumes** (deadline extends by hold time) → **stops** as **Met** or **Breached** on resolve
- **Breach escalation** — auto-marks breached, logs a system note, notifies the assignee + assignment group
- **Scheduled sweep** (`/api/sla/sweep`, Vercel Cron) escalates breaches on unviewed tickets; lazy on-view escalation as backup
- **SLA status chips** (Breached / Due soon / On track / Paused / Met) on every queue view
- Admin-configurable SLA policies per ticket-type + priority + calendar

### 🔎 Problem Management (ITIL)
- Root-cause records (`PRB…`) behind recurring incidents
- Lifecycle: `NEW → INVESTIGATING → ROOT_CAUSE_IDENTIFIED → KNOWN_ERROR → RESOLVED → CLOSED`
- **Root cause** + **workaround** capture, **Known Error** flagging
- Link/unlink multiple incidents to a problem; **"Create Problem from Incident"** one-click
- Filterable problem list, per-problem activity timeline

### 🛡️ Audit Trail
- **Immutable, append-only** record of every significant change — who / what / entity / when, with field-level `old → new` diffs
- Captures: incident create/state/assign, problem create/state/link, approvals, **SLA breaches**, role changes, DEX remediations
- Admin console at `/admin/audit` — filter by entity, action, and free-text search; paginated; deep-links to the affected record

### 🛒 Service Catalog & Requests
- Service catalog with categorized items (Hardware / Software / Access), icons, optional showback price
- Employee request flow that opens a tracked work-queue ticket
- **Approvals** — approve/reject with reason; keeps the catalog request and its incident in sync; notifies the requester

### 📚 Knowledge Management
- Knowledge articles with publish/draft states and attachments
- **AI-drafted articles** generated from a resolved incident (human-in-the-loop review)
- Pre-ticket **deflection** — surfaces relevant KB articles before a ticket is filed
- Article feedback capture

### 💻 Digital Employee Experience (DEX / AIOps)
- Lightweight **device agent** enrollment (per-tenant token → per-device key)
- Live telemetry ingest: CPU, memory, disk, battery, latency, uptime
- Composite **Experience Score** (0–100) per device + fleet rollups
- **Proactive monitoring** — threshold rules auto-raise deduped alert incidents
- **Auto-heal ("Auto-Pilot")** — safe remediation runbooks (`FLUSH_DNS`, `CLEAR_TEMP`, `RESTART_SPOOLER`, `REBOOT`) queued to the agent
- Live fleet dashboard (15s polling)

### 🗺️ Asset & Configuration Management
- Hardware/software asset register with status, assignment, purchase data
- **CMDB** interactive dependency map (zoom, search, node selection)

### 📊 Reports & Analytics
- KPI dashboards, area/bar/pie charts, MTTR, deflection, SLA compliance
- Role-aware dashboards: employee self-service portal vs. agent "Command Center"

### 🔔 Notifications
- In-app notification bell + best-effort **email** (honors per-user preference)
- Fan-out on assignment, approval/rejection, resolution, comments, and SLA breach

### 🛠️ Administration
- **User management** & role assignment (mirrored to Clerk)
- **Team & invites**, **assignment groups**
- **SLA policy** management (with business calendars)
- Visual **Flow Designer** (approval chains, routing, SLA config)
- **Audit Log** console

### 🖥️ Additional Surfaces
- **Walk-up kiosk** for in-person service desk queues
- **Onboarding** flow for new tenants (org creation)
- Marketing site (`/`), product pages (`/p/*`), gated content **guides** with lead capture, ROI calculator, click-to-play product demo video

### 🏢 Multi-Tenancy & Security
- Tenant = **Clerk Organization**; all data is `domain`-scoped
- Three roles: **ADMIN**, **IT_AGENT**, **EMPLOYEE**
- Per-tenant isolation on catalog, incidents, problems, DEX, users, and the audit trail

---

## Recent Updates

Highlights from the latest build cycle:

- 🎨 **"Mission Control" redesign** — cinematic dark identity (signal-mint accent), reskinned across the landing page and the entire app surface; live canvas telemetry field, CSS-3D tilt, orchestrated motion; new **Bricolage Grotesque** display font
- 📡 **New logo** — the "Node Lattice" mark (`<Logo/>` component) + SVG favicon
- ⏱️ **Live SLA Engine** — business-hours calculator, live countdowns, pause/resume, breach escalation, scheduled sweep, and list-view SLA chips
- 🔎 **Problem Management** — full ITIL problem module with RCA, known errors, and incident linking
- 🛡️ **Audit Trail** — immutable change log instrumented across all major write paths, with an admin console

---

## Getting Started

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment (see below)
cp .env.example .env    # then fill in the values

# 3. Push the schema to your database
npx prisma db push

# 4. (Optional) Seed demo data
npx prisma db seed

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Common scripts:**

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npx prisma db push` | Sync schema to the database |
| `npx prisma generate` | Regenerate the Prisma client (run after schema changes) |

> **Note:** after adding a Prisma model, run `npx prisma generate` explicitly if the client doesn't pick it up.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase pooler) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk auth |
| `CLERK_SECRET_KEY` | ✅ | Clerk auth |
| `OPENAI_API_KEY` | ⬜ | AI triage / deflection / suggestions (Claude migration planned) |
| `RESEND_API_KEY` | ⬜ | Email notifications (no-ops if unset) |
| `CRON_SECRET` | ⬜ | Secures the scheduled SLA breach sweep (`/api/sla/sweep`) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Marketing landing (Mission Control redesign)
│   ├── dashboard/               # Role-aware dashboards
│   ├── incidents/               # Queue + detail + active/assigned/closed
│   ├── problems/                # Problem Management (ITIL)
│   ├── catalog/  knowledge/  assets/  cmdb/  dex/  reports/
│   ├── approvals/  my-requests/  walkup/  onboarding/
│   ├── admin/                   # users, team, groups, slas, flow-designer, audit
│   ├── api/
│   │   ├── agent/               # DEX device-agent ingest (enroll, metrics, commands)
│   │   ├── sla/sweep/           # Scheduled SLA breach sweep
│   │   └── ai/  chat/           # AI endpoints
│   └── actions/                 # Server actions (incidents, problems, sla, audit, …)
├── components/                  # Logo, SlaDisplay, SlaBadge, AppShell, Header, Sidebar, …
├── lib/                         # prisma, tenant, auth-utils, audit, business-hours, sla, …
└── prisma/schema.prisma         # Data model
vercel.json                      # SLA sweep cron
```

---

## Roadmap

**ITSM parity (next):**
- Change Management (change requests, CAB approvals, change calendar)
- Major Incident Management (war-room, stakeholder comms)
- CSAT surveys · Bulk actions & saved views · Command palette (⌘K)
- Entity-scoped audit tab on incident/problem detail

**Platform & AI:**
- Migrate the AI layer to **Claude** (Fable 5 / Opus 4.8) with real tool-use agents, genuine predictive AIOps, and embeddings-based knowledge retrieval
- Redis-backed rate limiting · object-storage attachments · live SLA business-calendar timezones
- Hardening: enforced tenant isolation, centralized RBAC, responsive/mobile app shell, accessibility pass

---

*Built with Next.js, Prisma, Clerk, and Tailwind. Design & branding: the "Mission Control" system with the Node Lattice mark.*
