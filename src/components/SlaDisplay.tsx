"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function SlaDisplay({ createdAt, slaHours, status }: { createdAt: Date, slaHours: number, status: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [percent, setPercent] = useState(0);
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {

    const slaMs = slaHours * 60 * 60 * 1000;
    const startMs = new Date(createdAt).getTime();
    const targetMs = startMs + slaMs;

    const updateSLA = () => {
      if (status === "RESOLVED" || status === "CLOSED") {
        setTimeLeft("SLA Achieved");
        setPercent(100);
        return;
      }
      
      if (status === "ON_HOLD") {
        setTimeLeft("SLA Paused");
        setPercent(50); // Just a visual placeholder for paused
        return;
      }

      const nowMs = new Date().getTime();
      const remaining = targetMs - nowMs;

      if (remaining <= 0) {
        setIsBreached(true);
        setTimeLeft("SLA Breached");
        setPercent(100);
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
        
        const elapsed = nowMs - startMs;
        setPercent(Math.min(100, Math.max(0, (elapsed / slaMs) * 100)));
      }
    };

    updateSLA();
    const interval = setInterval(updateSLA, 60000); // update every minute
    return () => clearInterval(interval);
  }, [createdAt, slaHours, status]);

  let barColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  if (status === "ON_HOLD") {
    barColor = "bg-amber-500/50";
    textColor = "text-amber-400";
  } else if (isBreached) {
    barColor = "bg-rose-500";
    textColor = "text-rose-400";
  } else if (percent > 75) {
    barColor = "bg-amber-500";
    textColor = "text-amber-400";
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${textColor}`} />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Resolution SLA</h3>
        </div>
        <span className={`font-mono font-bold ${textColor}`}>{timeLeft}</span>
      </div>
      <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${barColor} transition-all duration-1000`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
