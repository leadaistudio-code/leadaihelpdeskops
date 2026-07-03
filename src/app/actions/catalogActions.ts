"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { createIncident } from "@/app/actions/incidentActions";

// Default catalogue seeded on first load so the storefront is never empty.
const DEFAULT_CATALOG = [
  // Hardware
  { name: 'Apple MacBook Pro 16"', description: "Request a standard developer laptop. Requires manager approval.", category: "Hardware", icon: "laptop" },
  { name: 'Dell 27" 4K Monitor', description: "Request an additional external display for your workstation.", category: "Hardware", icon: "monitor" },
  { name: "USB-C Docking Station", description: "Single-cable dock with dual-monitor, ethernet, and 100W charging.", category: "Hardware", icon: "harddrive" },
  { name: "Color Laser Printer", description: "Request a departmental or home-office color laser printer.", category: "Hardware", icon: "printer" },
  { name: "Portable SSD 2TB", description: "Encrypted high-speed external drive for backups and large media.", category: "Hardware", icon: "harddrive" },
  { name: "Standing Desk Converter", description: "Adjustable sit/stand riser for ergonomic home or office setups.", category: "Hardware", icon: "package" },
  // Peripherals
  { name: "Logitech MX Master Mouse", description: "Ergonomic wireless productivity mouse with multi-device support.", category: "Peripherals", icon: "mouse" },
  { name: "Mechanical Keyboard", description: "Tactile mechanical keyboard, wired or wireless.", category: "Peripherals", icon: "keyboard" },
  { name: "Noise-Cancelling Headset", description: "Certified headset for calls and focus work with ANC.", category: "Peripherals", icon: "headphones" },
  { name: "1080p Streaming Webcam", description: "HD webcam with auto-framing for meetings and presentations.", category: "Peripherals", icon: "webcam" },
  // Mobile
  { name: "iPhone 15 Pro", description: "Corporate mobile device with MDM enrollment. Manager approval required.", category: "Mobile", icon: "smartphone" },
  { name: 'iPad Pro 12.9"', description: "Tablet for field, design, or presentation use cases.", category: "Mobile", icon: "tablet" },
  { name: "Mobile Hotspot / 5G", description: "Cellular data device with a corporate data plan for travel.", category: "Mobile", icon: "wifi" },
  // Software
  { name: "Microsoft Office 365", description: "Request a license for Word, Excel, PowerPoint, and Teams.", category: "Software", icon: "fileSpreadsheet" },
  { name: "Adobe Creative Cloud", description: "Request access to Photoshop, Illustrator, and more. Requires justification.", category: "Software", icon: "palette" },
  { name: "Slack Enterprise Grid", description: "Provision a Slack workspace seat with SSO and compliance.", category: "Software", icon: "messageSquare" },
  { name: "Zoom Pro License", description: "Licensed video conferencing with large-meeting and webinar add-ons.", category: "Software", icon: "video" },
  { name: "JetBrains All Products Pack", description: "IntelliJ, WebStorm, PyCharm and the full JetBrains suite.", category: "Software", icon: "code" },
  { name: "Figma Organization Seat", description: "Design and collaboration seat with shared libraries.", category: "Software", icon: "penTool" },
  // Access
  { name: "VPN Access", description: "Request remote access to the corporate network. Subject to security review.", category: "Access", icon: "shield" },
  { name: "GitHub Enterprise Access", description: "Repository access with SSO and team membership. Requires approval.", category: "Access", icon: "gitBranch" },
  { name: "AWS Console Access", description: "Scoped IAM access to a cloud account. Requires security review.", category: "Access", icon: "cloud" },
  { name: "Production Database Access", description: "Read or read/write access to production data stores. Approval required.", category: "Access", icon: "database" },
  { name: "Admin Privileges Elevation", description: "Temporary elevated/admin rights with full audit trail.", category: "Access", icon: "key" },
  // Services
  { name: "Additional Cloud Storage", description: "Request an increase to your OneDrive / Drive storage quota.", category: "Software", icon: "cloud" },
  { name: "Corporate Credit Card", description: "Request a company card with a spending limit. Manager approval required.", category: "Services", icon: "creditCard" },
  { name: "New Hire Onboarding Kit", description: "Bundle of laptop, accounts, and access for a new team member.", category: "Services", icon: "userPlus" },
  { name: "Distribution List / Group Email", description: "Create a shared mailbox or distribution list for your team.", category: "Services", icon: "mail" },
];

// Categories that route a request through an approval step.
const APPROVAL_CATEGORIES = new Set(["Access"]);

export async function getCatalogItems() {
  const domain = await getActiveDomain();
  // Additively seed any default catalogue items missing for this tenant. This
  // keeps the storefront fully populated — including older tenants that were
  // seeded before the catalogue was expanded — without duplicating existing rows.
  const existing = await prisma.catalogItem.findMany({ where: { domain }, select: { name: true } });
  const have = new Set(existing.map((e) => e.name));
  const missing = DEFAULT_CATALOG.filter((c) => !have.has(c.name));
  if (missing.length > 0) {
    await prisma.catalogItem.createMany({ data: missing.map((c) => ({ ...c, domain })) });
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
