"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import { assignIncident } from "@/app/actions/incidentActions";
import { toast } from "@/components/toast";

type Agent = { id: string; name: string; role: string };

export default function AssignmentControl({
  incidentId,
  currentAssigneeId,
  agents,
}: {
  incidentId: string;
  currentAssigneeId: string | null;
  agents: Agent[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) => {
    startTransition(async () => {
      try {
        await assignIncident(incidentId, value || null);
        const name = agents.find((a) => a.id === value)?.name;
        toast(name ? `Assigned to ${name}` : "Unassigned");
        router.refresh();
      } catch {
        toast("Couldn't update assignment", "error");
      }
    });
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <UserCog className="w-3.5 h-3.5" /> Assigned To
      </label>
      <select
        defaultValue={currentAssigneeId ?? ""}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm transition-colors disabled:opacity-50"
      >
        <option value="">— Unassigned —</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.role === "ADMIN" ? "Admin" : "Agent"})
          </option>
        ))}
      </select>
    </div>
  );
}
