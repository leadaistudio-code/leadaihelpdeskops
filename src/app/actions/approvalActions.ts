"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NoteType } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { notify } from "@/app/actions/notificationActions";

// Incidents awaiting an approval decision (catalog access requests, etc.).
export async function getPendingApprovals() {
  return prisma.incident.findMany({
    where: { status: "PENDING_APPROVAL", domain: await getActiveDomain() },
    include: { caller: true },
    orderBy: { createdAt: "asc" },
  });
}

async function requireApprover() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized to approve requests");
  }
  return user;
}

export async function approveRequest(incidentId: string) {
  const approver = await requireApprover();

  const inc = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: "IN_PROGRESS", assigneeId: approver.id },
    select: { callerId: true, number: true, title: true },
  });

  await prisma.incidentNote.create({
    data: {
      incidentId,
      type: NoteType.SYSTEM,
      body: `Request approved by ${approver.name}. Moved to fulfillment.`,
      authorId: approver.id,
    },
  });

  // Keep the linked catalog request in sync.
  await prisma.catalogRequest.updateMany({
    where: { incidentId },
    data: { status: "APPROVED" },
  });

  await notify(inc.callerId, {
    title: `Request approved: ${inc.number}`,
    body: inc.title,
    type: "APPROVAL",
    link: `/incidents/${incidentId}`,
  });

  revalidatePath("/approvals");
  revalidatePath(`/incidents/${incidentId}`);
}

export async function rejectRequest(incidentId: string, reason?: string) {
  const approver = await requireApprover();

  const inc = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: "CLOSED" },
    select: { callerId: true, number: true, title: true },
  });

  await prisma.incidentNote.create({
    data: {
      incidentId,
      type: NoteType.SYSTEM,
      body: `Request rejected by ${approver.name}.${reason?.trim() ? ` Reason: ${reason.trim()}` : ""}`,
      authorId: approver.id,
    },
  });

  await prisma.catalogRequest.updateMany({
    where: { incidentId },
    data: { status: "REJECTED" },
  });

  await notify(inc.callerId, {
    title: `Request rejected: ${inc.number}`,
    body: reason?.trim() || inc.title,
    type: "REJECTION",
    link: `/incidents/${incidentId}`,
  });

  revalidatePath("/approvals");
  revalidatePath(`/incidents/${incidentId}`);
}
