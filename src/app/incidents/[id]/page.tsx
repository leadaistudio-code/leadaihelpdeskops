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
import { ChevronLeft, BookOpenCheck, Boxes, X } from "lucide-react";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  Badge,
  Select,
  priorityTone,
  humanize,
  focusRing,
  cn,
} from "@/components/ui";

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
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Link
          href="/incidents"
          className={cn(
            "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group shrink-0",
            focusRing
          )}
          aria-label="Back to incidents"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <PageHeader
          title={incident.number}
          description="Incident Record"
          className="flex-1 mb-0"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel className="overflow-hidden">
            <PanelHeader title="Incident Details" />

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Caller</label>
                  <div className="text-slate-200 font-medium">{incident.caller?.name}</div>
                  <div className="text-slate-500 text-sm">{incident.caller?.email}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Priority</label>
                  <div>
                    <Badge tone={priorityTone(incident.priority)}>{incident.priority}</Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Created</label>
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
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Short Description</label>
                <div className="text-slate-200 font-medium text-lg">{incident.title}</div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                  {incident.description}
                </div>
              </div>

              <form action={handleUpdate} className="pt-6 border-t border-white/5">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Update State</label>
                <div className="flex gap-4">
                  <Select name="status" defaultValue={incident.status} className="flex-1">
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                  <Button type="submit">Update Ticket</Button>
                </div>
              </form>
            </div>
          </Panel>

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
            <Panel padded className="text-sm text-slate-400">
              {isResolved
                ? "SLA clock stopped — ticket resolved."
                : <>No SLA policy matches this ticket. <Link href="/admin/slas" className={cn("text-[#00926f] hover:underline font-semibold rounded-sm", focusRing)}>Define one →</Link></>}
            </Panel>
          )}

          <AttachmentPanel incidentId={incident.id} attachments={attachments} />

          {/* Problem linkage */}
          <Panel className="overflow-hidden">
            <PanelHeader title="Problem" icon={Boxes} />
            <div className="p-6">
              {incident.problem ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/problems/${incident.problem.id}`} className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}>{incident.problem.number}</Link>
                    <div className="text-sm text-slate-300 truncate">{incident.problem.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{humanize(incident.problem.status)}</div>
                  </div>
                  <form action={handleUnlinkProblem}>
                    <button type="submit" className={cn("p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors", focusRing)} title="Unlink problem">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Recurring issue? Open a root-cause investigation or link an existing problem.</p>
                  <form action={handleCreateProblem}>
                    <Button type="submit" variant="secondary" icon={Boxes} className="w-full justify-center">
                      Create Problem from Incident
                    </Button>
                  </form>
                  {linkableProblems.length > 0 && (
                    <form action={handleLinkProblem} className="flex gap-2">
                      <Select name="problemId" className="flex-1">
                        <option value="">Link existing…</option>
                        {linkableProblems.map((p) => (
                          <option key={p.id} value={p.id}>{p.number} — {p.title.slice(0, 40)}</option>
                        ))}
                      </Select>
                      <Button type="submit" variant="secondary">Link</Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="AI Diagnostics" />
            <div className="p-6">
              <AIAssistant title={incident.title} description={incident.description} />
            </div>
          </Panel>

          {isResolved && (
            <Panel className="overflow-hidden border-emerald-500/20">
              <PanelHeader title="Capture Knowledge" className="bg-emerald-500/5" />
              <div className="p-6">
                <p className="text-sm text-slate-400 mb-4">
                  This incident is resolved. Turn the resolution into a reusable knowledge article with one click — our AI drafts it for you to review.
                </p>
                <form action={handleDraftArticle}>
                  <Button type="submit" icon={BookOpenCheck} className="w-full justify-center">
                    Generate KB Article
                  </Button>
                </form>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
