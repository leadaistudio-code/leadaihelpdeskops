import { cn } from "./cn";

// Table primitives for the app's many queues. Standardizes the header row
// (quiet uppercase micro-labels on a faint ground), hairline row dividers, and
// the row hover the incident queues all hand-rolled. Wrap in a Panel for the
// bordered container; DataTable adds the horizontal-scroll shell.

export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm text-left text-slate-300", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">{children}</thead>;
}

export function TH({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-6 py-3 font-semibold",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function TR({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-white/[0.03] transition-colors group", className)} {...rest}>
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  align = "left",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-6 py-4",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}
