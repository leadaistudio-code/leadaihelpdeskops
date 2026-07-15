"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";

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

// Auto-seeds realistic demo data attached to real enrolled devices if tables are empty.
async function seedDemoData(domain: string) {
  const devices = await prisma.device.findMany({ where: { domain }, select: { id: true } });
  if (devices.length === 0) return;
  const deviceId = devices[0].id; // Assign everything to the first active device for simplicity

  // 1. AppCrashes
  const crashCount = await prisma.appCrashEvent.count({ where: { domain } });
  if (crashCount === 0) {
    const apps = ['zoom.exe', 'ms-teams.exe', 'slack.exe', 'chrome.exe', 'excel.exe', 'explorer.exe'];
    const crashesToInsert = apps.map(app => ({
      deviceId, domain, appName: app, appVersion: 'Latest', eventType: Math.random() > 0.5 ? 'CRASH' : 'HANG',
      createdAt: new Date(Date.now() - Math.random() * 86400000)
    }));
    await prisma.appCrashEvent.createMany({ data: crashesToInsert });
  }

  // 2. Software Usage (Shadow IT Cost-Killer)
  const usageCount = await prisma.softwareUsage.count({ where: { domain } });
  if (usageCount === 0) {
    const usages = [
      { deviceId, domain, softwareName: 'salesforce', foregroundMinutes: 0, lastUsedAt: new Date(Date.now() - 100 * 3600000) },
      { deviceId, domain, softwareName: 'adobe', foregroundMinutes: 0, lastUsedAt: new Date(Date.now() - 96 * 3600000) },
      { deviceId, domain, softwareName: 'slack', foregroundMinutes: 450, lastUsedAt: new Date() },
      { deviceId, domain, softwareName: 'zoom', foregroundMinutes: 200, lastUsedAt: new Date() }
    ];
    await prisma.softwareUsage.createMany({ data: usages });
  }

  // 3. Security Posture
  const secCount = await prisma.securityPosture.count({ where: { domain } });
  if (secCount === 0) {
    await prisma.securityPosture.create({
      data: { deviceId, domain, bitlockerActive: false, firewallActive: true, avUpdated: true }
    });
  }

  // 4. Hardware Failure
  const hwCount = await prisma.hardwareFailurePrediction.count({ where: { domain } });
  if (hwCount === 0) {
    await prisma.hardwareFailurePrediction.createMany({
      data: [
        { deviceId, domain, component: 'BATTERY', probability: 0.85, status: 'WARNING', predictedDate: new Date(Date.now() + 15 * 86400000) },
        { deviceId, domain, component: 'DISK', probability: 0.95, status: 'CRITICAL', predictedDate: new Date(Date.now() + 5 * 86400000) }
      ]
    });
  }

  // 5. Smart Contracts
  const scCount = await prisma.smartContract.count({ where: { domain } });
  if (scCount === 0) {
    await prisma.smartContract.create({
      data: { domain, name: "Prevent Thermal Event", metric: "CPU", operator: ">", threshold: 90, action: "CLEAR_TEMP", triggersCount: 14 }
    });
  }
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
  const domain = await getActiveDomain();
  // Auto-seed missing mock data for the demo environment so the dashboard is live
  await seedDemoData(domain);
  
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

export async function queueAgenticRemediation(deviceId: string, prompt: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  
  const domain = await getActiveDomain();
  const device = await prisma.device.findFirst({ where: { id: deviceId, domain }, select: { id: true, hostname: true } });
  if (!device) throw new Error("Device not found");
  
  const { text: script } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are an expert Windows IT administrator. Given a user request, you must write a single PowerShell script that accomplishes the goal. Return ONLY the raw PowerShell script. Do not include markdown code blocks (like ```powershell), just the raw script text. Make it safe and robust. If the request is unsafe or destructive, return '# UNSAFE REQUEST'.",
    prompt,
  });

  if (script.trim().startsWith("# UNSAFE REQUEST") || script.trim() === "") {
    throw new Error("AI determined the request was unsafe or could not generate a valid script.");
  }

  const actionStr = `RUN_SCRIPT: ${script.trim()}`;

  await prisma.remoteCommand.create({ data: { deviceId, action: actionStr, domain } });
  await logAudit({
    domain,
    action: "REMEDIATION",
    entityType: "Device",
    entityId: deviceId,
    entityLabel: device.hostname,
    summary: `Queued Agentic AI remediation: ${prompt}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });
  revalidatePath("/dex");
  return { ok: true, script: script.trim() };
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

export async function toggleSmartContract(id: string, isActive: boolean) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  
  const sc = await prisma.smartContract.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/dex");
  return sc;
}

export async function deleteSmartContract(id: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) throw new Error("Not authorized");
  
  await prisma.smartContract.delete({
    where: { id }
  });
  revalidatePath("/dex");
  return { ok: true };
}

// Hardware Lifecycle Arbitrage
export async function getLifecycleArbitrage() {
  const domain = await getActiveDomain();
  
  const predictions = await prisma.hardwareFailurePrediction.findMany({
    where: { domain },
    include: { device: { select: { hostname: true, persona: true } } },
    orderBy: { predictedDate: 'asc' }
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

export async function generateGlobalAgenticScript(prompt: string, modelStr: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }

  const { object } = await generateObject({
    model: openai(modelStr || "gpt-4o-mini"),
    schema: z.object({
      script: z.string().describe("The raw PowerShell script. MUST be empty if request is unsafe."),
      explanation: z.string().describe("A short explanation of what the script does."),
      isUnsafe: z.boolean().describe("True if the prompt requests a destructive or unsafe action.")
    }),
    system: "You are an expert Windows IT administrator. Given a user request, you must write a single PowerShell script that accomplishes the goal. Return ONLY the raw PowerShell script. Make it safe and robust. If the request is unsafe or destructive, set isUnsafe to true and return an empty script.",
    prompt,
  });

  if (object.isUnsafe || object.script.trim() === "") {
    throw new Error("AI determined the request was unsafe or could not generate a valid script.");
  }

  return { script: object.script.trim(), explanation: object.explanation };
}

export async function deployGlobalAgenticScript(prompt: string, script: string) {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  
  const domain = await getActiveDomain();
  const devices = await prisma.device.findMany({ where: { domain }, select: { id: true, hostname: true } });
  
  const actionStr = `RUN_SCRIPT: ${script.trim()}`;

  const commands = devices.map(d => ({ deviceId: d.id, action: actionStr, domain }));
  if (commands.length > 0) {
     await prisma.remoteCommand.createMany({ data: commands });
  }

  await logAudit({
    domain,
    action: "REMEDIATION",
    entityType: "Tenant",
    entityId: domain,
    entityLabel: "All Devices",
    summary: `Queued Global Agentic AI remediation: ${prompt}`,
    actor: { id: user.id, name: user.name, email: user.email },
  });
  
  revalidatePath("/dex");
  return { ok: true, deviceCount: devices.length };
}
