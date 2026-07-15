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
    <div className="relative rounded-xl overflow-hidden border border-[#e5e5e5] bg-white shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)]">
      <div className="h-10 bg-[#f7f7f7] flex items-center px-4 border-b border-[#e5e5e5]">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#d9d9d9]" />
          <div className="w-3 h-3 rounded-full bg-[#d9d9d9]" />
          <div className="w-3 h-3 rounded-full bg-[#d9d9d9]" />
        </div>
        <div className="mx-auto px-6 py-1 bg-white border border-[#e5e5e5] rounded text-[11px] text-[#6b6b6d] font-medium w-72 text-center truncate">
          {url}
        </div>
      </div>
      {/* App canvas — light Mintlify surface */}
      <div className="relative bg-[#fafafa] h-[440px] overflow-hidden">
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
    <div className="hidden sm:flex flex-col items-center w-14 shrink-0 border-r border-[#e5e5e5] bg-white py-4 gap-4">
      <div className="w-7 h-7 rounded-md bg-[#0a0a0a] flex items-center justify-center mb-2">
        <Zap className="w-4 h-4 text-white" />
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            it.active
              ? "bg-[#00d4a4]/12 border border-[#00d4a4]/40 text-[#00926f]"
              : "text-[#a8a8aa]"
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
    sky: "bg-[#3772cf]/10 text-[#3772cf] border-[#3772cf]/20",
    amber: "bg-[#c37d0d]/10 text-[#c37d0d] border-[#c37d0d]/20",
    rose: "bg-[#d45656]/10 text-[#d45656] border-[#d45656]/20",
    emerald: "bg-[#00d4a4]/12 text-[#00926f] border-[#00d4a4]/25",
    slate: "bg-[#f7f7f7] text-[#5a5a5c] border-[#e5e5e5]",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[tone]}`}>{children}</span>;
}

/* ------------------------------ Mock screens ----------------------------- */

function CommandCenterMock() {
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-[#0a0a0a] tracking-tight">Command Center</h3>
          <p className="text-[#6b6b6d] text-xs">Global overview of IT operations.</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#0a0a0a] text-white text-[11px] font-bold">
          + Create Incident
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { icon: Ticket, val: "128", label: "Open Incidents", color: "text-[#0a0a0a]", ring: "bg-[#00d4a4]/12 text-[#00926f]" },
          { icon: ShieldAlert, val: "6", label: "Critical Priority", color: "text-[#d45656]", ring: "bg-[#d45656]/12 text-[#d45656]" },
          { icon: Activity, val: "14", label: "Assigned to Me", color: "text-[#00926f]", ring: "bg-[#00d4a4]/12 text-[#00926f]" },
          { icon: Zap, val: "99.9%", label: "SLA Compliance", color: "text-[#3772cf]", ring: "bg-[#3772cf]/12 text-[#3772cf]" },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 bg-white border border-[#e5e5e5]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-3 ${c.ring}`}>
              <c.icon className="w-3.5 h-3.5" />
            </div>
            <div className={`text-2xl font-black mb-0.5 ${c.color}`}>{c.val}</div>
            <div className="text-[9px] font-bold text-[#6b6b6d] uppercase tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Chart */}
        <div className="col-span-1 rounded-xl p-3 bg-white border border-[#e5e5e5]">
          <div className="text-[9px] font-bold text-[#6b6b6d] uppercase tracking-wider mb-3">Incident Volume (7d)</div>
          <div className="flex items-end gap-1.5 h-20">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#00d4a4]" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="col-span-2 rounded-xl bg-white border border-[#e5e5e5] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#e5e5e5] bg-[#f7f7f7] text-[9px] font-black text-[#5a5a5c] uppercase tracking-wider">
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
                <tr key={i} className="border-b border-[#ededed]">
                  <td className="px-3 py-2 font-bold text-[#00926f]">{r.n}</td>
                  <td className="px-3 py-2">
                    <StatusPill tone={r.p as "rose" | "amber" | "slate"}>{r.ps}</StatusPill>
                  </td>
                  <td className="px-3 py-2 text-[#3a3a3c] truncate">{r.d}</td>
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
        <div className="w-9 h-9 rounded-xl bg-[#00d4a4]/12 flex items-center justify-center border border-[#00d4a4]/30">
          <Activity className="w-5 h-5 text-[#00926f]" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-[#0a0a0a] tracking-tight">DEX Auto-Remediation</h3>
          <p className="text-[#6b6b6d] text-xs flex items-center gap-2">
            Live endpoint telemetry
            <span className="px-1.5 py-0.5 bg-[#00d4a4]/12 text-[#00926f] border border-[#00d4a4]/25 rounded text-[9px] font-bold uppercase">Live agent data</span>
          </p>
        </div>
      </div>

      {/* AIOps predictive panel */}
      <div className="rounded-xl p-4 bg-[#f7f7f7] border border-[#e5e5e5] mb-3 relative overflow-hidden">
        <BrainCircuit className="absolute -right-3 -top-3 w-24 h-24 text-[#0a0a0a] opacity-[0.04]" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <BrainCircuit className="w-4 h-4 text-[#00926f]" />
          <span className="text-sm font-extrabold text-[#0a0a0a]">Predictive Intelligence (AIOps)</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00d4a4]/12 text-[#00926f] border border-[#00d4a4]/25 uppercase">Scanning</span>
        </div>
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#c37d0d] mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#0a0a0a]">Memory Leak: WS-8831</div>
              <div className="text-[10px] text-[#6b6b6d] mt-0.5">Memory exhausts in <span className="text-[#c37d0d] font-bold">~4.2h</span>. Recommend restart.</div>
            </div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 flex items-start gap-2">
            <Cpu className="w-4 h-4 text-[#d45656] mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-[#0a0a0a]">Thermal Degradation: WS-2210</div>
              <div className="text-[10px] text-[#6b6b6d] mt-0.5"><span className="text-[#d45656] font-bold">78% failure</span> probability in 30 days.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet rollup */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { v: "92", l: "Experience Score", c: "text-[#00926f]" },
          { v: "1,043", l: "Devices", c: "text-[#0a0a0a]" },
          { v: "1,019", l: "Online", c: "text-[#00926f]" },
          { v: "11", l: "At Risk", c: "text-[#c37d0d]" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 bg-white border border-[#e5e5e5]">
            <div className="text-[9px] font-black text-[#6b6b6d] uppercase tracking-wider mb-1">{s.l}</div>
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
        <div className="w-9 h-9 rounded-xl bg-[#3772cf]/12 flex items-center justify-center border border-[#3772cf]/30">
          <BarChart3 className="w-5 h-5 text-[#3772cf]" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-[#0a0a0a] tracking-tight">Performance Analytics</h3>
          <p className="text-[#6b6b6d] text-xs">Operational metrics & SLA trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { v: "2h 14m", l: "Avg. MTTR", c: "text-[#00926f]" },
          { v: "61%", l: "Ticket Deflection", c: "text-[#3772cf]" },
          { v: "99.9%", l: "SLA Met", c: "text-[#0a0a0a]" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 bg-white border border-[#e5e5e5]">
            <div className="text-[9px] font-black text-[#6b6b6d] uppercase tracking-wider mb-1">{s.l}</div>
            <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white border border-[#e5e5e5]">
          <div className="text-[9px] font-bold text-[#6b6b6d] uppercase tracking-wider mb-3">Tickets by Category</div>
          <div className="flex items-end gap-2 h-24">
            {[
              { h: 90, c: "bg-[#00d4a4]" },
              { h: 70, c: "bg-[#00b48a]" },
              { h: 55, c: "bg-[#3772cf]" },
              { h: 40, c: "bg-[#c37d0d]" },
              { h: 30, c: "bg-[#d45656]" },
            ].map((b, i) => (
              <div key={i} className={`flex-1 rounded-t ${b.c}`} style={{ height: `${b.h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3 bg-white border border-[#e5e5e5]">
          <div className="text-[9px] font-bold text-[#6b6b6d] uppercase tracking-wider mb-3">Resolution Trend</div>
          <svg viewBox="0 0 200 90" className="w-full h-24">
            <defs>
              <linearGradient id="ln" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4a4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00d4a4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points="0,70 30,55 60,60 90,35 120,42 150,20 200,28"
              fill="none"
              stroke="#00926f"
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
    { icon: Laptop, name: "MacBook Pro 16″", cat: "Hardware", tone: "text-[#3772cf] bg-[#3772cf]/12" },
    { icon: Monitor, name: "27″ 4K Monitor", cat: "Hardware", tone: "text-[#3772cf] bg-[#3772cf]/12" },
    { icon: Smartphone, name: "iPhone 15 Pro", cat: "Mobile", tone: "text-[#00926f] bg-[#00d4a4]/12" },
    { icon: Headphones, name: "ANC Headset", cat: "Peripherals", tone: "text-[#5a5a5c] bg-[#f0f0f0]" },
    { icon: BookOpen, name: "Adobe Creative Cloud", cat: "Software", tone: "text-[#d45656] bg-[#d45656]/12" },
    { icon: Code, name: "JetBrains Pack", cat: "Software", tone: "text-[#d45656] bg-[#d45656]/12" },
    { icon: KeyRound, name: "VPN Access", cat: "Access", tone: "text-[#00926f] bg-[#00d4a4]/12" },
    { icon: Network, name: "GitHub Enterprise", cat: "Access", tone: "text-[#00926f] bg-[#00d4a4]/12" },
    { icon: Cloud, name: "AWS Console", cat: "Access", tone: "text-[#c37d0d] bg-[#c37d0d]/12" },
  ];
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00d4a4]/12 flex items-center justify-center border border-[#00d4a4]/30">
            <Library className="w-5 h-5 text-[#00926f]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0a0a0a] tracking-tight">Service Catalog</h3>
            <p className="text-[#6b6b6d] text-xs">Request hardware, software, or access.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00d4a4]/12 text-[#00926f] border border-[#00d4a4]/25">
          24 services available
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl p-3 bg-white border border-[#e5e5e5] hover:border-[#00d4a4]/40 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${it.tone}`}>
              <it.icon className="w-4 h-4" />
            </div>
            <div className="text-[12px] font-bold text-[#0a0a0a] mb-1 truncate">{it.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#6b6b6d] uppercase tracking-wider">{it.cat}</span>
              <ArrowRight className="w-3 h-3 text-[#a8a8aa]" />
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
        <span className="text-xs font-semibold text-[#00926f] uppercase tracking-widest">Take a look inside</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a0a0a] mt-3 mb-4 tracking-tight">
          A real, working platform — not a slide deck.
        </h2>
        <p className="text-base text-[#3a3a3c]">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                  : "bg-white text-[#3a3a3c] border-[#e5e5e5] hover:border-[#00d4a4]/50 hover:text-[#0a0a0a]"
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00d4a4]/12 border border-[#00d4a4]/25 mb-4">
                <meta.icon className="w-6 h-6 text-[#00926f]" />
              </div>
              <h3 className="text-xl font-bold text-[#0a0a0a] mb-3 tracking-tight">{meta.label}</h3>
              <p className="text-[#3a3a3c] leading-relaxed mb-6">{meta.blurb}</p>
              <a
                href="/dashboard"
                className="inline-flex items-center text-sm font-semibold text-[#00926f] hover:text-[#00b48a] group"
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
