export const dynamic = "force-dynamic";

import { getIncidentById, updateIncidentState, getAssignableAgents } from "@/app/actions/incidentActions";
import { ensureSlaForIncident } from "@/app/actions/slaActions";
import { createProblemFromIncident, linkIncidentToProblem, unlinkIncidentFromProblem, getLinkableProblems } from "@/app/actions/problemActions";
import { draftArticleFromIncident } from "@/app/actions/knowledgeActions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IncidentStatus } from "@prisma/client";
import AIAssistant from "@/components/AIAssistant";
import SlaDisplay from "@/components/SlaDisplay";
import IncidentActivity from "@/components/IncidentActivity";
import AssignmentControl from "@/components/AssignmentControl";
import GroupControl from "@/components/GroupControl";
import AttachmentPanel from "@/components/AttachmentPanel";
import { getAttachmentsForIncident } from "@/app/actions/attachmentActions";
import { getGroupOptions } from "@/app/actions/groupActions";
import { ChevronLeft, Ticket, BookOpenCheck, Boxes, X } from "lucide-react";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  // Await the params object (Next.js 15+ requirement, though we are on 16)
  const id = (await Promise.resolve(params)).id;
  const incident = await getIncidentById(id);

  if (!incident) {
    notFound();
  }

  const agents = await getAssignableAgents();
  const groups = await getGroupOptions();
  const attachments = await getAttachmentsForIncident(id);

  const isResolved = incident.status === "RESOLVED" || incident.status === "CLOSED";

  // Live SLA clock (backfilled for tickets created before the SLA engine).
  let sla: (typeof incident.slaInstances)[number] | null = incident.slaInstances[0] ?? null;
  if (!sla && !isResolved) {
    sla = await ensureSlaForIncident({
      id: incident.id,
      type: incident.type,
      priority: incident.priority,
      domain: incident.domain,
      createdAt: incident.createdAt,
    });
  }
  const linkableProblems = incident.problem ? [] : await getLinkableProblems();

  async function handleUpdate(formData: FormData) {
    "use server";
    const status = formData.get("status") as IncidentStatus;
    await updateIncidentState(id, status);
  }

  async function handleDraftArticle() {
    "use server";
    const article = await draftArticleFromIncident(id);
    redirect(`/knowledge/${article.id}`);
  }

  async function handleCreateProblem() {
    "use server";
    const p = await createProblemFromIncident(id);
    redirect(`/problems/${p.id}`);
  }
  async function handleLinkProblem(formData: FormData) {
    "use server";
    const problemId = formData.get("problemId") as string;
    if (problemId) await linkIncidentToProblem(problemId, id);
  }
  async function handleUnlinkProblem() {
    "use server";
    await unlinkIncidentFromProblem(id);
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/incidents" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Ticket className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{incident.number}</h1>
          <p className="text-slate-400 mt-1">Incident Record</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Incident Details</h2>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Caller</label>
                  <div className="text-slate-200 font-medium">{incident.caller?.name}</div>
                  <div className="text-slate-500 text-sm">{incident.caller?.email}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Priority</label>
                  <div className="text-slate-200 font-medium">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      incident.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      incident.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {incident.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Created</label>
                  <div className="text-slate-200 font-mono text-sm">{incident.createdAt.toLocaleString()}</div>
                </div>
                <AssignmentControl
                  incidentId={incident.id}
                  currentAssigneeId={incident.assigneeId ?? null}
                  agents={agents}
                />
                <GroupControl
                  incidentId={incident.id}
                  currentGroupId={incident.assignmentGroupId ?? null}
                  groups={groups}
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Short Description</label>
                <div className="text-slate-200 font-medium text-lg">{incident.title}</div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Description</label>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                  {incident.description}
                </div>
              </div>

              <form action={handleUpdate} className="pt-6 border-t border-white/5">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Update State</label>
                <div className="flex space-x-4">
                  <select 
                    name="status" 
                    defaultValue={incident.status}
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg hover:brightness-110 transition-all font-bold">
                    Update Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>

          <IncidentActivity
            incidentId={incident.id}
            notes={incident.notes.map((n) => ({
              id: n.id,
              body: n.body,
              type: n.type,
              createdAt: n.createdAt,
              author: n.author ? { name: n.author.name } : null,
            }))}
          />
        </div>

        <div className="space-y-6">
          {sla ? (
            <SlaDisplay
              dueAt={sla.dueAt.toISOString()}
              startAt={sla.startAt.toISOString()}
              stage={sla.stage}
              name={sla.name}
              schedule={sla.schedule}
            />
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 text-sm text-slate-400">
              {isResolved
                ? "SLA clock stopped — ticket resolved."
                : <>No SLA policy matches this ticket. <Link href="/admin/slas" className="text-indigo-400 font-bold">Define one →</Link></>}
            </div>
          )}

          <AttachmentPanel incidentId={incident.id} attachments={attachments} />

          {/* Problem linkage */}
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Problem</h2>
            </div>
            <div className="p-6">
              {incident.problem ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/problems/${incident.problem.id}`} className="font-bold text-indigo-400 hover:text-indigo-300">{incident.problem.number}</Link>
                    <div className="text-sm text-slate-300 truncate">{incident.problem.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{incident.problem.status.replace(/_/g, " ")}</div>
                  </div>
                  <form action={handleUnlinkProblem}>
                    <button type="submit" className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Unlink problem">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Recurring issue? Open a root-cause investigation or link an existing problem.</p>
                  <form action={handleCreateProblem}>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold rounded-xl text-sm transition-colors">
                      <Boxes className="w-4 h-4" /> Create Problem from Incident
                    </button>
                  </form>
                  {linkableProblems.length > 0 && (
                    <form action={handleLinkProblem} className="flex gap-2">
                      <select name="problemId" className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="">Link existing…</option>
                        {linkableProblems.map((p) => (
                          <option key={p.id} value={p.id}>{p.number} — {p.title.slice(0, 40)}</option>
                        ))}
                      </select>
                      <button type="submit" className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold rounded-xl text-sm transition-colors">Link</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">AI Diagnostics</h2>
            </div>
            <div className="p-6">
              <AIAssistant title={incident.title} description={incident.description} />
            </div>
          </div>

          {isResolved && (
            <div className="glass-panel border border-emerald-500/20 rounded-3xl overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 bg-emerald-500/5">
                <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Capture Knowledge</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-400 mb-4">
                  This incident is resolved. Turn the resolution into a reusable knowledge article with one click — our AI drafts it for you to review.
                </p>
                <form action={handleDraftArticle}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all font-bold text-sm"
                  >
                    <BookOpenCheck className="w-4 h-4" /> Generate KB Article
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
