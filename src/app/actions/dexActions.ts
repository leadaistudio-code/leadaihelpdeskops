"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";

export type DexEndpoint = {
  deviceId: string;
  id: string; // hostname (display)
  user: string;
  cpu: string;
  mem: string;
  disk: string;
  battery: string;
  status: "Healthy" | "Warning" | "Critical";
  latency: string;
  online: boolean;
  score: number; // 0–100 experience score
};

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

// Composite 0–100 Digital Experience score: starts at 100, subtracts pressure
// penalties. Offline devices score 0.
function experienceScore(d: {
  online: boolean;
  cpuPct: number | null;
  memUsedMb: number | null;
  memTotalMb: number | null;
  diskPct: number | null;
  latencyMs: number | null;
  batteryPct: number | null;
}): number {
  if (!d.online) return 0;
  let score = 100;
  const cpu = d.cpuPct ?? 0;
  const memPct = d.memUsedMb && d.memTotalMb ? (d.memUsedMb / d.memTotalMb) * 100 : 0;
  score -= Math.max(0, cpu - 50) * 0.6;
  score -= Math.max(0, memPct - 60) * 0.5;
  score -= Math.max(0, (d.diskPct ?? 0) - 70) * 0.5;
  score -= Math.max(0, (d.latencyMs ?? 0) - 80) * 0.15;
  if (d.batteryPct != null && d.batteryPct < 20) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getDexEndpoints(): Promise<DexEndpoint[]> {
  const devices = await prisma.device.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: { lastSeenAt: "desc" },
    take: 50,
  });

  const now = Date.now();
  return devices.map((d) => {
    const online = !!d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS;
    const score = experienceScore({ online, ...d });

    let status: DexEndpoint["status"];
    if (!online) status = "Critical";
    else if (score < 55) status = "Critical";
    else if (score < 80) status = "Warning";
    else status = "Healthy";

    return {
      deviceId: d.id,
      id: d.hostname,
      user: d.user ?? "—",
      cpu: d.cpuPct != null ? `${Math.round(d.cpuPct)}%` : "—",
      mem:
        d.memUsedMb != null && d.memTotalMb != null
          ? `${(d.memUsedMb / 1024).toFixed(0)}GB/${(d.memTotalMb / 1024).toFixed(0)}GB`
          : "—",
      disk: d.diskPct != null ? `${Math.round(d.diskPct)}%` : "—",
      battery: d.batteryPct != null ? `${d.batteryPct}%` : "—",
      latency: d.latencyMs != null ? `${d.latencyMs}ms` : "—",
      status,
      online,
      score,
    };
  });
}

// Tenant-level rollup for the dashboard headline.
export async function getDexSummary() {
  const endpoints = await getDexEndpoints();
  const total = endpoints.length;
  const online = endpoints.filter((e) => e.online).length;
  const avgScore = total ? Math.round(endpoints.reduce((s, e) => s + e.score, 0) / total) : 0;
  const atRisk = endpoints.filter((e) => e.online && e.status !== "Healthy").length;
  return { total, online, avgScore, atRisk };
}

// Admin-only: queue a remediation command for the agent to pull and run.
const ALLOWED_ACTIONS = ["FLUSH_DNS", "CLEAR_TEMP", "RESTART_SPOOLER", "REBOOT"] as const;
export async function queueRemediation(deviceId: string, action: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  if (!ALLOWED_ACTIONS.includes(action as (typeof ALLOWED_ACTIONS)[number])) {
    throw new Error("Unknown action");
  }
  const domain = await getActiveDomain();
  const device = await prisma.device.findFirst({ where: { id: deviceId, domain }, select: { id: true, hostname: true } });
  if (!device) throw new Error("Device not found");

  await prisma.remoteCommand.create({ data: { deviceId, action, domain } });
  await logAudit({
    domain,
    action: "REMEDIATION",
    entityType: "Device",
    entityId: deviceId,
    entityLabel: device.hostname,
    summary: `Queued remediation: ${action}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });
  revalidatePath("/dex");
  return { ok: true };
}

// Per-tenant DEX settings (server-side self-heal toggle).
export async function getDexSettings() {
  const domain = await getActiveDomain();
  const s = await prisma.tenantSettings.findUnique({ where: { domain } });
  return { autoHeal: s?.autoHeal ?? false };
}

export async function setAutoHeal(autoHeal: boolean) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  const domain = await getActiveDomain();
  await prisma.tenantSettings.upsert({
    where: { domain },
    update: { autoHeal },
    create: { domain, autoHeal },
  });
  revalidatePath("/dex");
  return { autoHeal };
}

// Admin-only: the tenant's enrollment token (created on first request).
export async function getEnrollmentInfo() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;

  const domain = await getActiveDomain();
  let row = await prisma.enrollmentToken.findUnique({ where: { domain } });
  if (!row) {
    const token = `enr_${crypto.randomUUID().replace(/-/g, "")}`;
    row = await prisma.enrollmentToken.create({ data: { domain, token } });
  }
  return { token: row.token };
}
