"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Library,
  Ticket,
  ShieldAlert,
  BrainCircuit,
  AlertTriangle,
  Cpu,
  Zap,
  Network,
  BookOpen,
  Laptop,
  Monitor,
  KeyRound,
  ArrowRight,
  Smartphone,
  Headphones,
  Cloud,
  Code,
} from "lucide-react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

type TabKey = "command" | "dex" | "analytics" | "catalog";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard; blurb: string }[] = [
  {
    key: "command",
    label: "Command Center",
    icon: LayoutDashboard,
    blurb: "A live global overview of every incident, with KPIs, critical-priority alerts, and your active work in one glance.",
  },
  {
    key: "dex",
    label: "DEX & AIOps",
    icon: Activity,
    blurb: "Real-time endpoint telemetry with predictive intelligence that forecasts hardware failures before they happen — and heals them automatically.",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    blurb: "MTTR, ticket deflection, and SLA compliance trends visualized so you can prove impact to the business.",
  },
  {
    key: "catalog",
    label: "Service Catalog",
    icon: Library,
    blurb: "A 24-item self-service storefront where employees request hardware, software, mobile devices, and access — routed through automated approval chains.",
  },
];

/* ----------------------------- Browser frame ----------------------------- */

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950">
      <div className="h-10 bg-slate-900 flex items-center px-4 border-b border-slate-700/60">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-slate-600" />
          <div className="w-3 h-3 rounded-full bg-slate-600" />
          <div className="w-3 h-3 rounded-full bg-slate-600" />
        </div>
        <div className="mx-auto px-6 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-400 font-medium w-72 text-center truncate">
          {url}
        </div>
      </div>
      {/* App canvas — mirrors the real dark gradient background */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 h-[440px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
        <div className="flex h-full">
          <MiniSidebar />
          <div className="flex-1 overflow-hidden p-5 relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MiniSidebar() {
  const items = [
    { icon: LayoutDashboard, active: true },
    { icon: Library },
    { icon: BookOpen },
    { icon: Activity },
    { icon: BarChart3 },
    { icon: Network },
    { icon: Ticket },
    { icon: Laptop },
  ];
  return (
    <div className="hidden sm:flex flex-col items-center w-14 shrink-0 border-r border-white/5 bg-slate-950/40 py-4 gap-4">
      <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center mb-2">
        <Zap className="w-4 h-4 text-white" />
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            it.active
              ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
              : "text-slate-600"
          }`}
        >
          <it.icon className="w-4 h-4" />
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Reusable mock bits -------------------------- */

function StatusPill({ tone, children }: { tone: "sky" | "amber" | "rose" | "emerald" | "slate"; children: React.ReactNode }) {
  const map = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[tone]}`}>{children}</span>;
}

/* ------------------------------ Mock screens ----------------------------- */

