import { cn, focusRing } from "./cn";

// Form control vocabulary. One shape, one focus treatment for input / textarea /
// select so "the save form here looks different from the form there" never
// happens. Focus uses a mint border + ring; error swaps to rose. Labels are the
// quiet uppercase micro-label used across the app.

// Mintlify form control: white field, hairline border, 8px radius, mint-green
// focus. Authored in explicit light tokens so it reads correctly regardless of
// the theme-override layer.
const controlBase =
  "w-full rounded-lg bg-white border border-[#e5e5e5] text-[#0a0a0a] placeholder-[#a8a8aa] " +
  "px-3.5 py-2.5 text-sm transition-colors " +
  "focus:outline-none focus:border-[#00d4a4] focus:ring-2 focus:ring-[#00d4a4]/20 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const errorBase = "border-[#d45656] focus:border-[#d45656] focus:ring-[#d45656]/20";

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2", className)}
    >
      {children}
    </label>
  );
}

// Field: label + control + optional hint/error, consistently spaced.
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs text-rose-400 mt-1.5">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

export function Input({
  error,
  className,
  ...props
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, error && errorBase, className)} {...props} />;
}

export function Textarea({
  error,
  className,
  ...props
}: { error?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, "min-h-[96px] resize-y", error && errorBase, className)} {...props} />;
}

export function Select({
  error,
  className,
  children,
  ...props
}: { error?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlBase, "appearance-none pr-10 cursor-pointer", error && errorBase, className)} {...props}>
      {children}
    </select>
  );
}

export { focusRing };
