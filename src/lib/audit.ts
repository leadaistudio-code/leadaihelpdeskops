import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

export type AuditActor = { id?: string | null; name?: string | null; email?: string | null };

// Entity types and actions are stored as plain strings for flexibility; these
// constants keep call sites consistent and drive the admin filters.
export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "STATE_CHANGE",
  "ASSIGN",
  "APPROVE",
  "REJECT",
  "LINK",
  "UNLINK",
  "REMEDIATION",
  "SLA_BREACH",
  "ROLE_CHANGE",
] as const;

export const AUDIT_ENTITIES = ["Incident", "Problem", "CatalogRequest", "Device", "User", "SlaInstance"] as const;

/*
  Record one audit entry. Best-effort — never throws into the caller's path.
  `actor`:
    - omitted (undefined) → resolved from the current session
    - null                → an automated/system event ("System")
    - object              → an explicit actor the caller already has (avoids a
                            redundant session lookup)
*/
export async function logAudit(entry: {
  domain: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  actor?: AuditActor | null;
}) {
  try {
    let actor = entry.actor;
    if (actor === undefined) {
      const u = await getSessionUser();
      actor = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
    await prisma.auditLog.create({
      data: {
        domain: entry.domain,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? "System",
        actorEmail: actor?.email ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        entityLabel: entry.entityLabel ?? null,
        summary: entry.summary,
        field: entry.field ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
      },
    });
  } catch (e) {
    console.error("logAudit failed:", e);
  }
}

export async function getAuditEntries(opts: {
  domain: string;
  entityType?: string;
  action?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = opts.pageSize ?? 25;
  const page = Math.max(1, opts.page ?? 1);

  const where: Prisma.AuditLogWhereInput = { domain: opts.domain };
  if (opts.entityType && opts.entityType !== "ALL") where.entityType = opts.entityType;
  if (opts.action && opts.action !== "ALL") where.action = opts.action;
  const s = opts.search?.trim();
  if (s) {
    where.OR = [
      { summary: { contains: s, mode: "insensitive" } },
      { entityLabel: { contains: s, mode: "insensitive" } },
      { actorName: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
