export const dynamic = "force-dynamic";

import Link from "next/link";
import { getIncidentsPaged } from "@/app/actions/incidentActions";
import { getGroupOptions } from "@/app/actions/groupActions";
import { getSessionUser } from "@/lib/auth-utils";
import { Ticket, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SlaBadge from "@/components/SlaBadge";
import {
  PageHeader,
  Button,
  Panel,
  Input,
  Select,
  Badge,
  statusTone,
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
      <PageHeader
        title="Incidents"
        description={isEmployee ? "Your active support requests" : `${total} tickets in the system`}
        action={
          <Button href="/incidents/new" icon={Plus}>
            New Incident
          </Button>
        }
      />

      {/* Filter bar */}
      <form action="/incidents" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <Input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by number or title…"
            className="pl-11"
          />
        </div>
        <Select name="status" defaultValue={status} className="sm:w-48">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All statuses" : humanize(s)}</option>
          ))}
        </Select>
        <Select name="priority" defaultValue={priority} className="sm:w-44">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === "ALL" ? "All priorities" : p}</option>
          ))}
        </Select>
        {!isEmployee && groups.length > 0 && (
          <Select name="group" defaultValue={group} className="sm:w-44">
            <option value="ALL">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        )}
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <Panel className="overflow-hidden">
        <DataTable>
          <THead>
            <tr>
              <TH>Number</TH>
              <TH>Opened</TH>
              <TH>Short description</TH>
              <TH>Caller</TH>
              <TH>Priority</TH>
              <TH>State</TH>
            </tr>
          </THead>
          <TBody>
            {items.length === 0 ? (
              <tr>
                <TD colSpan={6}>
                  <EmptyState
                    icon={Ticket}
                    title={q || status !== "ALL" ? "No matching incidents" : isEmployee ? "No open tickets" : "No incidents yet"}
                    description={q || status !== "ALL" ? "Try adjusting your search or filters." : "New incidents will appear here as they're raised."}
                    ctaHref="/incidents/new"
                    ctaLabel="New Incident"
                  />
                </TD>
              </tr>
            ) : (
              items.map((inc) => (
                <TR key={inc.id} className="cursor-pointer">
                  <TD>
                    <Link href={`/incidents/${inc.id}`} className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}>
                      {inc.number}
                    </Link>
                  </TD>
                  <TD className="text-slate-400">{inc.createdAt.toLocaleString()}</TD>
                  <TD className="font-medium text-slate-200">{inc.title}</TD>
                  <TD className="text-slate-400">{inc.caller?.name || "Unknown"}</TD>
                  <TD>
                    <Badge tone={priorityTone(inc.priority)}>{inc.priority}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={statusTone(inc.status)}>{humanize(inc.status)}</Badge>
                    {inc.slaInstances[0] && (
                      <div className="mt-1.5">
                        <SlaBadge dueAt={inc.slaInstances[0].dueAt} stage={inc.slaInstances[0].stage} />
                      </div>
                    )}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </DataTable>
      </Panel>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500 tabular-nums">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <Link
              href={buildHref({ page: Math.max(1, page - 1) })}
              aria-disabled={page <= 1}
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                page <= 1 ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5",
                focusRing
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <Link
              href={buildHref({ page: Math.min(totalPages, page + 1) })}
              aria-disabled={page >= totalPages}
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                page >= totalPages ? "text-slate-600 border-white/5 pointer-events-none" : "text-slate-300 border-white/10 hover:bg-white/5",
                focusRing
              )}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
