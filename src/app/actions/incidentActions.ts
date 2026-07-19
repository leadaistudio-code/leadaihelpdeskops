"use server";

import prisma from "@/lib/prisma";
import { Priority, IncidentStatus, TicketType, NoteType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getSessionUser, requireAgent } from "@/lib/auth-utils";
import { getActiveDomain } from "@/lib/tenant";
import { notify, notifyGroup } from "@/app/actions/notificationActions";
import { resolveGroupByName } from "@/app/actions/groupActions";
import { startSlaForIncident, pauseSla, resumeSla, stopSla, escalateIfBreached } from "@/app/actions/slaActions";
import { logAudit } from "@/lib/audit";
import { allocateNumber, seriesForTicketType } from "@/lib/ticket-number";

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

  const domain = await getActiveDomain();

  // If no callerId provided, fall back to a user in this tenant — never an
  // unscoped findFirst, which can hand the ticket to another customer's user.
  if (!callerId) {
    const defaultUser = await prisma.user.findFirst({ where: { domain } });
    if (defaultUser) callerId = defaultUser.id;
  }

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

  const number = await allocateNumber(domain, seriesForTicketType(type));

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

  // Start the live SLA clock (no-op if the tenant has no matching SLA).
  await startSlaForIncident(incident.id, incident.type, incident.priority, domain);

  // Notify caller
  await notify(incident.callerId, {
    title: `Ticket Created: ${incident.number}`,
    body: `Your ${incident.type.toLowerCase()} "${incident.title}" has been successfully created.`,
    type: "GENERAL",
    link: `/incidents/${incident.id}`,
  });

  // Notify group if assigned
  if (incident.assignmentGroupId) {
    await notifyGroup(incident.assignmentGroupId, {
      title: `New Ticket Assigned: ${incident.number}`,
      body: incident.title,
      type: "ASSIGNMENT",
      link: `/incidents/${incident.id}`,
    });
  }

  await logAudit({
    domain,
    action: "CREATE",
    entityType: "Incident",
    entityId: incident.id,
    entityLabel: incident.number,
    summary: `Created ${incident.type === "REQUEST" ? "request" : "incident"} "${incident.title}"`,
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
      slaInstances: { orderBy: { createdAt: "desc" }, take: 1, select: { dueAt: true, stage: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Paged + filtered incident list for the main queue view.
export async function getIncidentsPaged(opts: {
  callerId?: string;
  search?: string;
  status?: IncidentStatus | "ALL";
  priority?: Priority | "ALL";
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
  if (opts.priority && opts.priority !== "ALL") where.priority = opts.priority;
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
      include: {
        caller: true,
        assignee: true,
        slaInstances: { orderBy: { createdAt: "desc" }, take: 1, select: { dueAt: true, stage: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incident.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getIncidentById(id: string) {
  const domain = await getActiveDomain();
  const user = await getSessionUser();
  const isAgent = user?.role === "ADMIN" || user?.role === "IT_AGENT";

  // Lazily detect + escalate an SLA breach when the ticket is opened.
  await escalateIfBreached(id);

  // Scoped by domain so a ticket from another tenant can't be opened by id, and
  // by caller so an employee can only open a ticket they raised.
  return await prisma.incident.findFirst({
    where: { id, domain, ...(isAgent ? {} : { callerId: user?.id ?? "" }) },
    include: {
      caller: true,
      assignee: true,
      slaInstances: { orderBy: { createdAt: "desc" }, take: 1 },
      problem: { select: { id: true, number: true, title: true, status: true } },
      notes: {
        // Internal work notes are staff-only.
        ...(isAgent ? {} : { where: { type: { not: NoteType.WORK_NOTE } } }),
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateIncidentState(id: string, status: IncidentStatus) {
  await requireAgent();
  const domain = await getActiveDomain();

  const existing = await prisma.incident.findFirst({
    where: { id, domain },
    select: { status: true, callerId: true, number: true, title: true, domain: true },
  });
  if (!existing) throw new Error("Incident not found");

  // Scope the write itself, not just the read above, so a ticket that moves
  // tenants between the two queries can't still be written.
  const incident = await prisma.incident.update({
    where: { id, domain },
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

    // Live SLA clock transitions.
    if (status === "RESOLVED" || status === "CLOSED") await stopSla(id);
    else if (status === "ON_HOLD") await pauseSla(id);
    else if (existing.status === "ON_HOLD") await resumeSla(id);

    await logAudit({
      domain: existing.domain,
      action: "STATE_CHANGE",
      entityType: "Incident",
      entityId: id,
      entityLabel: existing.number,
      summary: `State changed ${existing.status} → ${status}`,
      field: "status",
      oldValue: existing.status,
      newValue: status,
    });
  }

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  return incident;
}

// Add a comment or internal work note to an incident's activity timeline.
export async function addIncidentNote(incidentId: string, body: string, type: NoteType = "COMMENT") {
  const text = body?.trim();
  if (!text) throw new Error("Note cannot be empty");

  // SYSTEM entries are written by the timeline itself; accepting one here would
  // let a caller forge an audit-looking entry.
  if (type !== "COMMENT" && type !== "WORK_NOTE") throw new Error("Invalid note type");

  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  const domain = await getActiveDomain();

  const inc = await prisma.incident.findFirst({
    where: { id: incidentId, domain },
    select: { callerId: true, assigneeId: true, number: true },
  });
  if (!inc) throw new Error("Incident not found");

  const isAgent = user.role === "ADMIN" || user.role === "IT_AGENT";
  // Internal work notes are staff-only; an employee may comment, but only on a
  // ticket they raised.
  if (type === "WORK_NOTE" && !isAgent) throw new Error("Not authorized");
  if (!isAgent && inc.callerId !== user.id) throw new Error("Not authorized");

  await prisma.incidentNote.create({
    data: { incidentId, body: text, type, authorId: user.id },
  });

  // Notify the counterpart on a public comment (caller ↔ assignee), not on
  // internal work notes.
  if (type === "COMMENT") {
    const recipientId = user.id === inc.callerId ? inc.assigneeId : inc.callerId;
    if (recipientId && recipientId !== user.id) {
      await notify(recipientId, {
        title: `New comment on ${inc.number}`,
        body: text.slice(0, 120),
        type: "COMMENT",
        link: `/incidents/${incidentId}`,
      });
    }
  }

  revalidatePath(`/incidents/${incidentId}`);
}

// Assign (or unassign) an incident to an agent and log it on the timeline.
export async function assignIncident(incidentId: string, assigneeId: string | null) {
  await requireAgent();
  const domain = await getActiveDomain();

  // The assignee must be IT staff in the caller's own tenant — otherwise a
  // ticket could be parked on a user who can never see it.
  const assignee = assigneeId
    ? await prisma.user.findFirst({
        where: { id: assigneeId, domain, role: { in: ["ADMIN", "IT_AGENT"] } },
        select: { name: true },
      })
    : null;
  if (assigneeId && !assignee) throw new Error("Assignee is not an agent in this tenant");

  const inc = await prisma.incident.update({
    where: { id: incidentId, domain },
    data: { assigneeId: assigneeId || null },
    select: { number: true, title: true, domain: true },
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

  await logAudit({
    domain: inc.domain,
    action: "ASSIGN",
    entityType: "Incident",
    entityId: incidentId,
    entityLabel: inc.number,
    summary: assignee ? `Assigned to ${assignee.name}` : "Unassigned",
  });

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
