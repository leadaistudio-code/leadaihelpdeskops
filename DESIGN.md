---
name: LeadAIStudio
description: DEX-first IT operations platform — enterprise calm on a dark operations console
colors:
  ink: "#080B11"
  ink-2: "#0B0F17"
  panel: "#0F141D"
  panel-2: "#141B26"
  signal: "#38E8B0"
  signal-deep: "#12B489"
  signal-dimmer: "#0E9E77"
  violet-ambient: "#6D5EF6"
  text-primary: "#EAEEF5"
  text-muted: "#8D98AC"
  text-dim: "#5C6678"
  line: "#1F2937"
  line-soft: "#161E29"
  surface-light: "#f1f5f9"
  slate-ink: "#0f172a"
  warn: "#F5B14C"
  crit: "#FF6B7D"
  success: "#34d399"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    fontSize: "12px"
    letterSpacing: "0.05em"
    lineHeight: 1.4
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, Cascadia Code, monospace"
    fontWeight: 600
    fontSize: "11.5px"
    letterSpacing: "0.12em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-deep}"
    textColor: "#03130d"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.signal}"
    textColor: "#03130d"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.03)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
  input-default:
    backgroundColor: "rgba(15,23,42,0.5)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  nav-active:
    backgroundColor: "rgba(56,232,176,0.10)"
    textColor: "{colors.signal}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: LeadAIStudio

## 1. Overview

**Creative North Star: "The Calm Operations Console"**

LeadAIStudio is a DEX-first IT operations platform where design serves the task, not the spectacle. The visual system reads as a capable enterprise tool: dark ink surfaces, restrained signal-mint accents, and information hierarchy that helps IT staff scan queues under pressure while keeping employee self-service approachable.

The codebase carries a "Mission Control" heritage — aurora gradients, glass panels, signal-mint telemetry accents — but the strategic direction is **enterprise calm**: trustworthy, restrained, modern. New work should move toward clarity and reliability; legacy sci-fi decoration (neon glows, pulse animations, gradient text metrics) is drift to correct, not a pattern to extend.

The app shell uses a fixed header + collapsible sidebar + glass main panel. Marketing pages (`/`, `/login`, `/guides/*`) use a self-contained `.mc-root` scope with the same ink/signal palette but heavier motion. Product surfaces default to dark; light mode is supported via `.app-root.theme-light` overrides.

**Key Characteristics:**
- Dark ink ground (`#080B11`) with cool violet ambient depth, not warm cream SaaS defaults
- Signal-mint (`#38E8B0`) as the primary accent — remapped globally from indigo/blue in dark app mode
- Bricolage Grotesque for display headings; Plus Jakarta Sans for UI body and labels
- Glass-panel surfaces with subtle borders, not decorative glassmorphism stacks
- Semantic color vocabulary for SLA and status (rose/amber/emerald), untouched by accent remap
- Dual theme system: app dark-native, marketing dark-native, both with light overrides

## 2. Colors

A cool ink palette with one disciplined accent. Signal-mint marks primary actions, active navigation, and operational highlights — not decoration.

### Primary
- **Signal Mint** (`#38E8B0` / oklch(84% 0.14 166)): Primary accent text, active nav, links, focus rings. The operational "go" color.
- **Signal Deep** (`#12B489` / oklch(68% 0.13 166)): Primary button fills, gradient stops. Paired with dark ink text (`#03130d`) for contrast.
- **Signal Dimmer** (`#0E9E77`): Hover states on primary fills.

### Secondary
- **Ambient Violet** (`#6D5EF6` / oklch(58% 0.22 278)): Atmospheric depth in aurora backgrounds and marketing glows. Secondary accent only — never competes with signal-mint on product surfaces.

### Tertiary
- **Semantic Rose** (`#FF6B7D`): SLA breached, critical errors, destructive actions.
- **Semantic Amber** (`#F5B14C`): Warnings, paused SLA, due-soon states.
- **Semantic Emerald** (`#34d399`): Success, SLA met, on-track states.

