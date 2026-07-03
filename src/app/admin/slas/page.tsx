export const dynamic = "force-dynamic";

import { getSlaDefinitions, toggleSlaStatus, deleteSlaDefinition, createSlaDefinition } from "@/app/actions/slaActions";
import { ShieldAlert, Settings, Plus, Trash2, Power } from "lucide-react";
import type { Priority, TicketType, SlaSchedule } from "@prisma/client";

export default async function AdminSlaPage() {
  const slas = await getSlaDefinitions();

  const handleToggle = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await toggleSlaStatus(id, !isActive);
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await deleteSlaDefinition(id);
  };

  const handleCreate = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const type = formData.get("type") as TicketType;
    const priority = formData.get("priority") as Priority;
    const durationHours = parseInt(formData.get("durationHours") as string);
    const schedule = (formData.get("schedule") as SlaSchedule) || "ALWAYS";
    await createSlaDefinition({ name, type, priority, durationHours, schedule });
  };

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SLA Management</h1>
          <p className="text-slate-400 mt-1">Configure service level agreements across incident and request queues.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 h-fit">
          <div className="flex items-center space-x-2 mb-6 border-b border-white/5 pb-4">
            <Plus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">New SLA Policy</h2>
          </div>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Policy Name</label>
              <input required name="name" type="text" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. Server Outage Resolution" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Ticket Type</label>
              <select name="type" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="INCIDENT">INCIDENT (IT Issues)</option>
                <option value="REQUEST">REQUEST (Service Catalog)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Target Priority</label>
              <select name="priority" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Resolution Time (Hours)</label>
              <input required name="durationHours" type="number" min="1" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. 4" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Business Calendar</label>
              <select name="schedule" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="ALWAYS">24×7 — calendar hours</option>
                <option value="BUSINESS">Business hours — Mon–Fri, 9–5</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 mt-4 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl transition-colors">
              Create Policy
            </button>
          </form>
        </div>

        {/* Existing SLAs Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Active Policies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Policy Name</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Priority</th>
                  <th className="px-6 py-4 font-bold">Target</th>
                  <th className="px-6 py-4 font-bold">Calendar</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {slas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No SLA policies defined.</td>
                  </tr>
                ) : (
                  slas.map((sla) => (
                    <tr key={sla.id} className={`hover:bg-white/5 transition-colors ${!sla.isActive && 'opacity-50 grayscale'}`}>
                      <td className="px-6 py-4 font-bold text-slate-200">{sla.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-sky-400">{sla.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                          sla.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          sla.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {sla.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-indigo-300">{sla.durationHours} hrs</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-slate-400 border border-white/10 rounded px-2 py-1">
                          {sla.schedule === "BUSINESS" ? "8×5" : "24×7"}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end space-x-2">
                        <form action={handleToggle}>
                          <input type="hidden" name="id" value={sla.id} />
                          <input type="hidden" name="isActive" value={sla.isActive ? "true" : "false"} />
                          <button type="submit" className={`p-2 rounded-lg border transition-colors ${sla.isActive ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`} title={sla.isActive ? "Disable SLA" : "Enable SLA"}>
                            <Power className="w-4 h-4" />
                          </button>
                        </form>
                        <form action={handleDelete}>
                          <input type="hidden" name="id" value={sla.id} />
                          <button type="submit" className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors" title="Delete SLA">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
