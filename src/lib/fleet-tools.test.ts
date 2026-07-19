import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    device: { findMany: vi.fn() },
    hardwareFailurePrediction: { findMany: vi.fn() },
    appCrashEvent: { groupBy: vi.fn() },
    softwareUsage: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

import { executeFleetTool, FLEET_TOOL_SCHEMAS } from "@/lib/fleet-tools";

const ACME = "org_acme";
beforeEach(() => vi.clearAllMocks());

describe("FLEET_TOOL_SCHEMAS", () => {
  it("never exposes a domain/tenant/user parameter to the model", () => {
    for (const schema of Object.values(FLEET_TOOL_SCHEMAS)) {
      const keys = Object.keys(schema.shape);
      expect(keys).not.toContain("domain");
      expect(keys).not.toContain("tenant");
      expect(keys).not.toContain("userId");
    }
  });
});

describe("every tool scopes its query to the caller's tenant", () => {
  it("get_fleet_summary", async () => {
    prismaMock.device.findMany.mockResolvedValue([]);
    await executeFleetTool("get_fleet_summary", {}, ACME);
    expect(prismaMock.device.findMany.mock.calls[0][0].where).toEqual({ domain: ACME });
  });

  it("list_devices", async () => {
    prismaMock.device.findMany.mockResolvedValue([]);
    await executeFleetTool("list_devices", { filter: "offline" }, ACME);
    expect(prismaMock.device.findMany.mock.calls[0][0].where).toEqual({ domain: ACME });
  });

  it("get_hardware_risks", async () => {
    prismaMock.hardwareFailurePrediction.findMany.mockResolvedValue([]);
    await executeFleetTool("get_hardware_risks", {}, ACME);
    expect(prismaMock.hardwareFailurePrediction.findMany.mock.calls[0][0].where).toEqual({ domain: ACME });
  });

  it("get_top_app_crashes", async () => {
    prismaMock.appCrashEvent.groupBy.mockResolvedValue([]);
    await executeFleetTool("get_top_app_crashes", { days: 7 }, ACME);
    expect(prismaMock.appCrashEvent.groupBy.mock.calls[0][0].where.domain).toBe(ACME);
  });

  it("get_shadow_it", async () => {
    prismaMock.softwareUsage.findMany.mockResolvedValue([]);
    await executeFleetTool("get_shadow_it", {}, ACME);
    expect(prismaMock.softwareUsage.findMany.mock.calls[0][0].where.domain).toBe(ACME);
  });
});

describe("list_devices filtering", () => {
  const now = Date.now();
  const online = (over: Partial<Record<string, number>> = {}) => ({
    hostname: "WS", user: "u", lastSeenAt: new Date(now),
    cpuPct: 10, memUsedMb: 2000, memTotalMb: 8000, diskPct: 40, latencyMs: 20, ...over,
  });

  it("offline filter returns only stale devices", async () => {
    prismaMock.device.findMany.mockResolvedValue([
      online(),
      { ...online(), hostname: "OLD", lastSeenAt: new Date(now - 10 * 60_000) },
    ]);
    const res: any = await executeFleetTool("list_devices", { filter: "offline" }, ACME);
    expect(res.count).toBe(1);
    expect(res.devices[0].hostname).toBe("OLD");
  });

  it("low_disk filter returns devices past the disk threshold", async () => {
    prismaMock.device.findMany.mockResolvedValue([online(), { ...online(), hostname: "FULL", diskPct: 92 }]);
    const res: any = await executeFleetTool("list_devices", { filter: "low_disk" }, ACME);
    expect(res.count).toBe(1);
    expect(res.devices[0].hostname).toBe("FULL");
  });

  it("at_risk filter includes offline and high-metric devices", async () => {
    prismaMock.device.findMany.mockResolvedValue([
      online(), // healthy
      { ...online(), hostname: "HOT", cpuPct: 95 },
      { ...online(), hostname: "GONE", lastSeenAt: new Date(now - 10 * 60_000) },
    ]);
    const res: any = await executeFleetTool("list_devices", { filter: "at_risk" }, ACME);
    expect(res.count).toBe(2);
    expect(res.devices.map((d: any) => d.hostname).sort()).toEqual(["GONE", "HOT"]);
  });
});
