import { cn } from "./cn";

// The single surface primitive. Replaces the legacy `glass-panel` (blur + mint
// border + heavy shadow) with a calm bordered plane: hairline border, near-flat
// fill, no decorative blur. `interactive` adds the hover lift-of-tone used on
// clickable cards. This is the enterprise-calm ground for the whole app.

export function Panel({
  as: Tag = "div",
  interactive = false,
  padded = false,
  className,
  children,
  ...rest
}: {
  as?: React.ElementType;
  interactive?: boolean;
  padded?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.02]",
        interactive && "transition-colors hover:bg-white/[0.04] hover:border-white/15",
        padded && "p-6",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Section header inside a Panel: a quiet uppercase label with an optional icon
// and a trailing slot (count chip, action). Standardizes the "card header" that
// was hand-rolled on every surface.
export function PanelHeader({
  title,
  icon: Icon,
  action,
  className,
}: {
  title: React.ReactNode;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4", className)}>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />}
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  );
}
