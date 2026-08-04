"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser, requireAgent } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { predictForDevice } from "@/lib/hardware-prediction";
import { OPTIONS_LIMIT } from "@/lib/query-limits";
import {
  bucketLatencyByHour,
  minutesSaved,
  bootBand,
  wifiBand,
  packetLossBand,
  median,
  percentile,
} from "@/lib/dex-metrics";
import {
  newEnrollmentTokenValue,
  tokenState,
  type EnrollmentTokenState,
  DEFAULT_ENROLLMENT_TTL_HOURS,
  MAX_ENROLLMENT_TTL_HOURS,
} from "@/lib/enrollment";

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
  ownerId: string | null; // authoritative app-user owner, if assigned
  ownerName: string | null;
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

// NOTE: `seedDemoData()` was removed from this module.
//
// It ran on every `getDexSummary()` call and, for any tenant whose tables were
// still empty, inserted fabricated app crashes, fabricated software-usage
// records, a fabricated **security posture** (bitlocker: false), and a
// fabricated automation rule with a made-up trigger count. A real customer's
// first login silently populated their security posture with fiction — data
// they would then act on, or show an auditor. A demo fixture must never run on
// a request path in production. If a populated demo tenant is needed, seed it
// deliberately from `scripts/` against a known demo domain.

export async function getDexEndpoints(): Promise<DexEndpoint[]> {
  const devices = await prisma.device.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: { lastSeenAt: "desc" },
    take: 50,
    include: { owner: { select: { id: true, name: true } } },
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
      ownerId: d.ownerId,
      ownerName: d.owner?.name ?? null,
    };
  });
}

