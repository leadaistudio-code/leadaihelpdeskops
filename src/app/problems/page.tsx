export const dynamic = "force-dynamic";

import Link from "next/link";
import { getProblems } from "@/app/actions/problemActions";
import { Boxes, Plus, GitMerge } from "lucide-react";
import type { ProblemStatus } from "@prisma/client";

export const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  INVESTIGATING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ROOT_CAUSE_IDENTIFIED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  KNOWN_ERROR: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const FILTERS: Array<{ key: ProblemStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "INVESTIGATING", label: "Investigating" },
  { key: "ROOT_CAUSE_IDENTIFIED", label: "Root Cause" },
  { key: "KNOWN_ERROR", label: "Known Error" },
  { key: "RESOLVED", label: "Resolved" },
];

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as ProblemStatus | "ALL") || "ALL";
  const problems = await getProblems({ status });

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 mt-4 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Problem Management</h1>
            <p className="text-slate-400 mt-1">Root-cause investigation behind recurring incidents.</p>
          </div>
        </div>
        <Link
          href="/problems/new"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#12B489] to-[#0E9E77] text-[#03130d] rounded-xl shadow-[0_0_20px_rgba(56,232,176,0.35)] hover:shadow-[0_0_30px_rgba(56,232,176,0.55)] hover:-translate-y-1 transition-all font-bold group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>New Problem</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "ALL" ? "/problems" : `/problems?status=${f.key}`}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              status === f.key
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Number</th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Priority</th>
                <th className="px-6 py-4 font-bold">Incidents</th>
                <th className="px-6 py-4 font-bold">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No problem records yet. Open one from a recurring incident, or create it directly.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/problems/${p.id}`} className="font-bold text-indigo-400 group-hover:text-indigo-300">
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200 max-w-md truncate">
                      {p.title}
                      {p.knownError && (
                        <span className="ml-2 text-[10px] font-mono font-bold uppercase text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5">
                          Known Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[p.status]}`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        p.priority === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        p.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-mono text-slate-400">
                        <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
                        {p._count.incidents}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{p.assignee?.name ?? "—"}</td>
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
