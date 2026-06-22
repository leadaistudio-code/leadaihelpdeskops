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
  accent = "text-indigo-400",
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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> {ctaLabel}
        </Link>
      )}
    </div>
  );
}
