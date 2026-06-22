import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";
import { notify } from "@/app/actions/notificationActions";

const schema = z.object({
  cpuPct: z.number().min(0).max(100),
  memUsedMb: z.number().int().min(0),
  memTotalMb: z.number().int().min(1),
  diskPct: z.number().min(0).max(100).nullish(),
  uptimeSec: z.number().int().min(0).nullish(),
  latencyMs: z.number().int().min(0).nullish(),
  batteryPct: z.number().int().min(0).max(100).nullish(),
  cpuCores: z.number().int().min(1).max(512).nullish(),
  user: z.string().max(200).nullish(),
});

const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // don't re-alert a device within an hour

type Snapshot = z.infer<typeof schema>;

type Issue = { label: string; runbook: string | null };

// Safe auto-fix per issue type. Resource pressure → clear temp files; battery
// has no safe automated fix, so it alerts only.
const RUNBOOK: Record<string, string | null> = {
  cpu: "CLEAR_TEMP",
  mem: "CLEAR_TEMP",
  disk: "CLEAR_TEMP",
  battery: null,
};

// Evaluate proactive rules; returns the first breached issue, or null.
function detectIssue(m: Snapshot): Issue | null {
  const memPct = (m.memUsedMb / m.memTotalMb) * 100;
  if (m.cpuPct > 90) return { label: `High CPU (${Math.round(m.cpuPct)}%)`, runbook: RUNBOOK.cpu };
  if (memPct > 92) return { label: `High memory pressure (${Math.round(memPct)}%)`, runbook: RUNBOOK.mem };
  if (m.diskPct != null && m.diskPct > 90) return { label: `Low disk space (${Math.round(m.diskPct)}% used)`, runbook: RUNBOOK.disk };
  if (m.batteryPct != null && m.batteryPct < 15) return { label: `Critical battery (${m.batteryPct}%)`, runbook: RUNBOOK.battery };
  return null;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const deviceKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!deviceKey) {
      return NextResponse.json({ error: "Missing device key." }, { status: 401 });
    }

    const limit = rateLimit(`metrics:${deviceKey}`, 12, 60_000);
    if (!limit.ok) return tooManyRequests(limit.resetMs);

    const device = await prisma.device.findUnique({
      where: { deviceKey },
      select: { id: true, hostname: true, domain: true, lastAlertAt: true },
    });
    if (!device) {
      return NextResponse.json({ error: "Unknown device." }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid metrics payload." }, { status: 400 });
    }
    const m = parsed.data;

    await prisma.$transaction([
      prisma.device.update({
        where: { id: device.id },
        data: {
          cpuPct: m.cpuPct,
          memUsedMb: m.memUsedMb,
          memTotalMb: m.memTotalMb,
          diskPct: m.diskPct,
          uptimeSec: m.uptimeSec,
          latencyMs: m.latencyMs,
          batteryPct: m.batteryPct,
          cpuCores: m.cpuCores ?? undefined,
          user: m.user ?? undefined,
          lastSeenAt: new Date(),
        },
      }),
      prisma.deviceMetric.create({
        data: {
          deviceId: device.id,
          cpuPct: m.cpuPct,
          memUsedMb: m.memUsedMb,
          memTotalMb: m.memTotalMb,
          diskPct: m.diskPct,
          uptimeSec: m.uptimeSec,
          latencyMs: m.latencyMs,
          batteryPct: m.batteryPct,
        },
      }),
    ]);

    // Proactive monitoring: raise an incident when a rule breaches (deduped),
    // and — if the tenant has self-heal on — auto-queue a safe remediation.
    const issue = detectIssue(m);
    const onCooldown = device.lastAlertAt && Date.now() - device.lastAlertAt.getTime() < ALERT_COOLDOWN_MS;
    if (issue && !onCooldown) {
      await raiseAlertIncident(device.domain, device.hostname, device.id, issue.label);

      if (issue.runbook) {
        const settings = await prisma.tenantSettings.findUnique({ where: { domain: device.domain } });
        if (settings?.autoHeal) {
          await prisma.remoteCommand.create({
            data: { deviceId: device.id, action: issue.runbook, domain: device.domain },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/agent/metrics" });
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}

// Opens a HIGH-priority incident attributed to a per-tenant DEX monitor user,
// stamps the device so we don't re-alert within the cooldown, and notifies the
// tenant's agents.
async function raiseAlertIncident(domain: string, hostname: string, deviceId: string, issue: string) {
  try {
    const monitor = await prisma.user.upsert({
      where: { email: `dex-monitor_${domain}@leadaistudio.ai` },
      update: {},
      create: {
        email: `dex-monitor_${domain}@leadaistudio.ai`,
        name: "DEX Monitor",
        role: "EMPLOYEE",
        domain,
      },
      select: { id: true },
    });

    const count = await prisma.incident.count({ where: { type: "INCIDENT" } });
    const number = `INC${String(count + 10000).padStart(7, "0")}`;

    const incident = await prisma.incident.create({
      data: {
        number,
        title: `DEX Alert: ${issue} on ${hostname}`,
        description: `Proactively detected by the DEX agent on ${hostname}.\nIssue: ${issue}\n\nThis ticket was auto-created from real endpoint telemetry.`,
        type: "INCIDENT",
        priority: "HIGH",
        status: "NEW",
        callerId: monitor.id,
        domain,
      },
      select: { id: true, number: true },
    });

    await prisma.device.update({ where: { id: deviceId }, data: { lastAlertAt: new Date() } });

    // Notify the tenant's agents/admins.
    const agents = await prisma.user.findMany({
      where: { domain, role: { in: ["ADMIN", "IT_AGENT"] } },
      select: { id: true },
    });
    await Promise.all(
      agents.map((a) =>
        notify(a.id, {
          title: `DEX Alert: ${hostname}`,
          body: issue,
          type: "GENERAL",
          link: `/incidents/${incident.id}`,
        })
      )
    );
  } catch (e) {
    logError(e, { scope: "raiseAlertIncident", hostname });
  }
}
