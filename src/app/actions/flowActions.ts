"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { requireAgent } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { LIST_LIMIT } from "@/lib/query-limits";

export type FlowNode = { id: number; type: string; name: string; desc: string };
export type SavedFlow = { id: string; name: string; isActive: boolean; updatedAt: string; nodes: FlowNode[] };

export async function getFlows(): Promise<SavedFlow[]> {
  await requireAgent();

  const flows = await prisma.flow.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });
  return flows.map((f) => ({
    id: f.id,
    name: f.name,
    isActive: f.isActive,
    updatedAt: f.updatedAt.toISOString(),
    nodes: (f.definition as unknown as FlowNode[]) ?? [],
  }));
}

// Persist (or overwrite by name) a flow's serialized node list.
export async function saveFlow(name: string, nodes: FlowNode[]) {
  const actor = await requireAgent();

  const clean = name.trim();
  if (!clean) throw new Error("Flow name is required");

  const domain = await getActiveDomain();
  const existing = await prisma.flow.findFirst({ where: { name: clean, domain } });
  const flow = existing
    ? await prisma.flow.update({ where: { id: existing.id }, data: { definition: nodes } })
    : await prisma.flow.create({ data: { name: clean, definition: nodes, domain } });

  await logAudit({
    domain,
    action: existing ? "UPDATE" : "CREATE",
    entityType: "Flow",
    entityId: flow.id,
    entityLabel: flow.name,
    summary: `Flow "${flow.name}" ${existing ? "updated" : "created"} (${nodes.length} steps)`,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/admin/flow-designer");
  return { id: flow.id, name: flow.name };
}

export async function deleteFlow(id: string) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const before = await prisma.flow.findFirst({ where: { id, domain }, select: { name: true } });

  // Tenant-scoped delete: without `domain` here, any id from any tenant deletes.
  const res = await prisma.flow.deleteMany({ where: { id, domain } });
  if (res.count === 0) throw new Error("Flow not found");

  await logAudit({
    domain,
    action: "DELETE",
    entityType: "Flow",
    entityId: id,
    entityLabel: before?.name,
    summary: `Flow "${before?.name ?? id}" deleted`,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/admin/flow-designer");
}
