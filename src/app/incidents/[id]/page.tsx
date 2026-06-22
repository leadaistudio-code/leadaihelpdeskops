export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getIncidentById, updateIncidentState, getAssignableAgents } from "@/app/actions/incidentActions";
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
import { ChevronLeft, Ticket, BookOpenCheck } from "lucide-react";

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

  // Fetch dynamic SLA (scoped to the incident's tenant)
  const slaDef = await prisma.slaDefinition.findFirst({
    where: { type: incident.type, priority: incident.priority, isActive: true, domain: incident.domain },
    orderBy: { createdAt: "desc" }
  });
  const slaHours = slaDef?.durationHours || 24; // fallback

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

  const isResolved = incident.status === "RESOLVED" || incident.status === "CLOSED";

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
          <SlaDisplay createdAt={incident.createdAt} slaHours={slaHours} status={incident.status} />

          <AttachmentPanel incidentId={incident.id} attachments={attachments} />

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
