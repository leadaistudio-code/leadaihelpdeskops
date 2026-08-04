// Pure shaping helpers for the DEX dashboard.
//
// Kept out of `actions/` so they can be unit-tested without a database, and so
// the bucketing rules that decide what a chart *says* are testable rather than
// buried in a query.

export type LatencyPoint = { time: string; ms: number; samples: number };

export type MetricSample = { createdAt: Date; latencyMs: number | null };

// Average real latency into hourly buckets over a trailing window.
//
// Buckets with no telemetry are omitted rather than plotted as zero: a gap in
// the data is not a fleet with 0ms latency, and drawing it as one is the same
// class of dishonesty as the hardcoded array this replaces.
export function bucketLatencyByHour(samples: MetricSample[], now: Date, hours = 12): LatencyPoint[] {
  const buckets = new Map<number, { total: number; count: number }>();
  const cutoff = now.getTime() - hours * 3_600_000;

  for (const s of samples) {
    if (s.latencyMs == null) continue;
    const t = s.createdAt.getTime();
    if (t < cutoff) continue;
    const hour = Math.floor(t / 3_600_000);
    const b = buckets.get(hour) ?? { total: 0, count: 0 };
    b.total += s.latencyMs;
    b.count += 1;
    buckets.set(hour, b);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, b]) => ({
      time: new Date(hour * 3_600_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ms: Math.round(b.total / b.count),
      samples: b.count,
    }));
}

// Minutes of IT time a completed remediation is credited with saving.
//
// This is an estimate, and it is stated as one in the UI. The figure is per
// action because the actions differ: a remote reboot saves a five-minute call,
// a disk cleanup saves a ticket that would otherwise have been triaged,
// assigned, and worked. A single blanket "15 minutes" for everything was a
// number with no reasoning behind it.
export const REMEDIATION_MINUTES_SAVED: Record<string, number> = {
  FLUSH_DNS: 12,
  CLEAR_TEMP: 20,
  RESTART_SPOOLER: 15,
  REBOOT: 8,
};

export const DEFAULT_REMEDIATION_MINUTES = 10;

export function minutesSaved(actions: { action: string; count: number }[]): number {
  return actions.reduce(
    (total, a) => total + (REMEDIATION_MINUTES_SAVED[a.action] ?? DEFAULT_REMEDIATION_MINUTES) * a.count,
    0
  );
}

// Boot-time health banding, in seconds. Thresholds are the ones IT teams
// actually use when triaging "my laptop takes forever to start".
export function bootBand(totalSec: number): "good" | "slow" | "bad" {
  if (totalSec <= 45) return "good";
  if (totalSec <= 90) return "slow";
  return "bad";
}

// WiFi signal banding, in dBm. Standard RSSI thresholds: above -60 is strong,
// below -75 is where calls and VPN sessions start to break down.
export function wifiBand(dbm: number): "good" | "fair" | "poor" {
  if (dbm >= -60) return "good";
  if (dbm >= -75) return "fair";
  return "poor";
}

// Packet loss banding, in percent. 1% is where interactive traffic (voice,
// video, RDP) becomes noticeable; 3% is where it becomes unusable.
export function packetLossBand(pct: number): "good" | "fair" | "poor" {
  if (pct < 1) return "good";
  if (pct < 3) return "fair";
  return "poor";
}

// Median of a numeric series. Used instead of the mean for latency and boot
// time because both have long right tails — one machine that took 400 seconds
// to boot should not move the headline number for the fleet.
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Percentile (nearest-rank) of a numeric series. p95 latency is the number that
// corresponds to what people complain about; the average hides it.
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}