function CommandCenterMock() {
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">Command Center</h3>
          <p className="text-slate-400 text-xs">Global overview of IT operations.</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold shadow-[0_0_16px_rgba(124,58,237,0.4)]">
          + Create Incident
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { icon: Ticket, val: "128", label: "Open Incidents", color: "text-white", ring: "bg-indigo-500/20 text-indigo-400" },
          { icon: ShieldAlert, val: "6", label: "Critical Priority", color: "text-rose-400", ring: "bg-rose-500/20 text-rose-400" },
          { icon: Activity, val: "14", label: "Assigned to Me", color: "text-emerald-400", ring: "bg-emerald-500/20 text-emerald-400" },
          { icon: Zap, val: "99.9%", label: "SLA Compliance", color: "text-sky-400", ring: "bg-sky-500/20 text-sky-400" },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl p-3 bg-slate-900/60 border border-white/10 backdrop-blur">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-3 ${c.ring}`}>
              <c.icon className="w-3.5 h-3.5" />
            </div>
            <div className={`text-2xl font-black mb-0.5 ${c.color}`}>{c.val}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Chart */}
        <div className="col-span-1 rounded-2xl p-3 bg-slate-900/60 border border-white/10">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Incident Volume (7d)</div>
          <div className="flex items-end gap-1.5 h-20">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-sky-400" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="col-span-2 rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5 bg-black/20 text-[9px] font-black text-slate-400 uppercase tracking-wider">
            My Active Work
          </div>
          <table className="w-full text-[11px]">
            <tbody>
              {[
                { n: "INC0010042", p: "rose", ps: "CRITICAL", d: "VPN gateway unreachable" },
                { n: "INC0010038", p: "amber", ps: "HIGH", d: "Outlook crash on launch" },
                { n: "INC0010031", p: "slate", ps: "MEDIUM", d: "Printer driver missing" },
                { n: "INC0010024", p: "slate", ps: "LOW", d: "Request 2nd monitor" },
              ].map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold text-indigo-400">{r.n}</td>
                  <td className="px-3 py-2">
                    <StatusPill tone={r.p as "rose" | "amber" | "slate"}>{r.ps}</StatusPill>
                  </td>
                  <td className="px-3 py-2 text-slate-300 truncate">{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DexMock() {
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">DEX Auto-Remediation</h3>
          <p className="text-slate-400 text-xs flex items-center gap-2">
            Live endpoint telemetry
            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">Live agent data</span>
          </p>
        </div>
      </div>

      {/* AIOps predictive panel */}
      <div className="rounded-2xl p-4 bg-indigo-500/5 border border-indigo-500/30 mb-3 relative overflow-hidden">
        <BrainCircuit className="absolute -right-3 -top-3 w-24 h-24 text-indigo-400 opacity-10" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-extrabold text-white">Predictive Intelligence (AIOps)</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase animate-pulse">Scanning</span>
        </div>
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-white">Memory Leak: WS-8831</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Memory exhausts in <span className="text-amber-400 font-bold">~4.2h</span>. Recommend restart.</div>
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-start gap-2">
            <Cpu className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-white">Thermal Degradation: WS-2210</div>
              <div className="text-[10px] text-slate-400 mt-0.5"><span className="text-rose-400 font-bold">78% failure</span> probability in 30 days.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet rollup */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { v: "92", l: "Experience Score", c: "text-emerald-400" },
          { v: "1,043", l: "Devices", c: "text-white" },
          { v: "1,019", l: "Online", c: "text-emerald-400" },
          { v: "11", l: "At Risk", c: "text-amber-400" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 bg-slate-900/60 border border-white/10">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{s.l}</div>
            <div className={`text-2xl font-black tracking-tighter ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMock() {
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
          <BarChart3 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">Performance Analytics</h3>
          <p className="text-slate-400 text-xs">Operational metrics & SLA trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { v: "2h 14m", l: "Avg. MTTR", c: "text-emerald-400" },
          { v: "61%", l: "Ticket Deflection", c: "text-sky-400" },
          { v: "99.9%", l: "SLA Met", c: "text-violet-400" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 bg-slate-900/60 border border-white/10">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{s.l}</div>
            <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 bg-slate-900/60 border border-white/10">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Tickets by Category</div>
          <div className="flex items-end gap-2 h-24">
            {[
              { h: 90, c: "from-violet-600 to-fuchsia-400" },
              { h: 70, c: "from-indigo-600 to-sky-400" },
              { h: 55, c: "from-emerald-600 to-emerald-400" },
              { h: 40, c: "from-amber-600 to-amber-400" },
              { h: 30, c: "from-rose-600 to-rose-400" },
            ].map((b, i) => (
              <div key={i} className={`flex-1 rounded-t bg-gradient-to-t ${b.c}`} style={{ height: `${b.h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-3 bg-slate-900/60 border border-white/10">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Resolution Trend</div>
          <svg viewBox="0 0 200 90" className="w-full h-24">
            <defs>
              <linearGradient id="ln" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points="0,70 30,55 60,60 90,35 120,42 150,20 200,28"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
            />
            <polygon points="0,70 30,55 60,60 90,35 120,42 150,20 200,28 200,90 0,90" fill="url(#ln)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CatalogMock() {
  const items = [
    { icon: Laptop, name: "MacBook Pro 16″", cat: "Hardware", tone: "text-sky-400 bg-sky-500/15" },
    { icon: Monitor, name: "27″ 4K Monitor", cat: "Hardware", tone: "text-sky-400 bg-sky-500/15" },
    { icon: Smartphone, name: "iPhone 15 Pro", cat: "Mobile", tone: "text-cyan-400 bg-cyan-500/15" },
    { icon: Headphones, name: "ANC Headset", cat: "Peripherals", tone: "text-violet-400 bg-violet-500/15" },
    { icon: BookOpen, name: "Adobe Creative Cloud", cat: "Software", tone: "text-rose-400 bg-rose-500/15" },
    { icon: Code, name: "JetBrains Pack", cat: "Software", tone: "text-rose-400 bg-rose-500/15" },
    { icon: KeyRound, name: "VPN Access", cat: "Access", tone: "text-emerald-400 bg-emerald-500/15" },
    { icon: Network, name: "GitHub Enterprise", cat: "Access", tone: "text-emerald-400 bg-emerald-500/15" },
    { icon: Cloud, name: "AWS Console", cat: "Access", tone: "text-amber-400 bg-amber-500/15" },
  ];
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <Library className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">Service Catalog</h3>
            <p className="text-slate-400 text-xs">Request hardware, software, or access.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
          24 services available
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-2xl p-3 bg-slate-900/60 border border-white/10 hover:border-violet-500/30 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${it.tone}`}>
              <it.icon className="w-4 h-4" />
            </div>
            <div className="text-[12px] font-bold text-white mb-1 truncate">{it.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{it.cat}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS: Record<TabKey, { url: string; node: React.ReactNode }> = {
  command: { url: "leadaistudio.ai/dashboard", node: <CommandCenterMock /> },
  dex: { url: "leadaistudio.ai/dex", node: <DexMock /> },
  analytics: { url: "leadaistudio.ai/reports", node: <AnalyticsMock /> },
  catalog: { url: "leadaistudio.ai/catalog", node: <CatalogMock /> },
};

/* ------------------------------- Component ------------------------------- */

export default function ProductShowcase() {
  const [active, setActive] = useState<TabKey>("command");
  const screen = SCREENS[active];
  const meta = TABS.find((t) => t.key === active)!;

  return (
    <div className="w-full max-w-6xl px-6 mx-auto mb-32">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="max-w-3xl mb-10"
      >
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Take a look inside</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3 mb-4">
          A real, working platform — not a slide deck.
        </h2>
        <p className="text-base text-slate-600">
          Every screen below is live in the product today. Explore the consoles your team uses to run the entire IT helpdesk from one place.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Screenshot */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <BrowserFrame url={screen.url}>{screen.node}</BrowserFrame>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 mb-4">
                <meta.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{meta.label}</h3>
              <p className="text-slate-600 leading-relaxed mb-6">{meta.blurb}</p>
              <a
                href="/dashboard"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 group"
              >
                Open this in the live demo
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
