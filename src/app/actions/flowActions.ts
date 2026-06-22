"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";

export type FlowNode = { id: number; type: string; name: string; desc: string };
export type SavedFlow = { id: string; name: string; isActive: boolean; updatedAt: string; nodes: FlowNode[] };

export async function getFlows(): Promise<SavedFlow[]> {
  const flows = await prisma.flow.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: { updatedAt: "desc" },
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
  const clean = name.trim();
  if (!clean) throw new Error("Flow name is required");

  const domain = await getActiveDomain();
  const existing = await prisma.flow.findFirst({ where: { name: clean, domain } });
  const flow = existing
    ? await prisma.flow.update({ where: { id: existing.id }, data: { definition: nodes } })
    : await prisma.flow.create({ data: { name: clean, definition: nodes, domain } });

  revalidatePath("/admin/flow-designer");
  return { id: flow.id, name: flow.name };
}

export async function deleteFlow(id: string) {
  await prisma.flow.delete({ where: { id } });
  revalidatePath("/admin/flow-designer");
}
