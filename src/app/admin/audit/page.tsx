export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuditEntries, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth-utils";
import { ScrollText, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_STYLE: Record<string, string> = {
  CREATE: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  UPDATE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  STATE_CHANGE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  ASSIGN: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  APPROVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  LINK: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  UNLINK: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  REMEDIATION: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  SLA_BREACH: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  ROLE_CHANGE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function entityHref(entityType: string, entityId: string | null) {
  if (!entityId) return null;
  if (entityType === "Incident") return `/incidents/${entityId}`;
  if (entityType === "Problem") return `/problems/${entityId}`;
  return null;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string; action?: string; page?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const q = sp.q ?? "";
  const entity = sp.entity ?? "ALL";
  const action = sp.action ?? "ALL";
  const page = Number(sp.page) || 1;

  const { items, total, totalPages } = await getAuditEntries({
    domain: await getActiveDomain(),
    entityType: entity,
    action,
    search: q,
    page,
  });

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (entity !== "ALL") params.set("entity", entity);
    if (action !== "ALL") params.set("action", action);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === "" || v === "ALL") params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return `/admin/audit${s ? `?${s}` : ""}`;
  };

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <ScrollText className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Audit Log</h1>
          <p className="text-slate-400 mt-1">Immutable record of every change — {total} events</p>
        </div>
      </div>

      {/* Filters */}
      <form action="/admin/audit" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search actor, entity, or summary…"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm placeholder-slate-500"
          />
        </div>
        <select name="entity" defaultValue={entity} className="px-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500">
          <option value="ALL">All entities</option>
          {AUDIT_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select name="action" defaultValue={action} className="px-4 py-2.5 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500">
          <option value="ALL">All actions</option>
          {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors">Filter</button>
      </form>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">When</th>
                <th className="px-6 py-4 font-bold">Actor</th>
                <th className="px-6 py-4 font-bold">Action</th>
                <th className="px-6 py-4 font-bold">Entity</th>
                <th className="px-6 py-4 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No audit events match these filters.</td>
                </tr>
              ) : (
                items.map((e) => {
                  const href = entityHref(e.entityType, e.entityId);
                  return (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors align-top">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">{e.createdAt.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{e.actorName ?? "System"}</div>
                        {e.actorEmail && <div className="text-xs text-slate-500">{e.actorEmail}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${ACTION_STYLE[e.action] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                          {e.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-500">{e.entityType}</span>{" "}
                        {e.entityLabel && (
                          href ? (
                            <Link href={href} className="font-bold text-indigo-400 hover:text-indigo-300">{e.entityLabel}</Link>
                          ) : (
                            <span className="font-bold text-slate-300">{e.entityLabel}</span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{e.summary}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} events</p>
          <div className="flex gap-2">
            <Link href={buildHref({ page: Math.max(1, page - 1) })} aria-disabled={page <= 1} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${page <= 1 ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5"}`}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <Link href={buildHref({ page: Math.min(totalPages, page + 1) })} aria-disabled={page >= totalPages} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${page >= totalPages ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5"}`}>
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
