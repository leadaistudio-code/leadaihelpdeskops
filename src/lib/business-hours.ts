/*
  Business-hours calculator for the live SLA engine.

  Two schedules are supported:
   - ALWAYS   → 24x7, plain calendar time.
   - BUSINESS → Mon–Fri, 09:00–17:00 (8h/day), computed in UTC.

  BUSINESS is deliberately UTC-based to stay deterministic without a
  per-tenant timezone column; swap WORK_START_H/WORK_END_H (and add a tz
  offset) here when tenant calendars are introduced.
*/

export type Schedule = "ALWAYS" | "BUSINESS";

const WORK_START_H = 9; // 09:00
const WORK_END_H = 17; // 17:00
const DAY_MS = 86_400_000;

function isWorkday(d: Date): boolean {
  const g = d.getUTCDay(); // 0 Sun … 6 Sat
  return g >= 1 && g <= 5;
}

function windowFor(d: Date): [number, number] {
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), WORK_START_H);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), WORK_END_H);
  return [start, end];
}

function nextWorkStart(d: Date): Date {
  let day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, WORK_START_H));
  while (!isWorkday(day)) day = new Date(day.getTime() + DAY_MS);
  return day;
}

/** Business milliseconds elapsed between two instants (0 if b <= a). */
export function businessMsBetween(a: Date, b: Date): number {
  if (b.getTime() <= a.getTime()) return 0;
  let total = 0;
  let cursor = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()));
  const endGuard = b.getTime();
  for (let i = 0; i < 3660 && cursor.getTime() <= endGuard; i++) {
    if (isWorkday(cursor)) {
      const [ws, we] = windowFor(cursor);
      const s = Math.max(a.getTime(), ws);
      const e = Math.min(b.getTime(), we);
      if (e > s) total += e - s;
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return total;
}

/** Add `ms` of business time to `start`, returning the resulting instant. */
export function addBusinessMs(start: Date, ms: number): Date {
  if (ms <= 0) return new Date(start);
  let remaining = ms;
  let cursor = new Date(start);
  for (let guard = 0; guard < 3660; guard++) {
    if (!isWorkday(cursor)) {
      cursor = nextWorkStart(cursor);
      continue;
    }
    const [ws, we] = windowFor(cursor);
    let c = cursor.getTime();
    if (c < ws) c = ws;
    if (c >= we) {
      cursor = nextWorkStart(cursor);
      continue;
    }
    const avail = we - c;
    if (remaining <= avail) return new Date(c + remaining);
    remaining -= avail;
    cursor = nextWorkStart(cursor);
  }
  return new Date(cursor); // safety fallback (>10y of work time)
}

/** Effective due instant for a target duration under a schedule. */
export function dueDate(start: Date, hours: number, schedule: Schedule): Date {
  const ms = hours * 3_600_000;
  return schedule === "BUSINESS" ? addBusinessMs(start, ms) : new Date(start.getTime() + ms);
}

/** Elapsed time between two instants under a schedule. */
export function elapsedMs(from: Date, to: Date, schedule: Schedule): number {
  return schedule === "BUSINESS"
    ? businessMsBetween(from, to)
    : Math.max(0, to.getTime() - from.getTime());
}
