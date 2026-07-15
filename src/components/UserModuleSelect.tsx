"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserModules } from "@/app/actions/userActions";
import { toast } from "@/components/toast";
import { cn, focusRing } from "@/components/ui";

const MODULES = [
  { id: "SELF_SERVICE", label: "Self-Service" },
  { id: "DEX", label: "DEX Monitoring" },
  { id: "SERVICE_DESK", label: "Service Desk" },
  { id: "ASSET_MANAGEMENT", label: "Asset Mgmt" },
];

export default function UserModuleSelect({
  userId,
  currentModules,
  disabled,
}: {
  userId: string;
  currentModules: string[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticModules, setOptimisticModules] = useState<string[]>(currentModules || []);

  const toggleModule = (modId: string) => {
    if (disabled || pending) return;
    
    const newModules = optimisticModules.includes(modId)
      ? optimisticModules.filter(m => m !== modId)
      : [...optimisticModules, modId];
      
    setOptimisticModules(newModules);
      
    startTransition(async () => {
      try {
        const res = await updateUserModules(userId, newModules);
        toast(res.clerkSynced ? "Modules updated in DB & Clerk" : "Modules updated in DB only", res.clerkSynced ? "success" : "error");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Couldn't update modules", "error");
        setOptimisticModules(currentModules); // revert
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
      {MODULES.map((m) => {
        const active = optimisticModules.includes(m.id);
        return (
          <button
            key={m.id}
            onClick={() => toggleModule(m.id)}
            disabled={disabled || pending}
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border transition-colors disabled:opacity-50",
              active
                ? "bg-white/[0.06] text-slate-100 border-white/20"
                : "bg-white/[0.02] text-slate-500 border-white/10 hover:text-slate-300 hover:border-white/20",
              focusRing
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
