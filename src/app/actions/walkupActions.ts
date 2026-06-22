"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";

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

  // Find or create the shared walk-up kiosk caller.
  let kiosk = await prisma.user.findUnique({ where: { email: "kiosk@leadaistudio.ai" } });
  if (!kiosk) {
    kiosk = await prisma.user.create({
      data: { email: "kiosk@leadaistudio.ai", name: "TechLounge Kiosk", role: "EMPLOYEE" },
    });
  }

  const domain = await getActiveDomain();
  const count = await prisma.incident.count({ where: { type: "INCIDENT" } });
  const number = `INC${String(count + 10000).padStart(7, "0")}`;

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
    where: { title: { startsWith: "Walk-up:" }, status: { in: ["NEW", "IN_PROGRESS"] }, domain: await getActiveDomain() },
  });
  return { queue, etaMins: Math.max(2, queue * 4) };
}
