"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Network, Plus, Trash2, Users, Check } from "lucide-react";
import { createGroup, deleteGroup, setGroupMembers } from "@/app/actions/groupActions";
import { toast } from "@/components/toast";

type Agent = { id: string; name: string; role: string };
type Group = { id: string; name: string; members: Agent[]; openCount: number };

export default function GroupsManager({ groups, agents }: { groups: Group[]; agents: Agent[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () =>
    startTransition(async () => {
      if (!name.trim()) return;
      try {
        await createGroup(name);
        setName("");
        toast("Group created");
        router.refresh();
      } catch {
        toast("Couldn't create group", "error");
      }
    });

  const remove = (id: string) =>
    startTransition(async () => {
      try {
        await deleteGroup(id);
        toast("Group deleted");
        router.refresh();
      } catch {
        toast("Couldn't delete group", "error");
      }
    });

  const toggleMember = (group: Group, agentId: string) =>
    startTransition(async () => {
      const has = group.members.some((m) => m.id === agentId);
      const next = has ? group.members.filter((m) => m.id !== agentId).map((m) => m.id) : [...group.members.map((m) => m.id), agentId];
      try {
        await setGroupMembers(group.id, next);
        router.refresh();
      } catch {
        toast("Couldn't update members", "error");
      }
    });

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="glass-panel border border-white/10 rounded-2xl p-5 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New group name (e.g., Network Support)"
          className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button onClick={add} disabled={pending || !name.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel border border-white/10 rounded-2xl p-12 text-center">
          <Network className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No groups yet. Create one above — the AI will auto-route tickets to groups whose names it recognizes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="glass-panel border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center"><Network className="w-4 h-4" /></div>
                  <div>
                    <h3 className="font-bold text-white">{g.name}</h3>
                    <p className="text-xs text-slate-500">{g.members.length} members · {g.openCount} tickets</p>
                  </div>
                </div>
                <button onClick={() => remove(g.id)} disabled={pending} className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {g.members.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No members assigned</span>
                ) : g.members.map((m) => (
                  <span key={m.id} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-slate-300">{m.name}</span>
                ))}
              </div>

              <button onClick={() => setEditing(editing === g.id ? null : g.id)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {editing === g.id ? "Done" : "Manage members"}
              </button>

              {editing === g.id && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  {agents.map((a) => {
                    const has = g.members.some((m) => m.id === a.id);
                    return (
                      <button key={a.id} onClick={() => toggleMember(g, a.id)} disabled={pending} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${has ? "bg-indigo-500/10 text-indigo-300" : "text-slate-400 hover:bg-white/5"}`}>
                        <span>{a.name} <span className="text-xs text-slate-600">({a.role === "ADMIN" ? "Admin" : "Agent"})</span></span>
                        {has && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
