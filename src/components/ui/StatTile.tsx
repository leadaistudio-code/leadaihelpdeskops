import Link from "next/link";
import { cn, focusRing } from "./cn";
import type { LucideIcon } from "lucide-react";

// The metric tile. Big tabular number, quiet label, restrained icon chip. No
// gradient text, no glow — the deliberate replacement for the "hero-metric"
// SaaS cliché the DESIGN.md bans. `tone` tints only the number + chip when a
// figure genuinely carries alarm (critical count), otherwise stays neutral.

export type StatTone = "neutral" | "critical" | "warning" | "success";

const numberTone: Record<StatTone, string> = {
  neutral: "text-white", // -> #0a0a0a ink via the light theme override
  critical: "text-[#d45656]",
  warning: "text-[#c37d0d]",
  success: "text-[#00926f]",
};

const chipTone: Record<StatTone, string> = {
  neutral: "bg-white/5 text-slate-400",
  critical: "bg-[#d45656]/10 text-[#d45656]",
  warning: "bg-[#c37d0d]/10 text-[#c37d0d]",
  success: "bg-[#00b48a]/12 text-[#00926f]",
};

const borderTone: Record<StatTone, string> = {
  neutral: "border-white/10",
  critical: "border-[#d45656]/25",
  warning: "border-[#c37d0d]/25",
  success: "border-[#00b48a]/25",
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  href?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white/[0.02] p-5 flex flex-col justify-between gap-3",
        borderTone[tone],
        href && "transition-colors hover:bg-white/[0.04]",
        className
      )}
    >
      {href && <Link href={href} aria-label={label} className={cn("absolute inset-0 z-20 rounded-2xl", focusRing)} />}
      {Icon && (
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", chipTone[tone])}>
          <Icon className="w-4 h-4" aria-hidden />
        </div>
      )}
      <div className="relative z-10">
        <div className={cn("text-3xl font-semibold tabular-nums mb-0.5", numberTone[tone])}>{value}</div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
    </div>
  );
}
