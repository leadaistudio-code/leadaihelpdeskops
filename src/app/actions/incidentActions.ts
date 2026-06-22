"use server";

import prisma from "@/lib/prisma";
import { Priority, IncidentStatus, TicketType, NoteType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { notify } from "@/app/actions/notificationActions";
import { resolveGroupByName } from "@/app/actions/groupActions";

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

  const domain = await getActiveDomain();

  // AI Triage
  let aiTriageNotes = "";
  let predictedGroup = "";
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
    predictedGroup = object.assignmentGroup;
    aiTriageNotes = `\n\n--- AI Triage Notes ---\nSuggested Priority: ${object.priority}\nAssignment Group: ${object.assignmentGroup}\nReasoning: ${object.reasoning}`;
  } catch (e) {
    console.error("AI Triage failed:", e);
    // Proceed without AI triage if it fails (e.g. invalid API key)
    aiTriageNotes = `\n\n--- AI Triage Notes ---\nTriage failed. Please check OPENAI_API_KEY.`;
  }

  // Route to a real assignment group if the AI's predicted group matches one.
  const assignmentGroupId = predictedGroup ? await resolveGroupByName(domain, predictedGroup) : null;

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
      domain,
      assignmentGroupId,
    },
  });

  revalidatePath("/incidents");
  return incident;
}

export async function getIncidents(callerId?: string) {
  const domain = await getActiveDomain();
  return await prisma.incident.findMany({
    where: { domain, ...(callerId ? { callerId } : {}) },
    include: {
      caller: true,
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Paged + filtered incident list for the main queue view.
export async function getIncidentsPaged(opts: {
  callerId?: string;
  search?: string;
  status?: IncidentStatus | "ALL";
  groupId?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = opts.pageSize ?? 10;
  const page = Math.max(1, opts.page ?? 1);
  const search = opts.search?.trim();

  const where: Prisma.IncidentWhereInput = { domain: await getActiveDomain() };
  if (opts.callerId) where.callerId = opts.callerId;
  if (opts.status && opts.status !== "ALL") where.status = opts.status;
  if (opts.groupId && opts.groupId !== "ALL") where.assignmentGroupId = opts.groupId;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: { caller: true, assignee: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incident.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getIncidentById(id: string) {
  // Scoped by domain so a ticket from another tenant can't be opened by id.
  return await prisma.incident.findFirst({
    where: { id, domain: await getActiveDomain() },
    include: {
      caller: true,
      assignee: true,
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateIncidentState(id: string, status: IncidentStatus) {
  const existing = await prisma.incident.findUnique({
    where: { id },
    select: { status: true, callerId: true, number: true, title: true },
  });
  const incident = await prisma.incident.update({
    where: { id },
    data: { status },
  });

  // Record the state change on the activity timeline.
  if (existing && existing.status !== status) {
    await prisma.incidentNote.create({
      data: { incidentId: id, type: NoteType.SYSTEM, body: `State changed from ${existing.status} to ${status}.` },
    });

    // Notify the caller when their ticket is resolved or closed.
    if ((status === "RESOLVED" || status === "CLOSED") && existing.callerId) {
      await notify(existing.callerId, {
        title: `${existing.number} ${status === "RESOLVED" ? "resolved" : "closed"}`,
        body: existing.title,
        type: "RESOLUTION",
        link: `/incidents/${id}`,
      });
    }
  }

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  return incident;
}

// Add a comment or internal work note to an incident's activity timeline.
export async function addIncidentNote(incidentId: string, body: string, type: NoteType = "COMMENT") {
  const text = body?.trim();
  if (!text) throw new Error("Note cannot be empty");

  const user = await getSessionUser();
  await prisma.incidentNote.create({
    data: { incidentId, body: text, type, authorId: user?.id ?? null },
  });

  // Notify the counterpart on a public comment (caller ↔ assignee), not on
  // internal work notes.
  if (type === "COMMENT") {
    const inc = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { callerId: true, assigneeId: true, number: true },
    });
    if (inc) {
      const recipientId = user?.id === inc.callerId ? inc.assigneeId : inc.callerId;
      if (recipientId && recipientId !== user?.id) {
        await notify(recipientId, {
          title: `New comment on ${inc.number}`,
          body: text.slice(0, 120),
          type: "COMMENT",
          link: `/incidents/${incidentId}`,
        });
      }
    }
  }

  revalidatePath(`/incidents/${incidentId}`);
}

// Assign (or unassign) an incident to an agent and log it on the timeline.
export async function assignIncident(incidentId: string, assigneeId: string | null) {
  const assignee = assigneeId
    ? await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } })
    : null;

  const inc = await prisma.incident.update({
    where: { id: incidentId },
    data: { assigneeId: assigneeId || null },
    select: { number: true, title: true },
  });

  await prisma.incidentNote.create({
    data: {
      incidentId,
      type: NoteType.SYSTEM,
      body: assignee ? `Assigned to ${assignee.name}.` : "Unassigned.",
    },
  });

  // Notify the newly assigned agent.
  if (assigneeId) {
    await notify(assigneeId, {
      title: `${inc.number} assigned to you`,
      body: inc.title,
      type: "ASSIGNMENT",
      link: `/incidents/${incidentId}`,
    });
  }

  revalidatePath(`/incidents/${incidentId}`);
}

// Agents/admins available as assignees within the active tenant.
export async function getAssignableAgents() {
  return await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "IT_AGENT"] }, domain: await getActiveDomain() },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