### Neutral
- **Operations Ink** (`#080B11`): Page ground, aurora base, marketing root background.
- **Panel Surface** (`#0F141D`): Elevated panels, glass-panel fill base.
- **Panel Raised** (`#141B26`): Nested surfaces, secondary panels.
- **Primary Text** (`#EAEEF5`): Headings and body on dark surfaces.
- **Muted Text** (`#8D98AC`): Secondary copy, descriptions, nav inactive. Must meet 4.5:1 on ink; bump toward primary text if borderline.
- **Dim Text** (`#5C6678`): Tertiary labels, timestamps. Use sparingly.
- **Line** (`#1F2937`): Borders, dividers on dark surfaces.
- **Light Surface** (`#f1f5f9`): App light-mode page ground.

### Named Rules

**The Signal Rarity Rule.** Signal-mint appears on primary actions, active navigation, and state indicators only. It does not decorate cards, section backgrounds, or idle surfaces. If mint exceeds ~10% of a screen, pull it back.

**The Semantic Integrity Rule.** Rose, amber, and emerald carry SLA and status meaning. Never remap them to signal-mint. Breached must read red; met must read green.

## 3. Typography

**Display Font:** Bricolage Grotesque (with Plus Jakarta Sans, system-ui fallback)
**Body Font:** Plus Jakarta Sans (with system-ui fallback)
**Label/Mono Font:** System monospace stack for marketing eyebrows and telemetry badges

**Character:** A humanist grotesk pairing — Bricolage adds character to page titles without going display-heavy in data UI. Jakarta carries the operational density of forms, tables, and nav. The pairing works when display type stays on h1–h3 and never bleeds into buttons, labels, or table cells.

### Hierarchy
- **Display** (800, `text-4xl` / 2.25rem, line-height 1.04, letter-spacing -0.03em): Page titles ("Welcome", dashboard headings). `text-wrap: balance` on h1–h3.
- **Headline** (700–800, `text-xl`–`text-2xl`, line-height 1.2): Section headers, card titles, modal titles.
- **Title** (700, `text-sm` uppercase tracking-widest): Table headers, panel section labels, nav group labels.
- **Body** (400–500, 14–16px, line-height 1.55): Descriptions, table cells, form help text. Cap prose at 65–75ch.
- **Label** (700, 12px, letter-spacing 0.05em, uppercase): Form field labels, status section headers, SLA chip prefixes.

### Named Rules

**The UI Sans Rule.** Buttons, inputs, data tables, and navigation labels use Plus Jakarta Sans only. Bricolage is for page-level headings, not component chrome.

**The Tracking Floor Rule.** Display letter-spacing never goes below -0.04em. Tighter tracking makes grotesk letters touch and reads cramped, not designed.

## 4. Elevation

Hybrid system: tonal layering on dark ink, with restrained shadows on glass surfaces. Depth comes from surface color steps (ink → panel → panel-2) and border luminance, not heavy drop shadows.

Glass panels use `backdrop-filter: blur(16px)` with a single soft shadow (`0 4px 30px rgba(0,0,0,0.28)`). This is structural, not decorative — it separates the main content shell from the aurora background. Do not stack glass-on-glass or add neon glow shadows.

### Shadow Vocabulary
- **Panel lift** (`0 4px 30px rgba(0,0,0,0.28)`): Glass-panel main container. The default elevated surface.
- **Light panel** (`0 4px 30px rgba(15,23,42,0.06)`): Glass-panel in light mode.
- **Dropdown** (`shadow-2xl`): Profile menu, modals. Reserved for floating overlays.

### Named Rules

**The Flat-By-Default Rule.** Cards and list rows are flat at rest. Elevation appears on the app shell container and floating overlays only — not on every bento tile.

**The No-Glow-Shadow Rule.** Do not pair `box-shadow` glow effects (e.g. `0 0 20px rgba(56,232,176,0.35)`) with borders on the same element. Pick border OR shadow, not both as decoration.

## 5. Components

Component feel: **refined and restrained** — confident borders, readable type, state conveyed by color not animation.

