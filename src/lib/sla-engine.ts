import prisma from "@/lib/prisma";
import { TicketType, Priority, NoteType } from "@prisma/client";
import { dueDate, elapsedMs, addBusinessMs, type Schedule } from "@/lib/business-hours";
import { notify } from "@/app/actions/notificationActions";
import { logAudit } from "@/lib/audit";

// The SLA clock engine.
//
// This lives in `lib/`, not in `actions/`, deliberately. It previously sat in
// `slaActions.ts`, which carries a top-level `"use server"` — meaning every
// export in it, including these, was a public HTTP endpoint. Anyone could call
// `stopSla(someIncidentId)` to mark another tenant's clocks MET, or
// `startSlaForIncident(...)` naming an arbitrary domain. None of these functions
// take a session and none of them can authorize a caller, so none of them may be
// reachable from the network. Callers are server components and other server
// actions that have already established who is asking.

// Attach the applicable SLA to a new incident and compute its effective due
// time. No-op if the tenant hasn't defined a matching SLA. Best-effort.
export async function startSlaForIncident(
  incidentId: string,
  type: TicketType,
  priority: Priority,
  domain: string
) {
  try {
    const def = await prisma.slaDefinition.findFirst({
      where: { domain, type, priority, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!def) return null;
    const start = new Date();
    return await prisma.slaInstance.create({
      data: {
        incidentId,
        slaDefinitionId: def.id,
        name: def.name,
        targetHours: def.durationHours,
        schedule: def.schedule,
        startAt: start,
        dueAt: dueDate(start, def.durationHours, def.schedule as Schedule),
        stage: "IN_PROGRESS",
        domain,
      },
    });
  } catch (e) {
    console.error("startSlaForIncident failed:", e);
    return null;
  }
}

// Backfill an SLA clock for an open incident that predates this engine
// (anchored at the incident's creation time), so live SLAs appear on tickets
// created before SLAs were configured.
export async function ensureSlaForIncident(inc: {
  id: string;
  type: TicketType;
  priority: Priority;
  domain: string;
  createdAt: Date;
}) {
  const existing = await prisma.slaInstance.findFirst({ where: { incidentId: inc.id } });
  if (existing) return existing;
  const def = await prisma.slaDefinition.findFirst({
    where: { domain: inc.domain, type: inc.type, priority: inc.priority, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!def) return null;
  return prisma.slaInstance.create({
    data: {
      incidentId: inc.id,
      slaDefinitionId: def.id,
      name: def.name,
      targetHours: def.durationHours,
      schedule: def.schedule,
      startAt: inc.createdAt,
      dueAt: dueDate(inc.createdAt, def.durationHours, def.schedule as Schedule),
      stage: "IN_PROGRESS",
      domain: inc.domain,
    },
  });
}

// Pause running clocks when a ticket goes ON_HOLD.
export async function pauseSla(incidentId: string) {
  const now = new Date();
  const running = await prisma.slaInstance.findMany({ where: { incidentId, stage: "IN_PROGRESS" } });
  for (const s of running) {
    await prisma.slaInstance.update({ where: { id: s.id }, data: { stage: "PAUSED", pausedAt: now } });
  }
}

// Resume paused clocks, pushing the deadline out by the time spent on hold so
// the remaining (business) time is preserved.
export async function resumeSla(incidentId: string) {
  const now = new Date();
  const paused = await prisma.slaInstance.findMany({ where: { incidentId, stage: "PAUSED" } });
  for (const s of paused) {
    if (!s.pausedAt) continue;
    const consumed = elapsedMs(s.pausedAt, now, s.schedule as Schedule);
    const newDue =
      s.schedule === "BUSINESS"
        ? addBusinessMs(s.dueAt, consumed)
        : new Date(s.dueAt.getTime() + consumed);
    await prisma.slaInstance.update({
      where: { id: s.id },
      data: { stage: "IN_PROGRESS", pausedAt: null, pausedMs: s.pausedMs + consumed, dueAt: newDue },
    });
  }
}

// Stop clocks when a ticket is resolved/closed; mark MET or BREACHED.
export async function stopSla(incidentId: string) {
  const now = new Date();
  const open = await prisma.slaInstance.findMany({
    where: { incidentId, stage: { in: ["IN_PROGRESS", "PAUSED"] } },
  });
  for (const s of open) {
    let due = s.dueAt;
    if (s.stage === "PAUSED" && s.pausedAt) {
      const consumed = elapsedMs(s.pausedAt, now, s.schedule as Schedule);
      due = s.schedule === "BUSINESS" ? addBusinessMs(s.dueAt, consumed) : new Date(s.dueAt.getTime() + consumed);
    }
    const met = now.getTime() <= due.getTime();
    await prisma.slaInstance.update({
      where: { id: s.id },
      data: {
        stage: met ? "MET" : "BREACHED",
        stoppedAt: now,
        breachedAt: met ? null : s.breachedAt ?? due,
        dueAt: due,
        pausedAt: null,
      },
    });
  }
}

// Lazy breach detection for one incident: mark overdue clocks BREACHED, log a
// system note, and escalate to the assignee + assignment group. Idempotent via
// `escalatedAt`. Called when the incident is viewed.
export async function escalateIfBreached(incidentId: string) {
  const now = new Date();
  const overdue = await prisma.slaInstance.findMany({
    where: { incidentId, stage: "IN_PROGRESS", dueAt: { lt: now }, escalatedAt: null },
  });
  if (overdue.length === 0) return;

  const inc = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { number: true, title: true, assigneeId: true, assignmentGroupId: true, domain: true },
  });

  for (const s of overdue) {
    await prisma.slaInstance.update({
      where: { id: s.id },
      data: { stage: "BREACHED", breachedAt: s.dueAt, escalatedAt: now },
    });
    await prisma.incidentNote.create({
      data: {
        incidentId,
        type: NoteType.SYSTEM,
        body: `SLA "${s.name}" breached — target was ${s.dueAt.toUTCString()}.`,
      },
    });
    await logAudit({
      domain: inc?.domain ?? s.domain,
      action: "SLA_BREACH",
      entityType: "Incident",
      entityId: incidentId,
      entityLabel: inc?.number,
      summary: `SLA "${s.name}" breached`,
      actor: null,
    });
    if (!inc) continue;

    const targets = new Set<string>();
    if (inc.assigneeId) targets.add(inc.assigneeId);
    if (inc.assignmentGroupId) {
      const grp = await prisma.assignmentGroup.findUnique({
        where: { id: inc.assignmentGroupId },
        select: { members: { select: { id: true } } },
      });
      grp?.members.forEach((m) => targets.add(m.id));
    }
    for (const uid of targets) {
      await notify(uid, {
        title: `⚠ SLA breached: ${inc.number}`,
        body: inc.title,
        type: "GENERAL",
        link: `/incidents/${incidentId}`,
      });
    }
  }
}

// Domain-agnostic breach sweep for a scheduler (cron). Escalates overdue clocks
// across every tenant without needing a user session — which is exactly why it
// must not be reachable as a server action. `/api/sla/sweep` is its only entry
// point, and that route authenticates the scheduler with CRON_SECRET.
export async function sweepAllSlaBreaches() {
  const now = new Date();
  const overdue = await prisma.slaInstance.findMany({
    where: { stage: "IN_PROGRESS", dueAt: { lt: now }, escalatedAt: null },
    select: { incidentId: true },
    distinct: ["incidentId"],
  });
  for (const o of overdue) await escalateIfBreached(o.incidentId);
  return overdue.length;
}

export async function getSlaForIncident(incidentId: string) {
  return prisma.slaInstance.findFirst({ where: { incidentId }, orderBy: { createdAt: "desc" } });
}
