"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";

type Stage = "IN_PROGRESS" | "PAUSED" | "MET" | "BREACHED";

export default function SlaDisplay({
  dueAt,
  startAt,
  stage,
  name = "Resolution SLA",
  schedule = "ALWAYS",
}: {
  dueAt: string;
  startAt: string;
  stage: Stage;
  name?: string;
  schedule?: "ALWAYS" | "BUSINESS";
}) {
  const [now, setNow] = useState(() => Date.now());

  const due = new Date(dueAt).getTime();
  const start = new Date(startAt).getTime();
  const liveBreached = stage === "IN_PROGRESS" && now >= due;
  const effStage: Stage = liveBreached ? "BREACHED" : stage;
  const ticking = stage === "IN_PROGRESS" && !liveBreached;

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  const remaining = due - now;
  const percent =
    effStage === "MET"
      ? 100
      : Math.min(100, Math.max(0, ((now - start) / Math.max(1, due - start)) * 100));

  // Theme by stage
  const theme = {
    IN_PROGRESS: percent > 85
      ? { bar: "bg-amber-500", text: "text-amber-400", ring: "border-amber-500/20" }
      : { bar: "bg-emerald-500", text: "text-emerald-400", ring: "border-emerald-500/20" },
    PAUSED: { bar: "bg-amber-500/50", text: "text-amber-400", ring: "border-amber-500/20" },
    MET: { bar: "bg-emerald-500", text: "text-emerald-400", ring: "border-emerald-500/20" },
    BREACHED: { bar: "bg-rose-500", text: "text-rose-400", ring: "border-rose-500/30" },
  }[effStage];

  const Icon =
    effStage === "BREACHED" ? AlertTriangle : effStage === "MET" ? CheckCircle2 : effStage === "PAUSED" ? PauseCircle : Clock;

  const headline =
    effStage === "MET" ? "SLA Met" :
    effStage === "BREACHED" ? "SLA Breached" :
    effStage === "PAUSED" ? "Paused (on hold)" :
    formatRemaining(remaining);

  const dueLabel = new Date(due).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={`glass-panel p-6 rounded-2xl border ${theme.ring} flex flex-col justify-center`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center space-x-2 min-w-0">
          <Icon className={`w-5 h-5 shrink-0 ${theme.text}`} />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest truncate">{name}</h3>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 border border-white/10 rounded px-1.5 py-0.5 shrink-0">
          {schedule === "BUSINESS" ? "8×5" : "24×7"}
        </span>
      </div>

      <div className={`text-2xl font-black font-mono tabular-nums mb-3 ${theme.text}`}>{headline}</div>

      <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${theme.bar} transition-all duration-1000`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-500 font-medium">
        <span>{effStage === "MET" ? "Resolved within target" : effStage === "BREACHED" ? "Target missed" : "Target"}</span>
        <span className="font-mono">{dueLabel}</span>
      </div>
    </div>
  );
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`; // live seconds under an hour
}