### Buttons
- **Shape:** Gently rounded (12px / `rounded-xl`). Full pill (`rounded-full`) only for icon-only or compact chips.
- **Primary:** Signal-deep fill (`#12B489`) or mint gradient (`#12B489` → `#0E9E77`), dark ink text (`#03130d`), bold weight, padding 12px 24px. Hover: brighten to signal-mint, subtle translate (-1px max).
- **Secondary / Ghost:** `rgba(255,255,255,0.03)` background, `border-white/10`, primary text. Hover: `border-signal-dim`, `bg-white/5`.
- **Danger:** Rose tint background (`bg-rose-500/10`), rose text, rose border. No gradient.
- **Hover / Focus:** 150–250ms transitions. Focus ring via `focus:ring-2 focus:ring-indigo-500/30` (remapped to signal-mint in dark mode). No pulse-glow.

### Chips / Status Badges
- **Style:** Pill shape (`rounded-full`), 10px bold text, tinted background + matching border at 10–30% opacity.
- **SLA states:** Breached = rose, Paused/Due soon = amber, Met/On track = emerald. Dot indicator (`w-1.5 h-1.5 rounded-full bg-current`).
- **Role badges:** Uppercase tracking-wider, `bg-indigo-500/20` (remapped to signal tint in dark).

### Cards / Containers
- **Corner Style:** 16px (`rounded-2xl`) for main shell and standard cards. Avoid 24px+ (`rounded-3xl`) on new work — existing bento tiles are drift.
- **Background:** `.glass-panel` — `rgba(15,20,29,0.62)` with blur, `border rgba(56,232,176,0.08)`.
- **Border:** `border-white/5` to `border-white/10` on nested cards. Hover: brighten border to accent at 30% opacity, not glow.
- **Internal Padding:** 32px (`p-8`) for feature cards; 24px (`p-6`) for compact panels.

### Inputs / Fields
- **Style:** `bg-slate-900/50` or `bg-black/30`, `border-white/10`, 12px radius, 14px body text.
- **Focus:** Border shifts to signal-mint (via indigo remap), `ring-2 ring-indigo-500/30`. No glow shadows.
- **Disabled:** `bg-white/5`, `text-slate-400`, `cursor-not-allowed`, reduced opacity.
- **Labels:** 12px bold uppercase tracking-wider, `text-slate-400`.

### Navigation
- **App shell:** Fixed header (64px) + collapsible sidebar (256px / 96px collapsed). Sidebar uses `bg-slate-950/20 backdrop-blur-md border-r border-white/5`.
- **Nav links:** `rounded-xl`, padding 10px 16px. Active: `bg-indigo-500/10 text-indigo-400 border border-indigo-500/20` (remapped to signal-mint in dark). Inactive: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`.
- **Mobile:** Nav links hidden on marketing; app sidebar collapses to icon-only.

### Glass Panel Shell
- **Signature component:** The main content area in `AppShell` — `fixed` panel with `glass-panel rounded-2xl`, inset from header/sidebar, internal scroll with `.custom-scrollbar`. This is the primary workspace affordance; all page content lives inside it.

## 6. Do's and Don'ts

### Do:
- **Do** use signal-mint for primary actions, active nav, and operational highlights only.
- **Do** keep semantic colors (rose/amber/emerald) for SLA and status — never remap them.
- **Do** use Plus Jakarta Sans for all UI chrome; reserve Bricolage for h1–h3 page titles.
- **Do** support `prefers-reduced-motion` — crossfade or instant transitions, no gated content visibility.
- **Do** maintain WCAG 2.1 AA contrast on dark surfaces, especially muted text on ink.
- **Do** use skeleton states for loading and `EmptyState` for zero-data — teach the interface.

### Don't:
- **Don't** use over-the-top sci-fi aesthetics — neon overload, glassmorphism as decoration, pulse-glow effects, "hacker movie" telemetry theatrics, or visual language that reads as gaming/cyberpunk rather than enterprise operations software.
- **Don't** pair `border: 1px solid` with wide soft glow shadows (`box-shadow: 0 0 20px+`) on the same element.
- **Don't** use `rounded-3xl` (24px+) on new cards or sections — cap at 16px.
- **Don't** use gradient text (`bg-clip-text`) for metrics or headings — solid colors only.
- **Don't** put Bricolage on buttons, form labels, table cells, or nav items.
- **Don't** animate layout properties or gate content visibility on entrance animations.
- **Don't** use decorative motion that doesn't convey state — no float/pulse on idle elements.
