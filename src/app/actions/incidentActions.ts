"use server";

import prisma from "@/lib/prisma";
import { Priority, IncidentStatus, TicketType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export type CreateIncidentPayload = {
  title: string;
  description: string;
  priority?: Priority;
  type?: TicketType;
  callerId?: string;
  status?: IncidentStatus;
};

export async function createIncident(payload: CreateIncidentPayload | FormData) {
  let title, description, priority, callerId, type, status;

  if (payload instanceof FormData) {
    title = payload.get("title") as string;
    description = payload.get("description") as string;
    priority = payload.get("priority") as Priority;
    callerId = payload.get("callerId") as string;
    type = (payload.get("type") as TicketType) || "INCIDENT";
    status = (payload.get("status") as IncidentStatus) || "NEW";
  } else {
    title = payload.title;
    description = payload.description;
    priority = payload.priority;
    callerId = payload.callerId;
    type = payload.type || "INCIDENT";
    status = payload.status || "NEW";
  }

  // If no callerId provided, fetch first user or use mock
  if (!callerId) {
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) callerId = defaultUser.id;
  }

  // AI Triage
  let aiTriageNotes = "";
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("The appropriate priority based on urgency and impact."),
        assignmentGroup: z.string().describe("The IT assignment group best suited to handle this incident (e.g., Network Support, Database Admins, Hardware Provisioning)."),
        reasoning: z.string().describe("Brief explanation for the chosen priority and assignment group."),
      }),
      prompt: `Analyze the following IT incident and triage it.\n\nTitle: ${title}\nDescription: ${description}`,
    });

    priority = object.priority as Priority;
    aiTriageNotes = `\n\n--- AI Triage Notes ---\nSuggested Priority: ${object.priority}\nAssignment Group: ${object.assignmentGroup}\nReasoning: ${object.reasoning}`;
  } catch (e) {
    console.error("AI Triage failed:", e);
    // Proceed without AI triage if it fails (e.g. invalid API key)
    aiTriageNotes = `\n\n--- AI Triage Notes ---\nTriage failed. Please check OPENAI_API_KEY.`;
  }

  // Generate an incident number based on type
  const count = await prisma.incident.count({ where: { type } });
  const prefix = type === "REQUEST" ? "REQ" : "INC";
  const number = `${prefix}${String(count + 10000).padStart(7, '0')}`;

  const incident = await prisma.incident.create({
    data: {
      title,
      description: description + aiTriageNotes,
      priority,
      type,
      callerId: callerId as string,
      number,
      status,
    },
  });

  revalidatePath("/incidents");
  return incident;
}

export async function getIncidents(callerId?: string) {
  return await prisma.incident.findMany({
    where: callerId ? { callerId } : undefined,
    include: {
      caller: true,
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIncidentById(id: string) {
  return await prisma.incident.findUnique({
    where: { id },
    include: {
      caller: true,
      assignee: true,
    },
  });
}

export async function updateIncidentState(id: string, status: IncidentStatus) {
  const incident = await prisma.incident.update({
    where: { id },
    data: { status },
  });
  
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  return incident;
}
