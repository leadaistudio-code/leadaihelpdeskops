"use server";

import prisma from "@/lib/prisma";
import { TicketType, Priority, SlaSchedule } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { requireAgent } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { LIST_LIMIT } from "@/lib/query-limits";

// Admin CRUD for SLA policies. Everything in this file is a public HTTP
// endpoint by virtue of "use server", so every export authorizes its caller.
//
// The SLA *clock engine* (start/pause/resume/stop/escalate/sweep) used to live
// here too. It has moved to `src/lib/sla-engine.ts`: those functions take no
// session and cannot authorize anyone, so exporting them from a "use server"
// module published them to the network. See the note at the top of that file.

// ---------------------------------------------------------------------------
// SLA definitions (admin)
// ---------------------------------------------------------------------------

export async function getSlaDefinitions() {
  await requireAgent();

  return await prisma.slaDefinition.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: [{ type: "asc" }, { priority: "desc" }],
    take: LIST_LIMIT,
  });
}

export async function createSlaDefinition(data: {
  name: string;
  type: TicketType;
  priority: Priority;
  durationHours: number;
  schedule?: SlaSchedule;
}) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const def = await prisma.slaDefinition.create({
    data: {
      name: data.name,
      type: data.type,
      priority: data.priority,
      durationHours: data.durationHours,
      schedule: data.schedule ?? "ALWAYS",
      domain,
    },
  });

  // SLA policies decide when a customer is owed a credit, so changes to them
  // need a trail. This file wrote none before.
  await logAudit({
    domain,
    action: "CREATE",
    entityType: "SlaDefinition",
    entityId: def.id,
    entityLabel: def.name,
    summary: `SLA policy "${def.name}" created — ${def.durationHours}h for ${def.priority} ${def.type}`,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}

// SLA policies decide when a ticket is late, so they are staff-only and
// tenant-scoped on write. Unauthenticated before, an employee could delete the
// policies governing their own tickets — or another tenant's.
export async function toggleSlaStatus(id: string, isActive: boolean) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const before = await prisma.slaDefinition.findFirst({ where: { id, domain }, select: { name: true, isActive: true } });
  const res = await prisma.slaDefinition.updateMany({ where: { id, domain }, data: { isActive } });
  if (res.count === 0) throw new Error("SLA definition not found");

  await logAudit({
    domain,
    action: "STATE_CHANGE",
    entityType: "SlaDefinition",
    entityId: id,
    entityLabel: before?.name,
    summary: `SLA policy "${before?.name ?? id}" ${isActive ? "enabled" : "disabled"}`,
    field: "isActive",
    oldValue: String(before?.isActive ?? ""),
    newValue: String(isActive),
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}

export async function deleteSlaDefinition(id: string) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const before = await prisma.slaDefinition.findFirst({ where: { id, domain }, select: { name: true } });
  const res = await prisma.slaDefinition.deleteMany({ where: { id, domain } });
  if (res.count === 0) throw new Error("SLA definition not found");

  await logAudit({
    domain,
    action: "DELETE",
    entityType: "SlaDefinition",
    entityId: id,
    entityLabel: before?.name,
    summary: `SLA policy "${before?.name ?? id}" deleted`,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}
