export const dynamic = "force-dynamic";

import Link from "next/link";
import { getProblems } from "@/app/actions/problemActions";
import { Boxes, Plus } from "lucide-react";
import type { ProblemStatus } from "@prisma/client";
import {
  PageHeader,
  Button,
  Panel,
  Badge,
  priorityTone,
  humanize,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
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
      <PageHeader
        title="Problem Management"
        description="Root-cause investigation behind recurring incidents."
        action={
          <Button href="/problems/new" icon={Plus}>
            New Problem
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "ALL" ? "/problems" : `/problems?status=${f.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
              status === f.key
                ? "bg-white/10 text-slate-100 border-white/15"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200",
              focusRing
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <DataTable>
          <THead>
            <tr>
              <TH>Number</TH>
              <TH>Title</TH>
              <TH>Status</TH>
              <TH>Priority</TH>
              <TH>Incidents</TH>
              <TH>Owner</TH>
            </tr>
          </THead>
          <TBody>
            {problems.length === 0 ? (
              <tr>
                <TD colSpan={6} align="center" className="py-12 text-slate-500 italic">
                  No problem records yet. Open one from a recurring incident, or create it directly.
                </TD>
              </tr>
            ) : (
              problems.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link
                      href={`/problems/${p.id}`}
                      className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}
                    >
                      {p.number}
                    </Link>
                  </TD>
                  <TD className="font-medium text-slate-200 max-w-md truncate">
                    {p.title}
                    {p.knownError && (
                      <span className="ml-2 text-[10px] font-mono font-semibold uppercase text-slate-300 border border-white/15 rounded px-1.5 py-0.5">
                        Known Error
                      </span>
                    )}
                  </TD>
                  <TD>
                    <Badge tone={PROBLEM_STATUS_TONE[p.status] ?? "neutral"}>{humanize(p.status)}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={priorityTone(p.priority)}>{p.priority}</Badge>
                  </TD>
                  <TD className="font-mono text-slate-400">{p._count.incidents}</TD>
                  <TD className="text-slate-400">{p.assignee?.name ?? "—"}</TD>
                </TR>
              ))
            )}
          </TBody>
        </DataTable>
      </Panel>
    </div>
  );
}
