import { describe, it, expect } from "vitest";
import { linearRegression, predictForDevice, type MetricSample } from "@/lib/hardware-prediction";

const DAY = 86_400_000;
const T0 = 1_700_000_000_000; // fixed epoch so tests are deterministic

// Build a disk series rising `perDay`% from `start`%, one sample/day for `days`.
function diskSeries(start: number, perDay: number, days: number): MetricSample[] {
  return Array.from({ length: days }, (_, i) => ({
    createdAt: new Date(T0 + i * DAY),
    diskPct: start + perDay * i,
    memUsedMb: 4000,
    memTotalMb: 8000,
    batteryPct: null,
  }));
}

describe("linearRegression", () => {
  it("recovers a known slope and intercept", () => {
    const fit = linearRegression([
      { t: 0, y: 10 },
      { t: 1, y: 12 },
      { t: 2, y: 14 },
    ]);
    expect(fit).not.toBeNull();
    expect(fit!.slopePerMs).toBeCloseTo(2, 6);
    expect(fit!.intercept).toBeCloseTo(10, 6);
    expect(fit!.r2).toBeCloseTo(1, 6);
  });

  it("returns null when x has no variance", () => {
    expect(linearRegression([{ t: 5, y: 1 }, { t: 5, y: 9 }])).toBeNull();
  });
});

describe("predictForDevice — disk", () => {
  it("predicts exhaustion for a steadily filling disk", () => {
    // 15 daily samples from 60% at 1%/day → current (last sample) ≈ 74%,
    // so ~18 days to the 92% threshold: inside the 30d horizon, not imminent.
    const preds = predictForDevice(diskSeries(60, 1, 15));
    const disk = preds.find((p) => p.component === "DISK");
    expect(disk).toBeDefined();
    expect(disk!.evidence.daysToThreshold).toBeGreaterThan(15);
    expect(disk!.evidence.daysToThreshold).toBeLessThan(30);
    expect(disk!.probability).toBeGreaterThan(0.2);
    expect(disk!.probability).toBeLessThanOrEqual(1);
    expect(disk!.predictedDate).toBeInstanceOf(Date);
  });

  it("emits nothing for a flat, healthy disk", () => {
    expect(predictForDevice(diskSeries(60, 0, 20))).toHaveLength(0);
  });

  it("emits nothing for a disk that is emptying", () => {
    expect(predictForDevice(diskSeries(80, -0.5, 20))).toHaveLength(0);
  });

  it("flags CRITICAL when already over threshold", () => {
    const preds = predictForDevice(diskSeries(95, 0.2, 12));
    const disk = preds.find((p) => p.component === "DISK");
    expect(disk?.status).toBe("CRITICAL");
    expect(disk?.probability).toBeGreaterThanOrEqual(0.9);
  });

  it("ignores a series too short to trust", () => {
    expect(predictForDevice(diskSeries(70, 2, 4))).toHaveLength(0);
  });

  it("marks a fast fill CRITICAL and a slow fill WARNING", () => {
    const fast = predictForDevice(diskSeries(88, 1, 12)).find((p) => p.component === "DISK");
    const slow = predictForDevice(diskSeries(70, 0.8, 20)).find((p) => p.component === "DISK");
    expect(fast?.status).toBe("CRITICAL"); // crosses within ~7 days
    expect(slow?.status).toBe("WARNING");
  });
});

describe("predictForDevice — battery", () => {
  it("makes no battery prediction when there is no battery data", () => {
    // The real fleet reports zero batteryPct today; this must stay silent.
    const preds = predictForDevice(diskSeries(60, 0, 20));
    expect(preds.some((p) => p.component === "BATTERY")).toBe(false);
  });

  it("predicts decline once battery data trends down", () => {
    const samples: MetricSample[] = Array.from({ length: 20 }, (_, i) => ({
      createdAt: new Date(T0 + i * DAY),
      diskPct: 50,
      memUsedMb: 4000,
      memTotalMb: 8000,
      batteryPct: 80 - i * 1.5, // ceiling falling toward the 40% floor
    }));
    const battery = predictForDevice(samples).find((p) => p.component === "BATTERY");
    expect(battery).toBeDefined();
    expect(battery!.evidence.perDay).toBeLessThan(0);
    expect(battery!.probability).toBeGreaterThan(0.2);
  });
});
