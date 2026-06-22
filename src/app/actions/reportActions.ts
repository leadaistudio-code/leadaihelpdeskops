"use server";

import prisma from "@/lib/prisma";
import { getActiveDomain } from "@/lib/tenant";

export type ReportMetrics = {
  // headline KPIs
  mttrHours: number; // mean time to resolution across resolved/closed incidents
  slaAdherence: number; // % of resolved incidents within their SLA target
  backlog: number; // open (not resolved/closed) incidents
  totalIncidents: number;
  resolvedCount: number;
  // chart series
  volumeByDay: { date: string; incidents: number; requests: number }[];
  statusBreakdown: { name: string; value: number }[];
  priorityBreakdown: { name: string; value: number }[];
  assetHealth: { name: string; value: number }[];
  slaByPriority: { category: string; met: number; breached: number }[];
};

const OPEN_STATUSES = ["NEW", "IN_PROGRESS", "ON_HOLD", "PENDING_APPROVAL"];
const CLOSED_STATUSES = ["RESOLVED", "CLOSED"];

// Fallback SLA targets (hours) by priority when no SlaDefinition rows exist.
const DEFAULT_SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

function dayKey(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getReportMetrics(): Promise<ReportMetrics> {
  const domain = await getActiveDomain();
  const [incidents, assets, slaDefs] = await Promise.all([
    prisma.incident.findMany({
      where: { domain },
      select: { status: true, priority: true, type: true, createdAt: true, updatedAt: true },
    }),
    prisma.asset.findMany({ where: { domain }, select: { status: true } }),
    prisma.slaDefinition.findMany({ where: { isActive: true, domain } }),
  ]);

  // Resolve SLA targets: prefer configured definitions, else sensible defaults.
  const slaTarget: Record<string, number> = { ...DEFAULT_SLA_HOURS };
  for (const def of slaDefs) {
    slaTarget[def.priority] = def.durationHours;
  }

  const resolved = incidents.filter((i) => CLOSED_STATUSES.includes(i.status));
  const backlog = incidents.filter((i) => OPEN_STATUSES.includes(i.status)).length;

  // MTTR — average resolution time in hours (createdAt -> updatedAt for closed).
  const resolutionHours = resolved.map(
    (i) => (i.updatedAt.getTime() - i.createdAt.getTime()) / 36e5
  );
  const mttrHours = resolutionHours.length
    ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
    : 0;

  // SLA adherence — share of resolved incidents closed within their target.
  let metCount = 0;
  const slaByPriorityMap: Record<string, { met: number; breached: number }> = {
    CRITICAL: { met: 0, breached: 0 },
    HIGH: { met: 0, breached: 0 },
    MEDIUM: { met: 0, breached: 0 },
    LOW: { met: 0, breached: 0 },
  };
  for (const i of resolved) {
    const hrs = (i.updatedAt.getTime() - i.createdAt.getTime()) / 36e5;
    const target = slaTarget[i.priority] ?? 24;
    const bucket = slaByPriorityMap[i.priority] ?? (slaByPriorityMap[i.priority] = { met: 0, breached: 0 });
    if (hrs <= target) {
      metCount++;
      bucket.met++;
    } else {
      bucket.breached++;
    }
  }
  const slaAdherence = resolved.length ? (metCount / resolved.length) * 100 : 0;

  // Volume over the last 14 days, split by ticket type.
  const days: { date: string; incidents: number; requests: number }[] = [];
  const now = new Date();
  for (let n = 13; n >= 0; n--) {
    const d = new Date(now);
    d.setDate(now.getDate() - n);
    days.push({ date: dayKey(d), incidents: 0, requests: 0 });
  }
  const dayIndex = new Map(days.map((d, idx) => [d.date, idx]));
  for (const i of incidents) {
    const idx = dayIndex.get(dayKey(i.createdAt));
    if (idx === undefined) continue;
    if (i.type === "REQUEST") days[idx].requests++;
    else days[idx].incidents++;
  }

  // Status & priority distributions.
  const countBy = (arr: { status?: string; priority?: string }[], key: "status" | "priority") => {
    const m: Record<string, number> = {};
    for (const it of arr) {
      const k = (it as Record<string, string>)[key];
      m[k] = (m[k] ?? 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  };

  const assetHealthMap: Record<string, number> = {};
  for (const a of assets) assetHealthMap[a.status] = (assetHealthMap[a.status] ?? 0) + 1;

  return {
    mttrHours: Math.round(mttrHours * 10) / 10,
    slaAdherence: Math.round(slaAdherence * 10) / 10,
    backlog,
    totalIncidents: incidents.length,
    resolvedCount: resolved.length,
    volumeByDay: days,
    statusBreakdown: countBy(incidents, "status"),
    priorityBreakdown: countBy(incidents, "priority"),
    assetHealth: Object.entries(assetHealthMap).map(([name, value]) => ({ name, value })),
    slaByPriority: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => ({
      category: p,
      met: slaByPriorityMap[p]?.met ?? 0,
      breached: slaByPriorityMap[p]?.breached ?? 0,
    })),
  };
}
