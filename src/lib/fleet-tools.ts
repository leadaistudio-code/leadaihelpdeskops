import { tool, type ToolSet } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Fleet Copilot tools — for IT staff, over the whole tenant fleet.
//
// Unlike the employee chatbot (which is scoped to one user's own device), an
// agent legitimately sees every device in their tenant. So these are scoped to
// `domain` only, passed in by the route from the session. They are READ-ONLY:
// the copilot informs; agents act through the existing remediation controls.

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export const FLEET_TOOL_SCHEMAS = {
  get_fleet_summary: z.object({}),
  list_devices: z.object({
    filter: z
      .enum(["all", "offline", "at_risk", "low_disk", "high_cpu"])
      .describe("Which slice of the fleet to list."),
  }),
  get_hardware_risks: z.object({}),
  get_top_app_crashes: z.object({
    days: z.number().int().min(1).max(90).optional().describe("Lookback window in days (default 7)."),
  }),
  get_shadow_it: z.object({}),
} as const;

function memPct(memUsedMb: number | null, memTotalMb: number | null): number | null {
  return memUsedMb != null && memTotalMb ? Math.round((memUsedMb / memTotalMb) * 100) : null;
}

// Why a device is at risk (empty array = healthy). Offline counts as at-risk on
// its own. Returned to the model as an explicit flag so it never has to judge
// raw metrics itself — that misjudgment (e.g. treating an offline machine as
// fine) is exactly what this avoids.
function riskReasons(d: { online: boolean; cpuPct: number | null; memUsedMb: number | null; memTotalMb: number | null; diskPct: number | null; latencyMs: number | null }): string[] {
  const reasons: string[] = [];
  if (!d.online) reasons.push("offline");
  const mp = memPct(d.memUsedMb, d.memTotalMb) ?? 0;
  if ((d.cpuPct ?? 0) > 85) reasons.push("high CPU");
  if (mp > 85) reasons.push("high memory");
  if ((d.diskPct ?? 0) > 85) reasons.push("low disk");
  if ((d.latencyMs ?? 0) > 150) reasons.push("high latency");
  return reasons;
}

function isAtRisk(d: Parameters<typeof riskReasons>[0]): boolean {
  return riskReasons(d).length > 0;
}

