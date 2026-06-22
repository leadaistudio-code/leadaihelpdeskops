"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { createIncident } from "@/app/actions/incidentActions";

// Default catalogue seeded on first load so the storefront is never empty.
const DEFAULT_CATALOG = [
  { name: 'Apple MacBook Pro 16"', description: "Request a standard developer laptop. Requires manager approval.", category: "Hardware", icon: "laptop" },
  { name: 'Dell 27" 4K Monitor', description: "Request an additional external display for your workstation.", category: "Hardware", icon: "monitor" },
  { name: "Microsoft Office 365", description: "Request a license for Word, Excel, PowerPoint, and Teams.", category: "Software", icon: "fileSpreadsheet" },
  { name: "Adobe Creative Cloud", description: "Request access to Photoshop, Illustrator, and more. Requires justification.", category: "Software", icon: "palette" },
  { name: "VPN Access", description: "Request remote access to the corporate network. Subject to security review.", category: "Access", icon: "shield" },
  { name: "Additional Cloud Storage", description: "Request an increase to your OneDrive / Drive storage quota.", category: "Software", icon: "database" },
];

// Categories that route a request through an approval step.
const APPROVAL_CATEGORIES = new Set(["Access"]);

export async function getCatalogItems() {
  const domain = await getActiveDomain();
  // Seed the default catalogue per-tenant on first visit.
  const count = await prisma.catalogItem.count({ where: { domain } });
  if (count === 0) {
    await prisma.catalogItem.createMany({ data: DEFAULT_CATALOG.map((c) => ({ ...c, domain })) });
  }
  return prisma.catalogItem.findMany({
    where: { isActive: true, domain },
    orderBy: { category: "asc" },
  });
}

export async function getCatalogItemById(id: string) {
  return prisma.catalogItem.findFirst({ where: { id, domain: await getActiveDomain() } });
}

// The current user's catalogue requests, newest first, with item + linked ticket.
export async function getMyCatalogRequests() {
  const user = await getSessionUser();
  if (!user) return [];
  return prisma.catalogRequest.findMany({
    where: { requesterId: user.id, domain: await getActiveDomain() },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });
}

// Submit a catalogue request: records a CatalogRequest and opens a linked
// REQUEST incident so it lands in the fulfillment queue.
export async function createCatalogRequest(itemId: string, notes: string) {
  const domain = await getActiveDomain();
  const item = await prisma.catalogItem.findFirst({ where: { id: itemId, domain } });
  if (!item) throw new Error("Catalogue item not found");

  const user = await getSessionUser();
  const requesterId = user?.id ?? (await prisma.user.findFirst())!.id;
  const requiresApproval = APPROVAL_CATEGORIES.has(item.category);

  // Open the work-queue incident first so we can link it to the request.
  const incident = await createIncident({
    title: `Request: ${item.name}`,
    description: `Category: ${item.category}\nJustification:\n${notes?.trim() || "(none provided)"}\n\nApproval required: ${requiresApproval}`,
    priority: requiresApproval ? "HIGH" : "MEDIUM",
    type: "REQUEST",
    status: requiresApproval ? "PENDING_APPROVAL" : "NEW",
    callerId: requesterId,
  });

  const request = await prisma.catalogRequest.create({
    data: {
      itemId,
      requesterId,
      status: requiresApproval ? "REQUESTED" : "APPROVED",
      notes: notes?.trim() || null,
      incidentId: incident.id,
      domain,
    },
  });

  revalidatePath("/catalog");
  revalidatePath("/approvals");
  return { request, requiresApproval };
}
