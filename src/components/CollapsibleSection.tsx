"use client";

import { useState, type ReactNode, type ComponentType } from "react";
import { ChevronDown } from "lucide-react";
import { cn, focusRing } from "@/components/ui";

// A thin, collapsible section header for secondary dashboard content. Collapsed,
// it's just a ~48px bar — so the important widgets stay in one view while
// everything else is one click away.
export default function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]",
          focusRing
        )}
      >
        <span className="flex items-center gap-3 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="text-sm font-semibold text-white truncate">{title}</span>
          {subtitle && <span className="text-xs text-slate-500 truncate hidden sm:inline">{subtitle}</span>}
          {badge}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}
