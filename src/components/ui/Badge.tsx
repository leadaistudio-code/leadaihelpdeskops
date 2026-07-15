import { cn } from "./cn";

// One badge, a fixed set of semantic tones. The tones map to the DESIGN.md
// Semantic Integrity Rule: rose = critical/breached, amber = warning/due-soon,
// emerald = success/on-track. Neutral for everything without status meaning.
// Signal-mint is intentionally NOT a badge tone — mint is for actions, not chips.

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "critical";

// Mintlify semantic colors, tuned to read on a white canvas: a soft tint fill
// with the deeper hue as text. Neutral is the surface-gray chip.
const tones: Record<BadgeTone, string> = {
  neutral: "bg-[#f7f7f7] text-[#5a5a5c] border-[#e5e5e5]",
  info: "bg-[#3772cf]/10 text-[#3772cf] border-[#3772cf]/20",
  success: "bg-[#00b48a]/12 text-[#00926f] border-[#00b48a]/25",
  warning: "bg-[#c37d0d]/10 text-[#c37d0d] border-[#c37d0d]/20",
  critical: "bg-[#d45656]/10 text-[#d45656] border-[#d45656]/20",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}

// Shared mappings so every queue/table labels status & priority identically.
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "NEW":
    case "OPEN":
      return "info";
    case "IN_PROGRESS":
    case "PENDING":
    case "ON_HOLD":
      return "warning";
    case "RESOLVED":
    case "CLOSED":
    case "DONE":
      return "success";
    default:
      return "neutral";
  }
}

export function priorityTone(priority: string): BadgeTone {
  switch (priority) {
    case "CRITICAL":
    case "P1":
      return "critical";
    case "HIGH":
    case "P2":
      return "warning";
    case "MEDIUM":
    case "P3":
      return "info";
    default:
      return "neutral";
  }
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ");
}
