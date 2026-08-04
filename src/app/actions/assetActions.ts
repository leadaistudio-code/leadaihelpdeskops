"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AssetStatus } from "@prisma/client";
import { getActiveDomain } from "@/lib/tenant";
import { requireAgent, getSessionUser } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { LIST_LIMIT } from "@/lib/query-limits";

export async function createAsset(formData: FormData) {
  const actor = await requireAgent();

  const assetTag = formData.get("assetTag") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const assigneeId = formData.get("assigneeId") as string;
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as AssetStatus;
  const purchaseDate = formData.get("purchaseDate") ? new Date(formData.get("purchaseDate") as string) : undefined;

  const asset = await prisma.asset.create({
    data: {
      assetTag,
      name,
      category,
      assigneeId: assigneeId || undefined,
      notes,
      status,
      purchaseDate,
      domain: await getActiveDomain(),
    },
  });

  // The asset register is a compliance artefact — who holds which hardware, and
  // when it changed hands. It was one of four action files writing no audit
  // trail at all, which is what makes a partial audit log dangerous: it reads as
  // complete.
  await logAudit({
    domain: asset.domain,
    action: "CREATE",
    entityType: "Asset",
    entityId: asset.id,
    entityLabel: asset.assetTag,
    summary: `Asset "${asset.name}" created`,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/assets");
  return asset;
}

export async function getAssets() {
  // The asset register is staff-facing, but it is a read, so a signed-in user of
  // the tenant is enough — the domain filter below does the isolation work.
  if (!(await getSessionUser())) throw new Error("Not authorized");

  return await prisma.asset.findMany({
    where: { domain: await getActiveDomain() },
    include: {
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });
}

export async function getAssetById(id: string) {
  if (!(await getSessionUser())) throw new Error("Not authorized");

  return await prisma.asset.findFirst({
    where: { id, domain: await getActiveDomain() },
    include: {
      assignee: true,
    },
  });
}

export async function updateAssetStatus(id: string, status: AssetStatus, assigneeId?: string) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const before = await prisma.asset.findFirst({
    where: { id, domain },
    select: { assetTag: true, status: true },
  });

  const data: { status: AssetStatus; assigneeId?: string | null } = { status };
  if (assigneeId !== undefined) {
    data.assigneeId = assigneeId || null;
  }

  // updateMany, not update: `where` must carry the tenant, and Prisma only
  // allows non-unique filters on the *Many variants. A count of 0 means the id
  // belongs to another tenant (or does not exist) — both are "not found".
  const res = await prisma.asset.updateMany({ where: { id, domain }, data });
  if (res.count === 0) throw new Error("Asset not found");

  await logAudit({
    domain,
    action: "STATE_CHANGE",
    entityType: "Asset",
    entityId: id,
    entityLabel: before?.assetTag,
    summary: `Asset status changed to ${status}`,
    field: "status",
    oldValue: before?.status ?? null,
    newValue: status,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath(`/assets/${id}`);
  revalidatePath("/assets");
  return await prisma.asset.findFirst({ where: { id, domain } });
}
