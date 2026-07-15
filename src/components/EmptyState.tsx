import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";

// Reusable, on-brand empty state for the dark app surfaces. Use inside a card
// or table-cell wrapper. Pass an icon plus optional call-to-action.
export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
  accent = "text-[#00926f]",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <Icon className={`w-8 h-8 ${accent}`} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] hover:bg-[#1c1c1e] !text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
        >
          <Plus className="w-4 h-4" /> {ctaLabel}
        </Link>
      )}
    </div>
  );
}
