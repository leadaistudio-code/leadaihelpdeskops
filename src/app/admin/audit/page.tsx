export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuditEntries, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth-utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  PageHeader,
  Panel,
  Button,
  Badge,
  humanize,
  Input,
  Select,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
  focusRing,
  cn,
  type BadgeTone,
} from "@/components/ui";

const ACTION_TONE: Record<string, BadgeTone> = {
  CREATE: "neutral",
  UPDATE: "info",
  STATE_CHANGE: "info",
  ASSIGN: "info",
  APPROVE: "success",
  REJECT: "critical",
  LINK: "info",
  UNLINK: "neutral",
  REMEDIATION: "neutral",
  SLA_BREACH: "critical",
  ROLE_CHANGE: "warning",
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
      <PageHeader
        title="Audit Log"
        description={`Immutable record of every change — ${total} events`}
      />

      {/* Filters */}
      <form action="/admin/audit" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <Input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search actor, entity, or summary…"
            className="pl-11"
          />
        </div>
        <Select name="entity" defaultValue={entity} className="sm:w-48">
          <option value="ALL">All entities</option>
          {AUDIT_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
        </Select>
        <Select name="action" defaultValue={action} className="sm:w-48">
          <option value="ALL">All actions</option>
          {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
        </Select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <Panel className="overflow-hidden">
        <DataTable>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Detail</TH>
            </tr>
          </THead>
          <TBody>
            {items.length === 0 ? (
              <tr>
                <TD colSpan={5} align="center" className="py-12 text-slate-500 italic">No audit events match these filters.</TD>
              </tr>
            ) : (
              items.map((e) => {
                const href = entityHref(e.entityType, e.entityId);
                return (
                  <TR key={e.id} className="align-top">
                    <TD className="text-slate-400 font-mono text-xs whitespace-nowrap">{e.createdAt.toLocaleString()}</TD>
                    <TD>
                      <div className="font-medium text-slate-200">{e.actorName ?? "System"}</div>
                      {e.actorEmail && <div className="text-xs text-slate-500">{e.actorEmail}</div>}
                    </TD>
                    <TD>
                      <Badge tone={ACTION_TONE[e.action] ?? "neutral"}>{humanize(e.action)}</Badge>
                    </TD>
                    <TD className="whitespace-nowrap">
                      <span className="text-xs text-slate-500">{e.entityType}</span>{" "}
                      {e.entityLabel && (
                        href ? (
                          <Link href={href} className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}>{e.entityLabel}</Link>
                        ) : (
                          <span className="font-semibold text-slate-300">{e.entityLabel}</span>
                        )
                      )}
                    </TD>
                    <TD className="text-slate-300">{e.summary}</TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </DataTable>
      </Panel>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500 tabular-nums">Page {page} of {totalPages} · {total} events</p>
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
