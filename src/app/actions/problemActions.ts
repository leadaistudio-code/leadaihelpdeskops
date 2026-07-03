"use server";

import prisma from "@/lib/prisma";
import { ProblemStatus, Priority, NoteType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";

async function nextProblemNumber(domain: string) {
  // Per-tenant sequence (domain-scoped count) — avoids cross-tenant leakage.
  const count = await prisma.problem.count({ where: { domain } });
  return `PRB${String(count + 1).padStart(7, "0")}`;
}

export async function getProblems(opts?: { status?: ProblemStatus | "ALL"; search?: string }) {
  const domain = await getActiveDomain();
  const where: Prisma.ProblemWhereInput = { domain };
  if (opts?.status && opts.status !== "ALL") where.status = opts.status;
  const s = opts?.search?.trim();
  if (s) {
    where.OR = [
      { number: { contains: s, mode: "insensitive" } },
      { title: { contains: s, mode: "insensitive" } },
    ];
  }
  return prisma.problem.findMany({
    where,
    include: {
      assignee: { select: { name: true } },
      _count: { select: { incidents: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProblemById(id: string) {
  return prisma.problem.findFirst({
    where: { id, domain: await getActiveDomain() },
    include: {
      assignee: { select: { id: true, name: true } },
      incidents: {
        select: { id: true, number: true, title: true, status: true, priority: true },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createProblem(data: { title: string; description: string; priority?: Priority }) {
  const domain = await getActiveDomain();
  const user = await getSessionUser();
  const problem = await prisma.problem.create({
    data: {
      number: await nextProblemNumber(domain),
      title: data.title,
      description: data.description,
      priority: data.priority ?? "MEDIUM",
      assigneeId: user?.id ?? null,
      domain,
    },
  });
  await logAudit({ domain, action: "CREATE", entityType: "Problem", entityId: problem.id, entityLabel: problem.number, summary: `Created problem "${problem.title}"` });
  revalidatePath("/problems");
  return problem;
}

// Open a Problem straight from a recurring incident and link them.
export async function createProblemFromIncident(incidentId: string) {
  const domain = await getActiveDomain();
  const inc = await prisma.incident.findFirst({
    where: { id: incidentId, domain },
    select: { id: true, title: true, description: true, priority: true },
  });
  if (!inc) throw new Error("Incident not found");
  const user = await getSessionUser();
  const problem = await prisma.problem.create({
    data: {
      number: await nextProblemNumber(domain),
      title: inc.title,
      description: `Problem investigation opened from an incident.\n\n${inc.description}`,
      priority: inc.priority,
      status: "INVESTIGATING",
      assigneeId: user?.id ?? null,
      domain,
      incidents: { connect: { id: inc.id } },
    },
  });
  await prisma.incidentNote.create({
    data: { incidentId, type: NoteType.SYSTEM, body: `Linked to problem ${problem.number}.` },
  });
  await logAudit({ domain, action: "CREATE", entityType: "Problem", entityId: problem.id, entityLabel: problem.number, summary: `Opened problem from an incident` });
  revalidatePath("/problems");
  revalidatePath(`/incidents/${incidentId}`);
  return problem;
}

export async function linkIncidentToProblem(problemId: string, incidentId: string) {
  const domain = await getActiveDomain();
  const [p, inc] = await Promise.all([
    prisma.problem.findFirst({ where: { id: problemId, domain }, select: { number: true } }),
    prisma.incident.findFirst({ where: { id: incidentId, domain }, select: { id: true } }),
  ]);
  if (!p || !inc) throw new Error("Not found");
  await prisma.incident.update({ where: { id: incidentId }, data: { problemId } });
  await prisma.incidentNote.create({
    data: { incidentId, type: NoteType.SYSTEM, body: `Linked to problem ${p.number}.` },
  });
  await logAudit({ domain, action: "LINK", entityType: "Problem", entityId: problemId, entityLabel: p.number, summary: `Linked an incident to this problem` });
  revalidatePath(`/problems/${problemId}`);
  revalidatePath(`/incidents/${incidentId}`);
}

export async function unlinkIncidentFromProblem(incidentId: string) {
  const domain = await getActiveDomain();
  const inc = await prisma.incident.findFirst({ where: { id: incidentId, domain }, select: { problemId: true } });
  if (!inc?.problemId) return;
  const problemId = inc.problemId;
  await prisma.incident.update({ where: { id: incidentId }, data: { problemId: null } });
  await logAudit({ domain, action: "UNLINK", entityType: "Incident", entityId: incidentId, summary: `Unlinked from a problem` });
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath(`/problems/${problemId}`);
}

export async function updateProblemState(id: string, status: ProblemStatus) {
  const domain = await getActiveDomain();
  const p = await prisma.problem.findFirst({ where: { id, domain }, select: { status: true, number: true } });
  if (!p) throw new Error("Not found");
  await prisma.problem.update({
    where: { id },
    data: {
      status,
      knownError: status === "KNOWN_ERROR" ? true : undefined,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });
  if (p.status !== status) {
    await prisma.problemNote.create({
      data: { problemId: id, type: NoteType.SYSTEM, body: `State changed from ${p.status} to ${status}.` },
    });
    await logAudit({ domain, action: "STATE_CHANGE", entityType: "Problem", entityId: id, entityLabel: p.number, summary: `State changed ${p.status} → ${status}`, field: "status", oldValue: p.status, newValue: status });
  }
  revalidatePath(`/problems/${id}`);
  revalidatePath("/problems");
}

export async function updateProblemDetails(
  id: string,
  data: { rootCause?: string; workaround?: string; priority?: Priority }
) {
  const domain = await getActiveDomain();
  const p = await prisma.problem.findFirst({ where: { id, domain }, select: { id: true } });
  if (!p) throw new Error("Not found");
  await prisma.problem.update({
    where: { id },
    data: {
      // Only touch fields that were actually provided (partial update).
      ...(data.rootCause !== undefined ? { rootCause: data.rootCause.trim() || null } : {}),
      ...(data.workaround !== undefined ? { workaround: data.workaround.trim() || null } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
    },
  });
  revalidatePath(`/problems/${id}`);
}

export async function addProblemNote(problemId: string, body: string, type: NoteType = "COMMENT") {
  const text = body?.trim();
  if (!text) return;
  const user = await getSessionUser();
  await prisma.problemNote.create({
    data: { problemId, body: text, type, authorId: user?.id ?? null },
  });
  revalidatePath(`/problems/${problemId}`);
}

// Open incidents (in this tenant) not already attached to a problem.
export async function getLinkableIncidents() {
  const domain = await getActiveDomain();
  return prisma.incident.findMany({
    where: { domain, problemId: null, status: { notIn: ["CLOSED"] } },
    select: { id: true, number: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Open problems (in this tenant) an incident can be linked to.
export async function getLinkableProblems() {
  const domain = await getActiveDomain();
  return prisma.problem.findMany({
    where: { domain, status: { notIn: ["CLOSED", "RESOLVED"] } },
    select: { id: true, number: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
