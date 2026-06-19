"use server";

import prisma from "@/lib/prisma";
import { TicketType, Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getSlaDefinitions() {
  return await prisma.slaDefinition.findMany({
    orderBy: [{ type: "asc" }, { priority: "desc" }],
  });
}

export async function createSlaDefinition(data: { name: string; type: TicketType; priority: Priority; durationHours: number }) {
  await prisma.slaDefinition.create({
    data: {
      name: data.name,
      type: data.type,
      priority: data.priority,
      durationHours: data.durationHours,
    },
  });
  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}

export async function toggleSlaStatus(id: string, isActive: boolean) {
  await prisma.slaDefinition.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}

export async function deleteSlaDefinition(id: string) {
  await prisma.slaDefinition.delete({ where: { id } });
  revalidatePath("/admin/slas");
  revalidatePath("/incidents/[id]", "page");
}
