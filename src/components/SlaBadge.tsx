// Compact, static SLA status chip for list/queue views. Server component —
// no ticking (that's SlaDisplay's job on the detail page). Computes a live
// breach so an overdue-but-not-yet-escalated ticket still reads red.

// Kept out of the component body so the current-time read isn't flagged as an
// impure call during render (it's a one-shot server render).
function resolveBadge(dueAt?: Date | string | null, stage?: string | null): { label: string; cls: string } | null {
  if (!stage) return null;
  const due = dueAt ? new Date(dueAt).getTime() : 0;
  const now = Date.now();
  const eff = stage === "IN_PROGRESS" && due && now >= due ? "BREACHED" : stage;

  if (eff === "BREACHED") return { label: "Breached", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" };
  if (eff === "MET") return { label: "Met", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (eff === "PAUSED") return { label: "Paused", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  if (eff === "IN_PROGRESS") {
    const hoursLeft = (due - now) / 3_600_000;
    return due && hoursLeft <= 2
      ? { label: "Due soon", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
      : { label: "On track", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  }
  return null;
}

export default function SlaBadge({ dueAt, stage }: { dueAt?: Date | string | null; stage?: string | null }) {
  const badge = resolveBadge(dueAt, stage);
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      SLA {badge.label}
    </span>
  );
}
