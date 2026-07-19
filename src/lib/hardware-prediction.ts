// Predict hardware/capacity risk from a device's telemetry trend.
//
// This replaces hardcoded probabilities (0.85, 0.95) with least-squares
// regression over the real DeviceMetric series. The guiding rule: only emit a
// prediction a signal actually supports. If a device reports no battery data,
// there is no battery prediction — a fabricated one is exactly the thing this
// module exists to remove.

export type MetricSample = {
  createdAt: Date;
  diskPct: number | null;
  memUsedMb: number | null;
  memTotalMb: number | null;
  batteryPct: number | null;
};

export type Component = "DISK" | "BATTERY";
export type PredictionStatus = "WARNING" | "CRITICAL";

export type Prediction = {
  component: Component;
  probability: number; // 0–1
  status: PredictionStatus;
  predictedDate: Date | null; // when the threshold is projected to be crossed
  // Evidence, so the number is explainable rather than magic:
  evidence: {
    current: number; // latest fitted value (%)
    perDay: number; // slope, units/day
    r2: number; // goodness of fit 0–1
    samples: number;
    daysToThreshold: number | null;
  };
};

// The failure horizon: we only care about crossings within this many days.
const HORIZON_DAYS = 30;
// Below this many samples a trend isn't trustworthy.
const MIN_SAMPLES = 8;

type Fit = { slopePerMs: number; intercept: number; r2: number };

// Ordinary least squares of y over t (ms). Returns null if x has no variance
// (all samples at the same instant) — a slope would be undefined.
export function linearRegression(points: { t: number; y: number }[]): Fit | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.t; sy += p.y; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of points) {
    const dx = p.t - mx, dy = p.y - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  if (sxx === 0) return null;
  const slopePerMs = sxy / sxx;
  const intercept = my - slopePerMs * mx;
  // r² = explained / total variance. syy === 0 means a flat line — a perfect
  // fit, but with no trend (slope ~ 0), which downstream reads as "no risk".
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slopePerMs, intercept, r2 };
}

const MS_PER_DAY = 86_400_000;

// Fit one rising-metric signal (disk fills up, etc.) against a threshold and
// turn the projection into a bounded, explainable probability.
function predictRising(
  samples: { createdAt: Date; value: number | null }[],
  opts: { component: Component; threshold: number; criticalWithinDays: number }
): Prediction | null {
  const points = samples
    .filter((s) => s.value != null)
    .map((s) => ({ t: s.createdAt.getTime(), y: s.value as number }));
  if (points.length < MIN_SAMPLES) return null;

  const fit = linearRegression(points);
  if (!fit) return null;

  const latestT = points[points.length - 1].t;
  const current = fit.slopePerMs * latestT + fit.intercept;
  const perDay = fit.slopePerMs * MS_PER_DAY;

  // Already at/over threshold: this is a present risk, not a forecast.
  if (current >= opts.threshold) {
    return {
      component: opts.component,
      probability: 0.95,
      status: "CRITICAL",
      predictedDate: new Date(latestT),
      evidence: { current: round1(current), perDay: round2(perDay), r2: round2(fit.r2), samples: points.length, daysToThreshold: 0 },
    };
  }

  // Not rising meaningfully → no imminent exhaustion, so no prediction. A flat
  // or falling disk is the common healthy case; emitting nothing is correct.
  if (perDay <= 0.01) return null;

  const daysToThreshold = (opts.threshold - current) / perDay;
  if (daysToThreshold > HORIZON_DAYS) return null; // beyond the horizon we care about

  // Probability blends *how soon* with *how confident the trend is*. Proximity:
  // 1.0 at t=0, 0.0 at the horizon. Confidence: the fit's r². Floor the
  // confidence so a real, imminent crossing with a noisy fit isn't dismissed.
  const proximity = clamp01(1 - daysToThreshold / HORIZON_DAYS);
  const confidence = clamp01(Math.max(fit.r2, 0.35));
  const probability = round2(clamp01(0.2 + 0.8 * proximity * confidence));

  return {
    component: opts.component,
    probability,
    status: daysToThreshold <= opts.criticalWithinDays ? "CRITICAL" : "WARNING",
    predictedDate: new Date(latestT + daysToThreshold * MS_PER_DAY),
    evidence: { current: round1(current), perDay: round2(perDay), r2: round2(fit.r2), samples: points.length, daysToThreshold: Math.round(daysToThreshold) },
  };
}

// Battery health proxy: charge ceiling falling over time. Only meaningful once
// the agent actually reports batteryPct — until then this returns null and no
// battery prediction is made.
function predictBattery(samples: MetricSample[]): Prediction | null {
  const withBattery = samples.filter((s) => s.batteryPct != null);
  if (withBattery.length < MIN_SAMPLES) return null;

  const points = withBattery.map((s) => ({ t: s.createdAt.getTime(), y: s.batteryPct as number }));
  const fit = linearRegression(points);
  if (!fit) return null;

  const perDay = fit.slopePerMs * MS_PER_DAY;
  const latestT = points[points.length - 1].t;
  const current = fit.slopePerMs * latestT + fit.intercept;

  // Only a declining charge ceiling is a health signal.
  if (perDay >= -0.05) return null;

  const FLOOR = 40; // a battery whose ceiling trends below 40% is failing
  if (current <= FLOOR) {
    return {
      component: "BATTERY",
      probability: 0.9,
      status: "CRITICAL",
      predictedDate: new Date(latestT),
      evidence: { current: round1(current), perDay: round2(perDay), r2: round2(fit.r2), samples: points.length, daysToThreshold: 0 },
    };
  }
  const daysToFloor = (current - FLOOR) / -perDay;
  if (daysToFloor > HORIZON_DAYS) return null;

  const proximity = clamp01(1 - daysToFloor / HORIZON_DAYS);
  const confidence = clamp01(Math.max(fit.r2, 0.35));
  const probability = round2(clamp01(0.2 + 0.8 * proximity * confidence));
  return {
    component: "BATTERY",
    probability,
    status: daysToFloor <= 7 ? "CRITICAL" : "WARNING",
    predictedDate: new Date(latestT + daysToFloor * MS_PER_DAY),
    evidence: { current: round1(current), perDay: round2(perDay), r2: round2(fit.r2), samples: points.length, daysToThreshold: Math.round(daysToFloor) },
  };
}

// All defensible predictions for one device's series. Empty when nothing in the
// telemetry warrants a warning — the correct, honest answer for a healthy device.
export function predictForDevice(samples: MetricSample[]): Prediction[] {
  const sorted = [...samples].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const out: Prediction[] = [];

  const disk = predictRising(
    sorted.map((s) => ({ createdAt: s.createdAt, value: s.diskPct })),
    { component: "DISK", threshold: 92, criticalWithinDays: 7 }
  );
  if (disk) out.push(disk);

  const battery = predictBattery(sorted);
  if (battery) out.push(battery);

  return out;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
