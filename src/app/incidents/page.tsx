export const dynamic = "force-dynamic";

import Link from "next/link";
import { getIncidentsPaged } from "@/app/actions/incidentActions";
import { getGroupOptions } from "@/app/actions/groupActions";
import { getSessionUser } from "@/lib/auth-utils";
import { Ticket, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SlaBadge from "@/components/SlaBadge";
import { IncidentStatus, Priority } from "@prisma/client";

const STATUSES: (IncidentStatus | "ALL")[] = ["ALL", "NEW", "IN_PROGRESS", "ON_HOLD", "PENDING_APPROVAL", "RESOLVED", "CLOSED"];
const PRIORITIES: (Priority | "ALL")[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; group?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const isEmployee = user?.role === "EMPLOYEE";

  const q = sp.q ?? "";
  const status = (sp.status as IncidentStatus | "ALL") || "ALL";
  const priority = (sp.priority as Priority | "ALL") || "ALL";
  const group = sp.group ?? "ALL";
  const page = Number(sp.page) || 1;

  const [{ items, total, totalPages }, groups] = await Promise.all([
    getIncidentsPaged({
      callerId: isEmployee ? user?.id : undefined,
      search: q,
      status,
      priority,
      groupId: group,
      page,
    }),
    isEmployee ? Promise.resolve([]) : getGroupOptions(),
  ]);

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);
    if (priority !== "ALL") params.set("priority", priority);
    if (group !== "ALL") params.set("group", group);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === "" || v === "ALL") params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return `/incidents${s ? `?${s}` : ""}`;
  };

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Incidents</h1>
            <p className="text-slate-400 mt-1">{isEmployee ? "Your active support requests" : `${total} tickets in the system`}</p>
          </div>
        </div>
        <Link href="/incidents/new" className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all font-bold">
          <Plus className="w-4 h-4" />
          <span>New Incident</span>
        </Link>
      </div>

      {/* Filter bar */}
      <form action="/incidents" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by number or title…"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder-slate-500 text-sm"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="px-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All statuses" : s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={priority}
          className="px-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === "ALL" ? "All priorities" : p}</option>
          ))}
        </select>
        {!isEmployee && groups.length > 0 && (
          <select
            name="group"
            defaultValue={group}
            className="px-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
          >
            <option value="ALL">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors">
          Filter
        </button>
      </form>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Ticket}
                      title={q || status !== "ALL" ? "No matching incidents" : isEmployee ? "No open tickets" : "No incidents yet"}
                      description={q || status !== "ALL" ? "Try adjusting your search or filters." : "New incidents will appear here as they're raised."}
                      ctaHref="/incidents/new"
                      ctaLabel="New Incident"
                    />
                  </td>
                </tr>
              ) : (
                items.map((inc) => (
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
                        {inc.status.replace("_", " ")}
                      </span>
                      {inc.slaInstances[0] && (
                        <div className="mt-1.5">
                          <SlaBadge dueAt={inc.slaInstances[0].dueAt} stage={inc.slaInstances[0].stage} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <Link
              href={buildHref({ page: Math.max(1, page - 1) })}
              aria-disabled={page <= 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${page <= 1 ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5"}`}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <Link
              href={buildHref({ page: Math.min(totalPages, page + 1) })}
              aria-disabled={page >= totalPages}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${page >= totalPages ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5"}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