// Users in the active tenant, for the device-owner picker. Any user can own a
// device (employees included), so this is not limited to agents.
export async function getTenantUsers() {
  return prisma.user.findMany({
    where: { domain: await getActiveDomain() },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: OPTIONS_LIMIT,
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

// Assign (or clear) the app-user owner of a device. Authoritative link used by
// "my device health" — takes precedence over the enrollment name-match.
export async function assignDeviceOwner(deviceId: string, ownerId: string | null) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  const domain = await getActiveDomain();

  // The owner must be a user in the same tenant — never link across tenants.
  if (ownerId) {
    const owner = await prisma.user.findFirst({ where: { id: ownerId, domain }, select: { id: true } });
    if (!owner) throw new Error("User is not in this tenant");
  }

  // Scope the write by domain so a device from another tenant can't be touched.
  const res = await prisma.device.updateMany({
    where: { id: deviceId, domain },
    data: { ownerId },
  });
  if (res.count === 0) throw new Error("Device not found");

  revalidatePath("/dex");
  return { ok: true };
}

// NOTE: `queueAgenticRemediation`, `generateGlobalAgenticScript` and
// `deployGlobalAgenticScript` were removed deliberately.
//
// They asked an LLM to write PowerShell and queued it as `RUN_SCRIPT: <text>`
// for the agent to execute verbatim. Two problems, either of which is fatal:
// a server action is a public HTTP endpoint, so the deploy step could be called
// directly with any script, skipping generation and its safety check entirely;
// and the "safety check" was the same model grading its own output, which is a
// suggestion, not a control. The agent no longer honours `RUN_SCRIPT:` at all
// (see agent-go/remediate.go), so these only ever queued commands that would be
// refused. Remediation is now limited to the named runbook actions below.

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

// ---------------------------------------------------------------------------
// Enrollment tokens (admin)
// ---------------------------------------------------------------------------
//
// These replace `getEnrollmentInfo()`, which lazily minted one permanent,
// unrevocable token per tenant on first read and returned it to anyone who
// asked. A token is a capability to add a device to the fleet — and enrolled
// devices receive remediation commands — so issuing one is now an explicit,
// audited, expiring act.

export type EnrollmentTokenView = {
  id: string;
  // Only ever populated for a token at the moment it is issued. Existing tokens
  // list as a masked stub: the value is a bearer secret, and re-serving it on
  // every page load is how it ends up in screenshots and browser caches.
  token: string | null;
  tokenHint: string;
  label: string | null;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  state: EnrollmentTokenState;
  lastUsedAt: string | null;
  createdAt: string;
};

function toTokenView(row: {
  id: string;
  token: string;
  label: string | null;
  expiresAt: Date;
  maxUses: number;
  useCount: number;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}, reveal = false): EnrollmentTokenView {
  return {
    id: row.id,
    token: reveal ? row.token : null,
    tokenHint: `${row.token.slice(0, 8)}…${row.token.slice(-4)}`,
    label: row.label,
    expiresAt: row.expiresAt.toISOString(),
    maxUses: row.maxUses,
    useCount: row.useCount,
    state: tokenState(row),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listEnrollmentTokens(): Promise<EnrollmentTokenView[]> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return [];

  const rows = await prisma.enrollmentToken.findMany({
    where: { domain: await getActiveDomain() },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((r) => toTokenView(r));
}

export async function issueEnrollmentToken(opts?: {
  label?: string;
  ttlHours?: number;
  maxUses?: number;
}): Promise<EnrollmentTokenView | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");

  const domain = await getActiveDomain();
  const ttlHours = Math.min(
    MAX_ENROLLMENT_TTL_HOURS,
    Math.max(1, Math.floor(opts?.ttlHours ?? DEFAULT_ENROLLMENT_TTL_HOURS))
  );
  // Cap the batch size. An unbounded `maxUses` is just the old permanent token
  // wearing a different hat.
  const maxUses = Math.min(500, Math.max(1, Math.floor(opts?.maxUses ?? 1)));

  const row = await prisma.enrollmentToken.create({
    data: {
      domain,
      token: newEnrollmentTokenValue(),
      label: opts?.label?.trim() || null,
      expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
      maxUses,
      createdById: user.id,
    },
  });

  await logAudit({
    domain,
    action: "CREATE",
    entityType: "EnrollmentToken",
    entityId: row.id,
    entityLabel: row.label ?? row.token.slice(0, 8),
    summary: `Enrollment token issued — valid ${ttlHours}h, ${maxUses} use${maxUses === 1 ? "" : "s"}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });

  revalidatePath("/dex");
  // Revealed exactly once, here.
  return toTokenView(row, true);
}

export async function revokeEnrollmentToken(id: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");

  const domain = await getActiveDomain();
  const res = await prisma.enrollmentToken.updateMany({
    where: { id, domain, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (res.count === 0) throw new Error("Enrollment token not found");

  await logAudit({
    domain,
    action: "DELETE",
    entityType: "EnrollmentToken",
    entityId: id,
    summary: "Enrollment token revoked",
    actor: { id: user.id, name: user.name, email: user.email },
  });

  revalidatePath("/dex");
}

// App-DEX: Application Reliability Analytics
export async function getAppCrashStats() {
  const domain = await getActiveDomain();
  
  const crashes = await prisma.appCrashEvent.groupBy({
    by: ['appName', 'appVersion', 'eventType'],
    where: { domain },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  return crashes.map(c => ({
    appName: c.appName,
    appVersion: c.appVersion ?? "Unknown",
    eventType: c.eventType,
    count: c._count.id,
  }));
}

export async function getRecentCrashes() {
  const domain = await getActiveDomain();
  
  const crashes = await prisma.appCrashEvent.findMany({
    where: { domain },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      device: { select: { hostname: true } }
    }
  });

  return crashes.map(c => ({
    id: c.id,
    device: c.device.hostname,
    appName: c.appName,
    appVersion: c.appVersion ?? "Unknown",
    eventType: c.eventType,
    time: c.createdAt.toISOString(),
  }));
}

// FinOps & Licensing
export async function getSoftwareUsageStats() {
  const domain = await getActiveDomain();
  return prisma.softwareUsage.findMany({
    where: { domain },
    orderBy: { foregroundMinutes: 'desc' },
    take: 10,
    include: { device: { select: { hostname: true, persona: true } } }
  });
}

const SAAS_PRICING: Record<string, number> = {
  "slack": 15,
  "figma": 15,
  "notion": 10,
  "zoom": 15,
  "excel": 12,
  "ms-teams": 12,
  "salesforce": 150,
  "adobe": 55,
};

export async function getShadowItSavings() {
  const domain = await getActiveDomain();
  
  // For the demo, anything not used in the last 72 hours is considered "unused"
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const usages = await prisma.softwareUsage.findMany({
    where: { domain },
    include: { device: { select: { hostname: true, user: true } } }
  });

  let totalSavings = 0;
  const unusedLicenses = [];
  const activeLicenses = [];

  for (const usage of usages) {
    const nameLower = usage.softwareName.toLowerCase();
    
    // Check if it's a paid SaaS we track
    let monthlyCost = 0;
    for (const [key, cost] of Object.entries(SAAS_PRICING)) {
      if (nameLower.includes(key)) {
        monthlyCost = cost;
        break;
      }
    }
    
    const isUnused = !usage.lastUsedAt || usage.lastUsedAt < cutoff;
    
    const licenseData = {
      id: usage.id,
      device: usage.device.hostname,
      user: usage.device.user || "Unknown",
      software: usage.softwareName,
      cost: monthlyCost,
      lastUsedAt: usage.lastUsedAt
    };

    if (monthlyCost > 0 && isUnused) {
      totalSavings += monthlyCost;
      unusedLicenses.push(licenseData);
    } else {
      // Anything actively being used (or unpriced) goes to active
      activeLicenses.push(licenseData);
    }
  }

  unusedLicenses.sort((a, b) => b.cost - a.cost);
  activeLicenses.sort((a, b) => (b.lastUsedAt?.getTime() || 0) - (a.lastUsedAt?.getTime() || 0));

  return {
    totalSavings,
    unusedLicenses,
    activeLicenses
  };
}

// Security & Compliance
export async function getSecurityPostures() {
  const domain = await getActiveDomain();
  return prisma.securityPosture.findMany({
    where: { domain },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { device: { select: { hostname: true, user: true } } }
  });
}

// Remediation Campaigns
export async function getRemediationCampaigns() {
  const domain = await getActiveDomain();
  return prisma.remediationCampaign.findMany({
    where: { domain },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRemediationCampaign(name: string, action: string, targetCriteria: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  
  const domain = await getActiveDomain();
  
  const allDevices = await prisma.device.findMany({
    where: { domain },
    select: { id: true, deviceKey: true }
  });
  
  let targetDevices = allDevices;
  if (targetCriteria === "FIREWALL_OFF") {
    const badPostures = await prisma.securityPosture.findMany({
      where: { domain, firewallActive: false },
      select: { deviceId: true }
    });
    const badIds = new Set(badPostures.map(p => p.deviceId));
    targetDevices = allDevices.filter(d => badIds.has(d.id));
  } else if (targetCriteria === "BITLOCKER_OFF") {
    const badPostures = await prisma.securityPosture.findMany({
      where: { domain, bitlockerActive: false },
      select: { deviceId: true }
    });
    const badIds = new Set(badPostures.map(p => p.deviceId));
    targetDevices = allDevices.filter(d => badIds.has(d.id));
  }
  
  const campaign = await prisma.remediationCampaign.create({
    data: {
      name,
      runbook: action,
      targetCriteria,
      status: "RUNNING",
      totalTargeted: targetDevices.length,
      successCount: 0,
      domain
    }
  });

  if (targetDevices.length > 0) {
    await prisma.remoteCommand.createMany({
      data: targetDevices.map(d => ({
        deviceId: d.id,
        action,
        domain
      }))
    });
  }
  
  revalidatePath("/dex");
  return campaign;
}

// Predictive Burnout
export async function getBurnoutRisks() {
  const domain = await getActiveDomain();
  const endpoints = await getDexEndpoints();
  
  const recentCrashes = await prisma.appCrashEvent.groupBy({
    by: ['deviceId'],
    where: { domain },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } }
  });
  
  const crashMap = new Map(recentCrashes.map(c => [c.deviceId, c._count.id]));
  const risks = [];
  
  for (const ep of endpoints) {
    if (ep.user === "—") continue;
    
    let isRisk = false;
    let reason = "";
    const crashCount = crashMap.get(ep.deviceId) || 0;
    
    if (ep.score < 65) {
      isRisk = true;
      reason = `Chronically poor hardware performance (Score: ${ep.score})`;
    } else if (crashCount > 1) {
      isRisk = true;
      reason = `Experienced ${crashCount} app crashes recently`;
    }
    
    if (isRisk) {
      risks.push({
        deviceId: ep.deviceId,
        user: ep.user,
        hostname: ep.id,
        score: ep.score,
        reason,
        riskLevel: ep.score < 50 ? "CRITICAL" : "HIGH"
      });
    }
  }
  
  return risks;
}

// Smart Contracts
export async function getSmartContracts() {
  const domain = await getActiveDomain();
  return prisma.smartContract.findMany({
    where: { domain },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createSmartContract(name: string, metric: string, operator: string, threshold: number, action: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  
  const domain = await getActiveDomain();
  const sc = await prisma.smartContract.create({
    data: { name, metric, operator, threshold, action, domain }
  });
  revalidatePath("/dex");
  return sc;
}

// SmartContract rows are if-metric-then-action rules that automatically queue
// remediation commands to endpoints. A role check alone is not enough here: the
// write must also carry the tenant, or a valid user of one tenant can flip or
// delete the automation governing another tenant's machines.
export async function toggleSmartContract(id: string, isActive: boolean) {
  await requireAgent();
  const domain = await getActiveDomain();

  const res = await prisma.smartContract.updateMany({ where: { id, domain }, data: { isActive } });
  if (res.count === 0) throw new Error("Smart contract not found");

  revalidatePath("/dex");
  return await prisma.smartContract.findFirst({ where: { id, domain } });
}

export async function deleteSmartContract(id: string) {
  await requireAgent();
  const domain = await getActiveDomain();

  const res = await prisma.smartContract.deleteMany({ where: { id, domain } });
  if (res.count === 0) throw new Error("Smart contract not found");

  revalidatePath("/dex");
  return { ok: true };
}

// Recompute hardware predictions for a tenant from its real DeviceMetric
// series. Replaces the old hardcoded 0.85/0.95 seeds. Idempotent: it clears the
// tenant's rows and re-derives them, so a device that is now healthy loses its
// stale warning instead of keeping a fabricated one forever.
//
// Bounded lookback so a long-lived device doesn't pull its entire history.
const PREDICTION_LOOKBACK_DAYS = 45;
const PREDICTION_MAX_SAMPLES = 500;
// Recomputing costs one query per device. Cap the fleet size a single pass will
// walk so this cannot become an unbounded fan-out on a large tenant.
const PREDICTION_MAX_DEVICES = 2_000;
// How long a prediction set is considered current. The underlying signal is a
// 45-day regression over telemetry that arrives every 30s — it does not
// meaningfully move minute to minute, so recomputing more often than this buys
// nothing and costs a fan-out.
const PREDICTION_FRESHNESS_MS = 30 * 60_000;

export async function recomputeHardwarePredictions(domain: string) {
  const devices = await prisma.device.findMany({
    where: { domain },
    select: { id: true },
    take: PREDICTION_MAX_DEVICES,
  });
  const since = new Date(Date.now() - PREDICTION_LOOKBACK_DAYS * 86_400_000);

  const rows: {
    deviceId: string; domain: string; component: string;
    probability: number; status: string; predictedDate: Date | null;
  }[] = [];

  for (const dev of devices) {
    const samples = await prisma.deviceMetric.findMany({
      where: { deviceId: dev.id, createdAt: { gte: since } },
      select: { createdAt: true, diskPct: true, memUsedMb: true, memTotalMb: true, batteryPct: true },
      orderBy: { createdAt: "desc" },
      take: PREDICTION_MAX_SAMPLES,
    });
    for (const pred of predictForDevice(samples)) {
      rows.push({
        deviceId: dev.id,
        domain,
        component: pred.component,
        probability: pred.probability,
        status: pred.status,
        predictedDate: pred.predictedDate,
      });
    }
  }

  // Replace the tenant's predictions in one transaction so readers never see a
  // half-cleared set.
  await prisma.$transaction([
    prisma.hardwareFailurePrediction.deleteMany({ where: { domain } }),
    ...(rows.length ? [prisma.hardwareFailurePrediction.createMany({ data: rows })] : []),
  ]);

  return rows.length;
}

// Recompute only if the tenant's prediction set has aged out.
//
// Predictions are derived data with a slow-moving input, so they belong on a
// schedule, not on a render. `/api/sla/sweep` drives the scheduled pass; this
// gate is the safety net for a tenant whose scheduler has not run yet, and it
// collapses a per-render fan-out into at most one pass per freshness window.
export async function recomputeHardwarePredictionsIfStale(domain: string) {
  const newest = await prisma.hardwareFailurePrediction.findFirst({
    where: { domain },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (newest && Date.now() - newest.createdAt.getTime() < PREDICTION_FRESHNESS_MS) {
    return null;
  }
  return recomputeHardwarePredictions(domain);
}

// Hardware Lifecycle Arbitrage
export async function getLifecycleArbitrage() {
  const domain = await getActiveDomain();

  // Refresh only when the set has gone stale. This used to recompute
  // unconditionally on every render — one query per device, on a page the
  // dashboard polls, so a 500-device tenant issued 500 queries every visit.
  await recomputeHardwarePredictionsIfStale(domain);

  const predictions = await prisma.hardwareFailurePrediction.findMany({
    where: { domain },
    include: { device: { select: { hostname: true, persona: true } } },
    orderBy: { predictedDate: 'asc' },
    take: 200,
  });

  return predictions.map(p => {
    // Generate some mock values for the demo
    const baseValue = p.component === 'BATTERY' ? 1200 : 1500; // Original cost
    
    // As the device approaches failure, its refurbished value drops.
    // Optimal time to sell is BEFORE failure.
    // If it's a battery, we might lose 30% value if sold after it fails.
    
    // Let's create a simulated "resale value" curve
    const daysUntilFailure = p.predictedDate ? Math.max(0, Math.floor((p.predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
    
    let currentResaleValue = 0;
    let valueIfFailed = 0;
    
    if (p.component === 'BATTERY') {
      currentResaleValue = baseValue * 0.55; // 55% of original value currently
      valueIfFailed = baseValue * 0.40;      // Drops to 40% if battery fully dies
    } else {
      // Thermal/CPU
      currentResaleValue = baseValue * 0.60;
      valueIfFailed = baseValue * 0.25;      // Plummets if CPU fails
    }

    const valueAtRisk = currentResaleValue - valueIfFailed;

    return {
      id: p.id,
      device: p.device.hostname,
      persona: p.device.persona || 'Standard User',
      component: p.component,
      probability: Math.round(p.probability * 100),
      daysUntilFailure,
      predictedDate: p.predictedDate,
      currentResaleValue: Math.round(currentResaleValue),
      valueAtRisk: Math.round(valueAtRisk)
    };
  });
}

export async function revokeSoftwareLicense(usageId: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  
  const domain = await getActiveDomain();
  
  const usage = await prisma.softwareUsage.findUnique({
    where: { id: usageId },
    include: { device: true }
  });
  
  if (!usage || usage.domain !== domain) throw new Error("Usage record not found");

  // In a real system, this would call Okta or Azure AD API to remove the user from the app group.
  // For the demo, we simply log the audit and remove the software usage record so it clears from the dashboard.
  
  await logAudit({
    domain,
    action: "REMEDIATION",
    entityType: "SoftwareUsage",
    entityId: usageId,
    entityLabel: usage.softwareName,
    summary: `Automatically revoked unused license for ${usage.softwareName} from device ${usage.device.hostname}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });

  await prisma.softwareUsage.delete({
    where: { id: usageId }
  });

  revalidatePath("/analytics");
  return { ok: true, software: usage.softwareName };
}

// Fleet-wide remediation using a named runbook action — the safe replacement
// for the removed `deployGlobalAgenticScript`. The action is validated against
// the same ALLOWED_ACTIONS vocabulary the agent compiles in, so the worst a
// caller can queue is a runbook step the agent already knows how to perform.
export async function queueFleetRemediation(action: string) {
  const user = await requireAgent();

  if (!ALLOWED_ACTIONS.includes(action as (typeof ALLOWED_ACTIONS)[number])) {
    throw new Error("Unsupported action");
  }

  const domain = await getActiveDomain();
  const devices = await prisma.device.findMany({ where: { domain }, select: { id: true } });

  const commands = devices.map((d) => ({ deviceId: d.id, action, domain }));
  if (commands.length > 0) {
    await prisma.remoteCommand.createMany({ data: commands });
  }

  await logAudit({
    domain,
    action: "REMEDIATION",
    entityType: "Tenant",
    entityId: domain,
    entityLabel: "All Devices",
    summary: `Queued fleet-wide remediation: ${action}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });

  revalidatePath("/dex");
  return { ok: true, deviceCount: devices.length };
}

// ---------------------------------------------------------------------------
// Real dashboard telemetry
// ---------------------------------------------------------------------------
//
// Everything below replaces a hardcoded array that used to sit on the DEX
// dashboard underneath a "Live agent data" badge. The audit's point was that a
// technically literate buyer opening DevTools during a demo sees the fabricated
// arrays and stops believing the genuinely real capabilities too — so the fix is
// not cosmetic.
//
// Where there is no telemetry yet, these return empty rather than plausible
// filler, and the UI says so.

// Hourly average latency across the fleet, from real DeviceMetric samples.
// Replaces seven hardcoded points ending in a dramatic 120ms spike.
export async function getLatencyTrend(hours = 12) {
  const domain = await getActiveDomain();
  const since = new Date(Date.now() - hours * 3_600_000);

  const samples = await prisma.deviceMetric.findMany({
    where: { device: { domain }, createdAt: { gte: since }, latencyMs: { not: null } },
    select: { createdAt: true, latencyMs: true },
    orderBy: { createdAt: "asc" },
    take: 5_000,
  });

  const points = bucketLatencyByHour(samples, new Date(), hours);
  const values = samples
    .map((s) => s.latencyMs)
    .filter((v): v is number => v != null && Number.isFinite(v));

  return {
    points,
    // p95 is the number that corresponds to what users actually complain about.
    p95: percentile(values, 95),
    median: median(values),
    samples: values.length,
  };
}

// Fleet health counts derived from the same experience score the device table
// shows. Replaces a hardcoded 850/120/30 that drifted off a client-side counter
// and contradicted the real device total in the tile directly above it.
export async function getFleetHealthBreakdown() {
  const endpoints = await getDexEndpoints();
  return {
    healthy: endpoints.filter((e) => e.status === "Healthy").length,
    warning: endpoints.filter((e) => e.status === "Warning").length,
    critical: endpoints.filter((e) => e.status === "Critical").length,
    total: endpoints.length,
  };
}

// Real remediation activity from RemoteCommand. Replaces a `useState(0)` counter
// that reset on every page load and an "admin time saved" figure derived from it.
export async function getRemediationStats() {
  const domain = await getActiveDomain();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayByAction, allTimeDone, failed, pending] = await Promise.all([
    prisma.remoteCommand.groupBy({
      by: ["action"],
      where: { domain, status: "DONE", completedAt: { gte: startOfDay } },
      _count: { id: true },
    }),
    prisma.remoteCommand.count({ where: { domain, status: "DONE" } }),
    prisma.remoteCommand.count({ where: { domain, status: "FAILED", createdAt: { gte: startOfDay } } }),
    prisma.remoteCommand.count({ where: { domain, status: { in: ["QUEUED", "RUNNING"] } } }),
  ]);

  const byAction = todayByAction.map((a) => ({ action: a.action, count: a._count.id }));
  const completedToday = byAction.reduce((n, a) => n + a.count, 0);

  return {
    completedToday,
    failedToday: failed,
    pending,
    allTimeCompleted: allTimeDone,
    // An estimate, and labelled as one in the UI.
    minutesSavedToday: minutesSaved(byAction),
  };
}

// The real remediation history, replacing a seeded log with fixed timestamps
// that every user saw identically.
export async function getRemediationHistory(limit = 20) {
  const domain = await getActiveDomain();
  const commands = await prisma.remoteCommand.findMany({
    where: { domain },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, limit),
    select: {
      id: true,
      action: true,
      status: true,
      result: true,
      createdAt: true,
      completedAt: true,
      device: { select: { hostname: true } },
    },
  });

  return commands.map((c) => ({
    id: c.id,
    action: c.action,
    status: c.status as string,
    hostname: c.device.hostname,
    result: c.result,
    at: (c.completedAt ?? c.createdAt).toISOString(),
  }));
}

// Boot and login time. `BootProfile` has had exactly one write site and zero
// read sites — the data has been collected all along and shown nowhere, despite
// being among the most-requested DEX metrics in the market.
export async function getBootPerformance(limit = 15) {
  const domain = await getActiveDomain();

  const profiles = await prisma.bootProfile.findMany({
    where: { domain },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      totalBootSec: true,
      biosSec: true,
      osBootSec: true,
      profileLoadSec: true,
      gpoSec: true,
      createdAt: true,
      deviceId: true,
      device: { select: { hostname: true, user: true } },
    },
  });

  // One row per device — the most recent boot. Older boots stay in the query
  // above so the fleet medians are computed over a real distribution, not just
  // whichever machines rebooted most recently.
  const latestByDevice = new Map<string, (typeof profiles)[number]>();
  for (const p of profiles) if (!latestByDevice.has(p.deviceId)) latestByDevice.set(p.deviceId, p);

  const totals = profiles.map((p) => p.totalBootSec);
  const logins = profiles.map((p) => p.profileLoadSec).filter((v): v is number => v != null);

  const slowest = [...latestByDevice.values()]
    .sort((a, b) => b.totalBootSec - a.totalBootSec)
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      hostname: p.device.hostname,
      user: p.device.user ?? "—",
      totalSec: p.totalBootSec,
      biosSec: p.biosSec,
      osBootSec: p.osBootSec,
      loginSec: p.profileLoadSec,
      gpoSec: p.gpoSec,
      band: bootBand(p.totalBootSec),
      at: p.createdAt.toISOString(),
    }));

  return {
    medianBootSec: median(totals),
    p95BootSec: percentile(totals, 95),
    medianLoginSec: median(logins),
    devicesReporting: latestByDevice.size,
    samples: profiles.length,
    slowest,
  };
}

// Network quality. `packetLossPct` and `wifiSignalDbm` are collected on every
// metrics POST and were displayed nowhere.
export async function getNetworkQuality(limit = 15) {
  const domain = await getActiveDomain();
  const since = new Date(Date.now() - 24 * 3_600_000);

  const samples = await prisma.deviceMetric.findMany({
    where: {
      device: { domain },
      createdAt: { gte: since },
      OR: [{ packetLossPct: { not: null } }, { wifiSignalDbm: { not: null } }],
    },
    select: {
      deviceId: true,
      packetLossPct: true,
      wifiSignalDbm: true,
      wifiSsid: true,
      latencyMs: true,
      createdAt: true,
      device: { select: { hostname: true, user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5_000,
  });

  // Aggregate per device over the window rather than showing the last sample:
  // intermittent packet loss is the interesting case, and a single good sample
  // would hide it.
  const perDevice = new Map<
    string,
    {
      hostname: string;
      user: string | null;
      ssid: string | null;
      loss: number[];
      signal: number[];
      latency: number[];
    }
  >();

  for (const s of samples) {
    const entry = perDevice.get(s.deviceId) ?? {
      hostname: s.device.hostname,
      user: s.device.user,
      ssid: s.wifiSsid,
      loss: [] as number[],
      signal: [] as number[],
      latency: [] as number[],
    };
    if (s.packetLossPct != null) entry.loss.push(s.packetLossPct);
    if (s.wifiSignalDbm != null) entry.signal.push(s.wifiSignalDbm);
    if (s.latencyMs != null) entry.latency.push(s.latencyMs);
    if (!entry.ssid && s.wifiSsid) entry.ssid = s.wifiSsid;
    perDevice.set(s.deviceId, entry);
  }

  const devices = [...perDevice.entries()].map(([deviceId, d]) => {
    const avgLoss = d.loss.length ? d.loss.reduce((a, b) => a + b, 0) / d.loss.length : null;
    const medSignal = median(d.signal);
    return {
      deviceId,
      hostname: d.hostname,
      user: d.user ?? "—",
      ssid: d.ssid,
      packetLossPct: avgLoss,
      worstPacketLossPct: d.loss.length ? Math.max(...d.loss) : null,
      wifiSignalDbm: medSignal,
      p95LatencyMs: percentile(d.latency, 95),
      lossBand: avgLoss != null ? packetLossBand(avgLoss) : null,
      signalBand: medSignal != null ? wifiBand(medSignal) : null,
    };
  });

  // Worst first — this table exists to answer "who is having a bad time?"
  devices.sort((a, b) => (b.packetLossPct ?? -1) - (a.packetLossPct ?? -1));

  const allLoss = devices.map((d) => d.packetLossPct).filter((v): v is number => v != null);
  const allSignal = devices.map((d) => d.wifiSignalDbm).filter((v): v is number => v != null);

  return {
    devicesReporting: devices.length,
    medianPacketLossPct: median(allLoss),
    medianWifiSignalDbm: median(allSignal),
    poorConnectivityCount: devices.filter((d) => d.lossBand === "poor" || d.signalBand === "poor").length,
    worst: devices.slice(0, limit),
  };
}

// Employee sentiment from `MicroSurveyResponse` — the other model with a write
// site and no read site. These are 1-5 ratings captured right after a bad event
// (a crash, say), which makes them the only direct signal in the product about
// how the fleet actually *feels* to use.
export async function getSentimentSummary(days = 30) {
  const domain = await getActiveDomain();
  const since = new Date(Date.now() - days * 86_400_000);

  const responses = await prisma.microSurveyResponse.findMany({
    where: { domain, createdAt: { gte: since } },
    select: {
      rating: true,
      triggerEvent: true,
      comment: true,
      createdAt: true,
      device: { select: { hostname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1_000,
  });

  if (responses.length === 0) {
    return {
      responses: 0,
      averageRating: null,
      detractorPct: null,
      byTrigger: [] as { trigger: string; averageRating: number; responses: number }[],
      recentComments: [] as { hostname: string; rating: number; comment: string; at: string }[],
    };
  }

  const ratings = responses.map((r) => r.rating);
  const byTriggerMap = new Map<string, { total: number; count: number }>();
  for (const r of responses) {
    const b = byTriggerMap.get(r.triggerEvent) ?? { total: 0, count: 0 };
    b.total += r.rating;
    b.count += 1;
    byTriggerMap.set(r.triggerEvent, b);
  }

  return {
    responses: responses.length,
    averageRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    // 1-2 out of 5 is a detractor. This is the number worth acting on; the mean
    // hides a bimodal fleet where half the users are miserable.
    detractorPct: (ratings.filter((r) => r <= 2).length / ratings.length) * 100,
    byTrigger: [...byTriggerMap.entries()]
      .map(([trigger, b]) => ({ trigger, averageRating: b.total / b.count, responses: b.count }))
      .sort((a, b) => a.averageRating - b.averageRating)
      .slice(0, 8),
    recentComments: responses
      .filter((r) => r.comment?.trim())
      .slice(0, 5)
      .map((r) => ({
        hostname: r.device.hostname,
        rating: r.rating,
        comment: r.comment as string,
        at: r.createdAt.toISOString(),
      })),
  };
}