export async function executeFleetTool(name: string, input: unknown, domain: string): Promise<unknown> {
  const args = (input ?? {}) as Record<string, unknown>;
  const now = Date.now();

  switch (name) {
    case "get_fleet_summary": {
      const devices = await prisma.device.findMany({
        where: { domain },
        select: { lastSeenAt: true, cpuPct: true, memUsedMb: true, memTotalMb: true, diskPct: true, latencyMs: true },
      });
      let online = 0, atRisk = 0;
      for (const d of devices) {
        const isOnline = !!d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS;
        if (isOnline) online++;
        if (isAtRisk({ online: isOnline, ...d })) atRisk++;
      }
      return { total: devices.length, online, offline: devices.length - online, atRisk };
    }

    case "list_devices": {
      const filter = typeof args.filter === "string" ? args.filter : "all";
      const devices = await prisma.device.findMany({
        where: { domain },
        orderBy: { lastSeenAt: "desc" },
        take: 100,
        select: {
          hostname: true, user: true, lastSeenAt: true,
          cpuPct: true, memUsedMb: true, memTotalMb: true, diskPct: true, latencyMs: true,
        },
      });
      const shaped = devices.map((d) => {
        const online = !!d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS;
        const reasons = riskReasons({ online, cpuPct: d.cpuPct, memUsedMb: d.memUsedMb, memTotalMb: d.memTotalMb, diskPct: d.diskPct, latencyMs: d.latencyMs });
        return {
          hostname: d.hostname, user: d.user, online,
          cpuPct: d.cpuPct, memoryPct: memPct(d.memUsedMb, d.memTotalMb), diskPct: d.diskPct, latencyMs: d.latencyMs,
          atRisk: reasons.length > 0,
          riskReasons: reasons,
        };
      });
      const matched = shaped.filter((d) => {
        switch (filter) {
          case "offline": return !d.online;
          case "at_risk": return d.atRisk;
          case "low_disk": return (d.diskPct ?? 0) > 85;
          case "high_cpu": return d.online && (d.cpuPct ?? 0) > 85;
          default: return true;
        }
      });
      return {
        filter,
        count: matched.length,
        // Cap the payload; tell the model if it was truncated.
        devices: matched.slice(0, 25),
        truncated: matched.length > 25,
      };
    }

    case "get_hardware_risks": {
      const risks = await prisma.hardwareFailurePrediction.findMany({
        where: { domain },
        orderBy: { probability: "desc" },
        take: 25,
        include: { device: { select: { hostname: true } } },
      });
      return {
        count: risks.length,
        risks: risks.map((r) => ({
          device: r.device.hostname,
          component: r.component,
          probabilityPct: Math.round(r.probability * 100),
          status: r.status,
          predictedDate: r.predictedDate ? r.predictedDate.toISOString().slice(0, 10) : null,
        })),
      };
    }

    case "get_top_app_crashes": {
      const days = typeof args.days === "number" ? args.days : 7;
      const since = new Date(now - days * 86_400_000);
      const grouped = await prisma.appCrashEvent.groupBy({
        by: ["appName"],
        where: { domain, createdAt: { gte: since } },
        _count: { appName: true },
        orderBy: { _count: { appName: "desc" } },
        take: 10,
      });
      return {
        windowDays: days,
        apps: grouped.map((g) => ({ app: g.appName, events: g._count.appName })),
      };
    }

    case "get_shadow_it": {
      const staleBefore = new Date(now - 72 * 3_600_000);
      const unused = await prisma.softwareUsage.findMany({
        where: {
          domain,
          OR: [{ foregroundMinutes: 0 }, { lastUsedAt: { lt: staleBefore } }, { lastUsedAt: null }],
        },
        orderBy: { foregroundMinutes: "asc" },
        take: 25,
        include: { device: { select: { hostname: true, user: true } } },
      });
      return {
        count: unused.length,
        unused: unused.map((u) => ({
          software: u.softwareName,
          device: u.device.hostname,
          user: u.device.user,
          foregroundMinutes: u.foregroundMinutes,
          lastUsed: u.lastUsedAt ? u.lastUsedAt.toISOString().slice(0, 10) : null,
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Build the AI SDK tool set for one request. `domain` is closed over from the
// session — never a model input — so the copilot can't reach another tenant.
export function buildFleetTools(domain: string): ToolSet {
  return {
    get_fleet_summary: tool({
      description: "Fleet-wide counts: total devices, online, offline, and at-risk. Use for 'how is the fleet doing?' questions.",
      inputSchema: FLEET_TOOL_SCHEMAS.get_fleet_summary,
      execute: (a) => executeFleetTool("get_fleet_summary", a, domain),
    }),
    list_devices: tool({
      description:
        "List devices, optionally filtered. Use filter 'at_risk' for devices in trouble RIGHT NOW — offline, or high CPU/memory/disk/latency. This is the tool for 'which devices are at risk?', 'anything unhealthy?', or 'what needs attention?'. Also handles offline / low-disk / high-CPU slices.",
      inputSchema: FLEET_TOOL_SCHEMAS.list_devices,
      execute: (a) => executeFleetTool("list_devices", a, domain),
    }),
    get_hardware_risks: tool({
      description:
        "PREDICTED future component failures (disk or battery) from telemetry-trend regression — a forecast, not current health. Use only for 'what will fail?' / 'predicted failures'. For devices already offline or overloaded, use list_devices with filter 'at_risk' instead.",
      inputSchema: FLEET_TOOL_SCHEMAS.get_hardware_risks,
      execute: (a) => executeFleetTool("get_hardware_risks", a, domain),
    }),
    get_top_app_crashes: tool({
      description: "The most frequently crashing or hanging applications across the fleet in a recent window.",
      inputSchema: FLEET_TOOL_SCHEMAS.get_top_app_crashes,
      execute: (a) => executeFleetTool("get_top_app_crashes", a, domain),
    }),
    get_shadow_it: tool({
      description: "Paid software that appears unused (no foreground time or not opened in 72h+) — candidate licenses to reclaim.",
      inputSchema: FLEET_TOOL_SCHEMAS.get_shadow_it,
      execute: (a) => executeFleetTool("get_shadow_it", a, domain),
    }),
  };
}
