# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** IT agents and administrators — triaging incidents, running DEX remediation campaigns, managing SLAs, problems, assets, and audit compliance. They work in sustained sessions, often under time pressure, scanning queues and dashboards for what needs attention next.

**Secondary:** Employees — self-service portal for catalog requests, knowledge base lookup, and ticket submission. They arrive with a specific task, expect minimal friction, and should not need training on IT tooling.

Both audiences share one platform with module-level access control; IT staff see operational depth, employees see only what they need.

## Product Purpose

LeadAIStudio is a DEX-first IT operations platform that unifies endpoint telemetry and service desk workflows in a single system of record. It exists to help IT teams detect and resolve issues proactively — often before an employee files a ticket — while giving employees a calm, straightforward self-service experience.

Success is balanced: faster resolution and SLA compliance for IT, and frictionless self-service for employees. Neither audience should feel like an afterthought.

## Positioning

DEX-first operations — endpoint telemetry and service desk in one platform.

## Operating Context

- **IT Staff**: Operate primarily out of queues (Active/Assigned/Closed) and dashboards. They use bulk actions and automated PowerShell remediation campaigns to manage fleets of devices.
- **Employees**: Use a self-service portal (catalog, knowledge base, ticket submission) and wait for resolutions without navigating complex IT workflows.
- **Platform integrations**: Interacts with endpoint telemetry via a lightweight desktop agent running on employee devices (Windows Event Logs, BitLocker, Firewall, Defender). Deployed via Next.js (Vercel) and uses PostgreSQL (Supabase). Notifications are sent via email (Resend) and in-app.

## Capabilities and Constraints

- **Core functionality**: Real-Time DEX Telemetry, Module-Level Access Control (RBAC), Live SLA Engine, Incident/Problem Management, Service Catalog, Audit Trail, and CMDB map.
- **Technical constraints**: Built on Next.js 16 (App Router), Prisma 7, Clerk (Organizations/tenants), and Tailwind CSS v4. Must support `prefers-reduced-motion` crossfades and dark mode contrast for long shifts.
- **Undecided/Upcoming**: Future features include Shadow IT Cost-Killer, Predictive Burnout/Sentiment Engine, Hardware Lifecycle Arbitrage, and an AI "Digital Twin" agent using a Vector DB.

## Brand Commitments

- **Personality**: Enterprise calm: trustworthy, restrained, and modern without spectacle. The product should feel like a capable operations tool an IT director would trust in a board review — authoritative but not flashy. Confidence comes from clarity and reliability, not visual drama. Voice is direct and professional. Tone is calm under pressure. Emotional goal: assured competence.
- **Anti-references**: Over-the-top sci-fi aesthetics — neon overload, glassmorphism as decoration, pulse-glow effects, "hacker movie" telemetry theatrics, and any visual language that reads as gaming or cyberpunk rather than enterprise operations software.
- **Visual Identity**: "Mission Control" redesign with cinematic dark identity (signal-mint accent). Logo: "Node Lattice" mark. Font: Bricolage Grotesque for display/headings, Plus Jakarta Sans for UI chrome.

## Evidence on Hand

- `LeadAIStudio_Pitch_Deck.pptx`: Comprehensive sales pitch for GTM teams demonstrating unique business value.
- `PRODUCT_FEATURES.md`: Sales playbook covering real-time DEX campaigns and module-level access control.
- Live telemetry dashboard and automated runbooks functionality in place.
- Walk-up kiosk and onboarding flows available.

## Product Principles

1. **Calm authority over spectacle** — Information and action take priority over decorative motion or glow effects. If a visual element doesn't help someone complete a task, remove it.
2. **Ops clarity** — Dense when IT staff need it, sparse when employees don't. Every screen should answer "what needs my attention?" within seconds.
3. **Proactive before reactive** — DEX signals, SLA clocks, and breach warnings should feel as native as ticket queues. The platform's value is fixing things before they're reported.
4. **Dual audience, one system** — IT power and employee simplicity coexist through module scoping and progressive disclosure, not separate products.
5. **Trust through restraint** — Enterprise buyers judge credibility by how seriously the interface takes their work. Restrained typography, consistent spacing, and reliable states build more trust than visual novelty.

## Accessibility & Inclusion

WCAG 2.1 AA compliance target across all product surfaces. Support `prefers-reduced-motion` on dashboards and data visualizations where animation is used. Ensure contrast holds on dark operational surfaces during long shift usage.
