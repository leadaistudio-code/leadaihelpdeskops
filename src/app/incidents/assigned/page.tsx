export const dynamic = "force-dynamic";

import Link from "next/link";
import { getIncidents } from "@/app/actions/incidentActions";
import { getSessionUser } from "@/lib/auth-utils";
import { Ticket, Plus, Filter } from "lucide-react";

export default async function AssignedIncidentsPage() {
  const user = await getSessionUser();
  
  // Fetch all incidents and filter by assignee (or we could update incidentActions to accept assigneeId)
  const allIncidents = await getIncidents();
  const incidents = allIncidents.filter(i => i.assigneeId === user?.id);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-4 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Assigned to Me</h1>
            <p className="text-slate-400 mt-1">Tickets currently in your queue</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href="/incidents/new" className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all font-bold">
            <Plus className="w-4 h-4" />
            <span>New Incident</span>
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">My WorkQueue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4 font-bold">Number</th>
                <th className="px-8 py-4 font-bold">Opened</th>
                <th className="px-8 py-4 font-bold">Short description</th>
                <th className="px-8 py-4 font-bold">Caller</th>
                <th className="px-8 py-4 font-bold">Priority</th>
                <th className="px-8 py-4 font-bold">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-500 italic">
                    No assigned tickets. You're caught up!
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <Link href={`/incidents/${inc.id}`} className="font-bold text-indigo-400 group-hover:text-indigo-300">
                        {inc.number}
                      </Link>
                    </td>
                    <td className="px-8 py-5 text-slate-400">{inc.createdAt.toLocaleString()}</td>
                    <td className="px-8 py-5 font-medium text-slate-200">{inc.title}</td>
                    <td className="px-8 py-5 text-sky-400 font-medium">{inc.caller?.name || "Unknown"}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        inc.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        inc.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {inc.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        inc.status === 'NEW' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                        inc.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
