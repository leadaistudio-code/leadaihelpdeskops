"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getKioskDomain } from "@/lib/tenant";
import { allocateNumber } from "@/lib/ticket-number";

const ISSUE_LABELS: Record<string, string> = {
  laptop: "Laptop / PC Issue",
  mobile: "Mobile Device",
  peripherals: "Headphones / Mouse",
  access: "Account Access",
  other: "General Walk-up Request",
};

// Kiosk check-in: opens a real incident (no auth session — attributed to a
// shared kiosk user) and returns the ticket number + live queue position.
export async function createWalkupTicket(issueType: string) {
  const label = ISSUE_LABELS[issueType] ?? ISSUE_LABELS.other;
  const domain = getKioskDomain();

  // Find or create this tenant's walk-up kiosk caller. The email carries the
  // domain so two tenants' kiosks never collide on the unique email index —
  // and so the kiosk user itself is a tenant row, not a shared one.
  const email = `kiosk+${domain}@leadaistudio.ai`;
  let kiosk = await prisma.user.findUnique({ where: { email } });
  if (!kiosk) {
    kiosk = await prisma.user.create({
      data: { email, name: "TechLounge Kiosk", role: "EMPLOYEE", domain },
    });
  }

  const number = await allocateNumber(domain, "INC");

  await prisma.incident.create({
    data: {
      number,
      title: `Walk-up: ${label}`,
      description: `Physical walk-up check-in at the TechLounge kiosk.\nIssue category: ${label}`,
      type: "INCIDENT",
      priority: "MEDIUM",
      status: "NEW",
      callerId: kiosk.id,
      domain,
    },
  });

  // Live queue = open walk-up tickets waiting in this tenant.
  const queue = await prisma.incident.count({
    where: { title: { startsWith: "Walk-up:" }, status: { in: ["NEW", "IN_PROGRESS"] }, domain },
  });

  revalidatePath("/incidents");
  return { number, queue, etaMins: Math.max(2, queue * 4) };
}

export async function getWalkupQueue() {
  const queue = await prisma.incident.count({
    where: { title: { startsWith: "Walk-up:" }, status: { in: ["NEW", "IN_PROGRESS"] }, domain: getKioskDomain() },
  });
  return { queue, etaMins: Math.max(2, queue * 4) };
}
