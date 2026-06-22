"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Network } from "lucide-react";
import { assignIncidentGroup } from "@/app/actions/groupActions";
import { toast } from "@/components/toast";

type Group = { id: string; name: string };

export default function GroupControl({
  incidentId,
  currentGroupId,
  groups,
}: {
  incidentId: string;
  currentGroupId: string | null;
  groups: Group[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) =>
    startTransition(async () => {
      try {
        await assignIncidentGroup(incidentId, value || null);
        const name = groups.find((g) => g.id === value)?.name;
        toast(name ? `Routed to ${name}` : "Removed from group");
        router.refresh();
      } catch {
        toast("Couldn't route incident", "error");
      }
    });

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <Network className="w-3.5 h-3.5" /> Assignment Group
      </label>
      <select
        defaultValue={currentGroupId ?? ""}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm transition-colors disabled:opacity-50"
      >
        <option value="">— Unassigned —</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  );
}
