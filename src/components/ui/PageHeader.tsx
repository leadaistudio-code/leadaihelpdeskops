import { cn } from "./cn";

// The standard page masthead: title, optional supporting line, optional action
// slot on the right. Fixed rem scale (product register — no fluid clamp), tight
// display weight, prose-capped description. Every top-level surface opens with
// this so the app has one consistent entry rhythm.

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs font-semibold text-[#00926f] uppercase tracking-wider mb-2">{eyebrow}</div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="text-slate-400 mt-2 text-sm max-w-prose">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
