"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AssetStatus } from "@prisma/client";
import { getActiveDomain } from "@/lib/tenant";

export async function createAsset(formData: FormData) {
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

  revalidatePath("/assets");
  return asset;
}

export async function getAssets() {
  return await prisma.asset.findMany({
    where: { domain: await getActiveDomain() },
    include: {
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssetById(id: string) {
  return await prisma.asset.findFirst({
    where: { id, domain: await getActiveDomain() },
    include: {
      assignee: true,
    },
  });
}

export async function updateAssetStatus(id: string, status: AssetStatus, assigneeId?: string) {
  const data: { status: AssetStatus; assigneeId?: string | null } = { status };
  if (assigneeId !== undefined) {
    data.assigneeId = assigneeId || null;
  }
  
  const asset = await prisma.asset.update({
    where: { id },
    data,
  });
  
  revalidatePath(`/assets/${id}`);
  revalidatePath("/assets");
  return asset;
}
