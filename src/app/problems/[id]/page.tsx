export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProblemById,
  updateProblemState,
  updateProblemDetails,
  addProblemNote,
  linkIncidentToProblem,
  unlinkIncidentFromProblem,
  getLinkableIncidents,
} from "@/app/actions/problemActions";
import type { ProblemStatus, Priority } from "@prisma/client";
import { ChevronLeft, Boxes, Microscope, Wrench, GitMerge, X, Link2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  INVESTIGATING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ROOT_CAUSE_IDENTIFIED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  KNOWN_ERROR: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};
const INC_STATUS: Record<string, string> = {
  NEW: "text-sky-400",
  IN_PROGRESS: "text-amber-400",
  ON_HOLD: "text-amber-400",
  RESOLVED: "text-emerald-400",
  CLOSED: "text-slate-500",
};

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = await getProblemById(id);
  if (!problem) notFound();

  const linkable = await getLinkableIncidents();

  async function handleStatus(formData: FormData) {
    "use server";
    await updateProblemState(id, formData.get("status") as ProblemStatus);
  }
  async function handleDetails(formData: FormData) {
    "use server";
    await updateProblemDetails(id, {
      rootCause: (formData.get("rootCause") as string) ?? "",
      workaround: (formData.get("workaround") as string) ?? "",
      priority: formData.get("priority") as Priority,
    });
  }
  async function handleNote(formData: FormData) {
    "use server";
    await addProblemNote(id, formData.get("body") as string);
  }
  async function handleLink(formData: FormData) {
    "use server";
    const incidentId = formData.get("incidentId") as string;
    if (incidentId) await linkIncidentToProblem(id, incidentId);
  }
  async function handleUnlink(formData: FormData) {
    "use server";
    await unlinkIncidentFromProblem(formData.get("incidentId") as string);
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/problems" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Boxes className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{problem.number}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[problem.status]}`}>
              {problem.status.replace(/_/g, " ")}
            </span>
            {problem.knownError && (
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5">Known Error</span>
            )}
          </div>
          <p className="text-slate-400 mt-1 truncate">{problem.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Description</h2>
            </div>
            <div className="p-8 text-slate-300 whitespace-pre-wrap leading-relaxed">{problem.description}</div>
          </div>

          {/* RCA / workaround */}
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Root Cause Analysis</h2>
            </div>
            <form action={handleDetails} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Root Cause</label>
                <textarea name="rootCause" rows={4} defaultValue={problem.rootCause ?? ""} placeholder="What is the underlying cause?" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Workaround
                </label>
                <textarea name="workaround" rows={3} defaultValue={problem.workaround ?? ""} placeholder="Interim workaround for affected users (published as a Known Error)…" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 max-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Priority</label>
                  <select name="priority" defaultValue={problem.priority} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <button type="submit" className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl transition-colors">Save Analysis</button>
              </div>
            </form>
          </div>

          {/* Linked incidents */}
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Linked Incidents ({problem.incidents.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {problem.incidents.length === 0 && (
                <div className="px-8 py-6 text-sm text-slate-500 italic">No incidents linked yet.</div>
              )}
              {problem.incidents.map((inc) => (
                <div key={inc.id} className="px-8 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="min-w-0">
                    <Link href={`/incidents/${inc.id}`} className="font-bold text-indigo-400 hover:text-indigo-300">{inc.number}</Link>
                    <span className="text-slate-300 ml-3 truncate">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-mono font-bold ${INC_STATUS[inc.status] ?? "text-slate-400"}`}>{inc.status}</span>
                    <form action={handleUnlink}>
                      <input type="hidden" name="incidentId" value={inc.id} />
                      <button type="submit" className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Unlink">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            {linkable.length > 0 && (
              <form action={handleLink} className="px-8 py-5 border-t border-white/5 bg-black/20 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                <select name="incidentId" className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="">Link an open incident…</option>
                  {linkable.map((i) => (
                    <option key={i.id} value={i.id}>{i.number} — {i.title.slice(0, 60)}</option>
                  ))}
                </select>
                <button type="submit" className="px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl text-sm transition-colors">Link</button>
              </form>
            )}
          </div>

          {/* Activity */}
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Activity</h2>
            </div>
            <form action={handleNote} className="p-6 border-b border-white/5">
              <textarea name="body" rows={2} placeholder="Add an investigation note…" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <div className="flex justify-end mt-3">
                <button type="submit" className="px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl text-sm transition-colors">Add Note</button>
              </div>
            </form>
            <div className="p-6 space-y-4">
              {problem.notes.length === 0 && <div className="text-sm text-slate-500 italic">No activity yet.</div>}
              {problem.notes.map((n) => (
                <div key={n.id} className={`flex gap-3 ${n.type === "SYSTEM" ? "opacity-70" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === "SYSTEM" ? "bg-slate-500" : "bg-indigo-400"}`} />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">{n.body}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      {n.author?.name ?? "System"} · {n.createdAt.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Manage</h2>
            </div>
            <div className="p-6 space-y-5">
              <form action={handleStatus}>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Lifecycle State</label>
                <select name="status" defaultValue={problem.status} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3">
                  <option value="NEW">New</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="ROOT_CAUSE_IDENTIFIED">Root Cause Identified</option>
                  <option value="KNOWN_ERROR">Known Error</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#12B489] to-[#0E9E77] text-[#03130d] font-bold rounded-xl transition-all hover:-translate-y-0.5">Update State</button>
              </form>

              <div className="pt-4 border-t border-white/5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="text-slate-300 font-medium">{problem.assignee?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Opened</span><span className="text-slate-300 font-mono text-xs">{problem.createdAt.toLocaleDateString()}</span></div>
                {problem.resolvedAt && (
                  <div className="flex justify-between"><span className="text-slate-500">Resolved</span><span className="text-emerald-400 font-mono text-xs">{problem.resolvedAt.toLocaleDateString()}</span></div>
                )}
              </div>
            </div>
          </div>

          {problem.workaround && (
            <div className="glass-panel border border-indigo-500/20 rounded-3xl overflow-hidden">
              <div className="px-8 py-5 border-b border-white/5 bg-indigo-500/5 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Known Workaround</h2>
              </div>
              <div className="p-6 text-sm text-slate-300 whitespace-pre-wrap">{problem.workaround}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
