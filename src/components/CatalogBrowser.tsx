"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CatalogIcon from "@/components/CatalogIcon";
import {
  Search,
  Laptop,
  Mouse,
  Smartphone,
  Code2,
  KeyRound,
  Sparkles,
  LayoutGrid,
  List,
  ArrowRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type CatalogBrowserItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  price: number | null;
  requiresApproval: boolean;
};

// Preferred category order + per-category accent and section icon. Accents are
// literal hex (not Tailwind utilities) so the dark-surface accent remap leaves
// them alone and each category stays visually distinct.
const ORDER = ["Hardware", "Peripherals", "Mobile", "Software", "Access", "Services"];
const META: Record<string, { accent: string; icon: LucideIcon }> = {
  Hardware: { accent: "#38E8B0", icon: Laptop },
  Peripherals: { accent: "#7C9CFF", icon: Mouse },
  Mobile: { accent: "#C79CFF", icon: Smartphone },
  Software: { accent: "#5AD1E8", icon: Code2 },
  Access: { accent: "#F5B14C", icon: KeyRound },
  Services: { accent: "#FF9DB0", icon: Sparkles },
};
const FALLBACK = { accent: "#8D98AC", icon: LayoutGrid };

export default function CatalogBrowser({ items }: { items: CatalogBrowserItem[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("ALL");
  const [view, setView] = useState<"list" | "grid">("list");

  const categories = useMemo(() => {
    const set = Array.from(new Set(items.map((i) => i.category)));
    set.sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
    return set;
  }, [items]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of items) m[i.category] = (m[i.category] || 0) + 1;
    return m;
  }, [items]);

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const g: Record<string, CatalogBrowserItem[]> = {};
    for (const i of items) {
      if (cat !== "ALL" && i.category !== cat) continue;
      if (term && !(
        i.name.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term)
      )) continue;
      (g[i.category] ||= []).push(i);
    }
    return categories.filter((c) => g[c]?.length).map((c) => [c, g[c]] as const);
  }, [items, q, cat, categories]);

  const totalShown = grouped.reduce((n, [, list]) => n + list.length, 0);

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-colors whitespace-nowrap ${
      active ? "text-[#03130d] border-transparent" : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
    }`;

  return (
    <div>
      {/* Toolbar: search + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the catalog…"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all placeholder-slate-500"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-white/10 rounded-xl self-start">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              className={`p-2 rounded-lg transition-colors ${view === v ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {v === "list" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCat("ALL")}
          className={chip(cat === "ALL")}
          style={cat === "ALL" ? { backgroundColor: "#38E8B0" } : undefined}
        >
          All <span className="opacity-70">· {items.length}</span>
        </button>
        {categories.map((c) => {
          const accent = (META[c] ?? FALLBACK).accent;
          const active = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} className={chip(active)} style={active ? { backgroundColor: accent } : undefined}>
              {c} <span className="opacity-70">· {counts[c]}</span>
            </button>
          );
        })}
      </div>

      {totalShown === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10 p-16 text-center">
          <LayoutGrid className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No items match “{q}”.</p>
          <button onClick={() => { setQ(""); setCat("ALL"); }} className="mt-4 text-sm font-bold text-emerald-400 hover:text-emerald-300">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([c, list]) => {
            const { accent, icon: SectionIcon } = META[c] ?? FALLBACK;
            return (
              <section key={c}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + "22", color: accent }}>
                    <SectionIcon className="w-[18px] h-[18px]" />
                  </div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">{c}</h2>
                  <span className="text-xs font-mono text-slate-500">{list.length}</span>
                </div>

                {view === "list" ? (
                  <div className="glass-panel rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                    {list.map((item) => (
                      <Link
                        key={item.id}
                        href={`/catalog/${item.id}`}
                        className="group flex items-center gap-4 px-4 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: accent + "1f", color: accent }}>
                          <CatalogIcon icon={item.icon} className="w-[18px] h-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                            {item.requiresApproval && (
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-label="Requires approval" />
                            )}
                          </div>
                          <p className="text-slate-500 text-xs truncate">{item.description}</p>
                        </div>
                        <span className="text-xs font-bold shrink-0 hidden sm:block" style={{ color: accent }}>
                          {item.price != null ? `$${item.price}` : "Request"}
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: accent }} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {list.map((item) => (
                      <Link
                        key={item.id}
                        href={`/catalog/${item.id}`}
                        className="group glass-panel rounded-xl p-4 border border-white/5 hover:border-white/15 hover:-translate-y-0.5 transition-all flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: accent + "1f", color: accent }}>
                            <CatalogIcon icon={item.icon} className="w-[18px] h-[18px]" />
                          </div>
                          {item.requiresApproval && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mt-1" aria-label="Requires approval" />}
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 leading-snug">{item.name}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 flex-1">{item.description}</p>
                        <span className="mt-3 text-xs font-bold" style={{ color: accent }}>
                          {item.price != null ? `$${item.price}` : "Request →"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
