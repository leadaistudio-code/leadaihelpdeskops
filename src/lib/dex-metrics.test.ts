import { describe, it, expect } from "vitest";
import {
  bucketLatencyByHour,
  minutesSaved,
  bootBand,
  wifiBand,
  packetLossBand,
  median,
  percentile,
} from "@/lib/dex-metrics";

const HOUR = 3_600_000;
const NOW = new Date("2026-08-03T12:00:00Z");

function at(hoursAgo: number, latencyMs: number | null) {
  return { createdAt: new Date(NOW.getTime() - hoursAgo * HOUR), latencyMs };
}

describe("bucketLatencyByHour", () => {
  it("averages samples within the same hour", () => {
    const points = bucketLatencyByHour([at(1, 40), at(1, 60)], NOW, 12);
    expect(points).toHaveLength(1);
    expect(points[0].ms).toBe(50);
    expect(points[0].samples).toBe(2);
  });

  it("omits hours with no telemetry rather than plotting them as zero", () => {
    // The gap at 2h ago must not appear. A missing sample is not 0ms latency,
    // and drawing it as one is the dishonesty this replaces.
    const points = bucketLatencyByHour([at(3, 30), at(1, 50)], NOW, 12);
    expect(points).toHaveLength(2);
    expect(points.every((p) => p.ms > 0)).toBe(true);
  });

  it("ignores samples outside the window", () => {
    expect(bucketLatencyByHour([at(50, 999)], NOW, 12)).toHaveLength(0);
  });

  it("ignores null latencies", () => {
    expect(bucketLatencyByHour([at(1, null), at(1, 20)], NOW, 12)[0].ms).toBe(20);
  });

  it("returns points in chronological order", () => {
    const points = bucketLatencyByHour([at(1, 10), at(5, 20), at(3, 30)], NOW, 12);
    expect(points.map((p) => p.samples)).toHaveLength(3);
    const raw = bucketLatencyByHour([at(5, 20), at(3, 30), at(1, 10)], NOW, 12);
    expect(raw.map((p) => p.ms)).toEqual([20, 30, 10]);
  });

  it("returns nothing for an empty fleet", () => {
    expect(bucketLatencyByHour([], NOW, 12)).toEqual([]);
  });
});

describe("minutesSaved", () => {
  it("weights each action by its own estimate rather than a flat rate", () => {
    expect(minutesSaved([{ action: "CLEAR_TEMP", count: 2 }])).toBe(40);
    expect(minutesSaved([{ action: "REBOOT", count: 2 }])).toBe(16);
  });

  it("falls back to a default for unknown actions", () => {
    expect(minutesSaved([{ action: "SOMETHING_NEW", count: 3 }])).toBe(30);
  });

  it("is zero when nothing ran", () => {
    expect(minutesSaved([])).toBe(0);
  });
});

describe("banding", () => {
  it("bands boot time on thresholds IT actually triages against", () => {
    expect(bootBand(30)).toBe("good");
    expect(bootBand(45)).toBe("good");
    expect(bootBand(60)).toBe("slow");
    expect(bootBand(200)).toBe("bad");
  });

  it("bands WiFi signal on standard RSSI thresholds", () => {
    expect(wifiBand(-45)).toBe("good");
    expect(wifiBand(-70)).toBe("fair");
    expect(wifiBand(-85)).toBe("poor");
  });

  it("bands packet loss where interactive traffic degrades", () => {
    expect(packetLossBand(0.2)).toBe("good");
    expect(packetLossBand(1.5)).toBe("fair");
    expect(packetLossBand(6)).toBe("poor");
  });
});

describe("median / percentile", () => {
  it("returns null for an empty series rather than 0", () => {
    // 0 would render as a real, excellent measurement. Null renders as "—".
    expect(median([])).toBeNull();
    expect(percentile([], 95)).toBeNull();
  });

  it("takes the midpoint of an odd-length series", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("averages the two middle values of an even-length series", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("is not dragged by a long right tail, unlike the mean", () => {
    // One machine that took 400s to boot must not move the headline number.
    expect(median([30, 32, 35, 400])).toBe(33.5);
  });

  it("computes p95 by nearest rank", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(values, 95)).toBe(95);
    expect(percentile(values, 50)).toBe(50);
  });

  it("handles a single-sample series", () => {
    expect(percentile([42], 95)).toBe(42);
  });
});
