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
import { ChevronLeft, Microscope, Wrench, GitMerge, X, Link2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  Badge,
  statusTone,
  humanize,
  Field,
  Label,
  Input,
  Textarea,
  Select,
  focusRing,
  cn,
} from "@/components/ui";
import type { BadgeTone } from "@/components/ui";

const PROBLEM_STATUS_TONE: Record<string, BadgeTone> = {
  NEW: "neutral",
  INVESTIGATING: "warning",
  ROOT_CAUSE_IDENTIFIED: "info",
  KNOWN_ERROR: "neutral",
  RESOLVED: "success",
  CLOSED: "neutral",
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
      <div className="flex items-center gap-4 mb-6 mt-4">
        <Button href="/problems" variant="ghost" size="sm" icon={ChevronLeft}>
          Back
        </Button>
      </div>

      <PageHeader
        eyebrow={problem.number}
        title={problem.title}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={PROBLEM_STATUS_TONE[problem.status] ?? "neutral"}>{humanize(problem.status)}</Badge>
            {problem.knownError && (
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-300 border border-white/15 rounded px-1.5 py-0.5">
                Known Error
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Panel className="overflow-hidden">
            <PanelHeader title="Description" />
            <div className="p-6 text-slate-300 whitespace-pre-wrap leading-relaxed">{problem.description}</div>
          </Panel>

          {/* RCA / workaround */}
          <Panel className="overflow-hidden">
            <PanelHeader title="Root Cause Analysis" icon={Microscope} />
            <form action={handleDetails} className="p-6 space-y-6">
              <Field label="Root Cause" htmlFor="rootCause">
                <Textarea
                  id="rootCause"
                  name="rootCause"
                  rows={4}
                  defaultValue={problem.rootCause ?? ""}
                  placeholder="What is the underlying cause?"
                />
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" /> Workaround
                  </span>
                }
                htmlFor="workaround"
              >
                <Textarea
                  id="workaround"
                  name="workaround"
                  rows={3}
                  defaultValue={problem.workaround ?? ""}
                  placeholder="Interim workaround for affected users (published as a Known Error)…"
                />
              </Field>
              <div className="flex items-end justify-between gap-4">
                <Field label="Priority" htmlFor="priority" className="flex-1 max-w-[200px]">
                  <Select id="priority" name="priority" defaultValue={problem.priority}>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </Select>
                </Field>
                <Button type="submit" variant="secondary">Save Analysis</Button>
              </div>
            </form>
          </Panel>

          {/* Linked incidents */}
          <Panel className="overflow-hidden">
            <PanelHeader title={`Linked Incidents (${problem.incidents.length})`} icon={GitMerge} />
            <div className="divide-y divide-white/5">
              {problem.incidents.length === 0 && (
                <div className="px-6 py-6 text-sm text-slate-500 italic">No incidents linked yet.</div>
              )}
              {problem.incidents.map((inc) => (
                <div key={inc.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="min-w-0">
                    <Link
                      href={`/incidents/${inc.id}`}
                      className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}
                    >
                      {inc.number}
                    </Link>
                    <span className="text-slate-300 ml-3 truncate">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge tone={statusTone(inc.status)}>{humanize(inc.status)}</Badge>
                    <form action={handleUnlink}>
                      <input type="hidden" name="incidentId" value={inc.id} />
                      <button
                        type="submit"
                        className={cn("p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors", focusRing)}
                        title="Unlink"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            {linkable.length > 0 && (
              <form action={handleLink} className="px-6 py-5 border-t border-white/5 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                <Select name="incidentId" className="flex-1">
                  <option value="">Link an open incident…</option>
                  {linkable.map((i) => (
                    <option key={i.id} value={i.id}>{i.number} — {i.title.slice(0, 60)}</option>
                  ))}
                </Select>
                <Button type="submit" variant="secondary">Link</Button>
              </form>
            )}
          </Panel>

          {/* Activity */}
          <Panel className="overflow-hidden">
            <PanelHeader title="Activity" />
            <form action={handleNote} className="p-6 border-b border-white/5">
              <Textarea name="body" rows={2} placeholder="Add an investigation note…" />
              <div className="flex justify-end mt-3">
                <Button type="submit" variant="secondary">Add Note</Button>
              </div>
            </form>
            <div className="p-6 space-y-4">
              {problem.notes.length === 0 && <div className="text-sm text-slate-500 italic">No activity yet.</div>}
              {problem.notes.map((n) => (
                <div key={n.id} className={`flex gap-3 ${n.type === "SYSTEM" ? "opacity-70" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === "SYSTEM" ? "bg-slate-500" : "bg-slate-300"}`} />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">{n.body}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      {n.author?.name ?? "System"} · {n.createdAt.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Panel className="overflow-hidden">
            <PanelHeader title="Manage" />
            <div className="p-6 space-y-5">
              <form action={handleStatus}>
                <Field label="Lifecycle State" htmlFor="status" className="mb-3">
                  <Select id="status" name="status" defaultValue={problem.status}>
                    <option value="NEW">New</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="ROOT_CAUSE_IDENTIFIED">Root Cause Identified</option>
                    <option value="KNOWN_ERROR">Known Error</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                </Field>
                <Button type="submit" className="w-full">Update State</Button>
              </form>

              <div className="pt-4 border-t border-white/5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="text-slate-300 font-medium">{problem.assignee?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Opened</span><span className="text-slate-300 font-mono text-xs">{problem.createdAt.toLocaleDateString()}</span></div>
                {problem.resolvedAt && (
                  <div className="flex justify-between"><span className="text-slate-500">Resolved</span><span className="text-emerald-400 font-mono text-xs">{problem.resolvedAt.toLocaleDateString()}</span></div>
                )}
              </div>
            </div>
          </Panel>

          {problem.workaround && (
            <Panel className="overflow-hidden">
              <PanelHeader title="Known Workaround" icon={Wrench} />
              <div className="p-6 text-sm text-slate-300 whitespace-pre-wrap">{problem.workaround}</div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
