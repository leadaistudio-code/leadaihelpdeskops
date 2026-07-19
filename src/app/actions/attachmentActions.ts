"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { attachmentVisibleTo } from "@/lib/attachment-access";

const META_SELECT = {
  id: true,
  filename: true,
  mimeType: true,
  size: true,
  createdAt: true,
  uploadedBy: { select: { name: true } },
} as const;

function toMeta(a: { id: string; filename: string; mimeType: string; size: number; createdAt: Date; uploadedBy: { name: string } | null }) {
  return {
    id: a.id,
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    createdAt: a.createdAt.toISOString(),
    uploadedBy: a.uploadedBy?.name ?? null,
  };
}

// Attachment metadata only (never the binary blob) for listing on a ticket.
export async function getAttachmentsForIncident(incidentId: string) {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await prisma.attachment.findMany({
    where: { incidentId, ...attachmentVisibleTo(user, await getActiveDomain()) },
    select: META_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toMeta);
}

export async function getAttachmentsForArticle(articleId: string) {
  const user = await getSessionUser();
  if (!user) return [];

  const rows = await prisma.attachment.findMany({
    where: { articleId, ...attachmentVisibleTo(user, await getActiveDomain()) },
    select: META_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toMeta);
}

export async function deleteAttachment(id: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  // Scoped by the owning incident/article so an agent can't reach a file in
  // another tenant — a delete there would be silent and unrecoverable.
  const att = await prisma.attachment.findFirst({
    where: { id, ...attachmentVisibleTo(user, await getActiveDomain()) },
    select: { uploadedById: true, incidentId: true, articleId: true },
  });
  if (!att) return;

  // Uploader, agents, and admins may delete.
  const canDelete =
    att.uploadedById === user.id || user.role === "ADMIN" || user.role === "IT_AGENT";
  if (!canDelete) throw new Error("Not allowed to delete this attachment");

  await prisma.attachment.delete({ where: { id } });
  revalidatePath(att.incidentId ? `/incidents/${att.incidentId}` : `/knowledge/${att.articleId}`);
}
