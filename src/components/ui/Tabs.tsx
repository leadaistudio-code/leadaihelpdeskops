"use client";

import { useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn, focusRing } from "./cn";

// Section switcher for dense operational surfaces.
//
// This exists so a console can carry real depth without making the operator
// scroll past twelve modules to reach the one they need. The tab strip is
// deliberately quiet — a bottom rule and a weight change, no pills, no tinted
// capsules — because it is navigation chrome, not a place to spend accent.
//
// Implements the WAI-ARIA tabs pattern properly rather than styling buttons to
// look like tabs: roving tabindex, arrow/Home/End keys, and the panel labelled
// by its tab. `aria-controls` points at the single rendered panel.

export type TabItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  // Small trailing count, e.g. the number of devices needing attention. Only
  // render one when the number changes what the operator does next.
  badge?: number;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusTab = (id: string) => {
    onChange(id);
    refs.current[id]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.id === value);
    if (i < 0) return;
    const last = items.length - 1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusTab(items[i === last ? 0 : i + 1].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusTab(items[i === 0 ? last : i - 1].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(items[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(items[last].id);
    }
  };

  return (
    // Scrolls horizontally on narrow viewports rather than wrapping into a
    // second row, which would shift the panel below it on every resize.
    <div className={cn("-mx-1 overflow-x-auto border-b border-white/10", className)}>
      <div role="tablist" aria-label="Dashboard sections" onKeyDown={onKeyDown} className="flex min-w-max gap-1 px-1">
        {items.map((t) => {
          const selected = t.id === value;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm transition-colors",
                // The selected tab is marked by weight, foreground, and a rule
                // that sits on the container border — not by a filled capsule.
                // `bg-blue-500` is the project's accent token: globals.css
                // remaps it to signal-mint on the dark app surface and leaves it
                // readable in light mode. Using a literal mint hex here would
                // break light mode and bypass that system.
                selected
                  ? "font-semibold text-white after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-blue-500 after:content-['']"
                  : "font-medium text-slate-400 hover:text-slate-200",
                focusRing
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    selected ? "bg-white/10 text-slate-200" : "bg-white/5 text-slate-400"
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The panel the tab strip controls. One panel is rendered at a time, so it
// carries a stable id and is relabelled by whichever tab is active.
export function TabPanel({
  id,
  tabsId,
  children,
  className,
}: {
  id: string;
  tabsId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      id={`${tabsId}-panel`}
      role="tabpanel"
      aria-labelledby={`${tabsId}-tab-${id}`}
      tabIndex={0}
      className={cn("pt-6", focusRing)}
    >
      <div className={className}>{children}</div>
    </div>
  );
}

// Small hook so a page can own the selected tab and the shared id together.
export function useTabs(initial: string) {
  const id = useId();
  const [value, setValue] = useState(initial);
  return { id, value, setValue };
}
