"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NoteType } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";

async function requireAgent() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  return user;
}

// Groups in the active tenant, with members and ticket counts.
export async function getGroups() {
  const domain = await getActiveDomain();
  const groups = await prisma.assignmentGroup.findMany({
    where: { domain },
    include: {
      members: { select: { id: true, name: true, role: true } },
      _count: { select: { incidents: true } },
    },
    orderBy: { name: "asc" },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    members: g.members,
    openCount: g._count.incidents,
  }));
}

// Lightweight list for selectors.
export async function getGroupOptions() {
  const domain = await getActiveDomain();
  return prisma.assignmentGroup.findMany({
    where: { domain },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createGroup(name: string) {
  await requireAgent();
  const clean = name.trim();
  if (!clean) throw new Error("Group name is required");
  const domain = await getActiveDomain();
  await prisma.assignmentGroup.create({ data: { name: clean, domain } });
  revalidatePath("/admin/groups");
}

export async function deleteGroup(id: string) {
  await requireAgent();
  const domain = await getActiveDomain();
  await prisma.assignmentGroup.deleteMany({ where: { id, domain } });
  revalidatePath("/admin/groups");
}

// Replace a group's membership with the given agent ids.
export async function setGroupMembers(groupId: string, userIds: string[]) {
  await requireAgent();
  const domain = await getActiveDomain();
  const group = await prisma.assignmentGroup.findFirst({ where: { id: groupId, domain }, select: { id: true } });
  if (!group) throw new Error("Group not found");
  await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: { members: { set: userIds.map((id) => ({ id })) } },
  });
  revalidatePath("/admin/groups");
}

// Route an incident to a group (or clear it), logging it on the timeline.
export async function assignIncidentGroup(incidentId: string, groupId: string | null) {
  await requireAgent();
  const domain = await getActiveDomain();
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, domain }, select: { id: true } });
  if (!incident) throw new Error("Incident not found");

  const group = groupId
    ? await prisma.assignmentGroup.findFirst({ where: { id: groupId, domain }, select: { name: true } })
    : null;

  await prisma.incident.update({ where: { id: incidentId }, data: { assignmentGroupId: groupId || null } });
  await prisma.incidentNote.create({
    data: {
      incidentId,
      type: NoteType.SYSTEM,
      body: group ? `Routed to group: ${group.name}.` : "Removed from assignment group.",
    },
  });
  revalidatePath(`/incidents/${incidentId}`);
}

// Used by AI triage: match a predicted group name to a real group in the tenant.
export async function resolveGroupByName(domain: string, predicted: string): Promise<string | null> {
  const p = predicted.trim().toLowerCase();
  if (!p) return null;
  const groups = await prisma.assignmentGroup.findMany({ where: { domain }, select: { id: true, name: true } });
  // Exact, then contains, match.
  const exact = groups.find((g) => g.name.toLowerCase() === p);
  if (exact) return exact.id;
  const partial = groups.find((g) => p.includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(p));
  return partial?.id ?? null;
}
