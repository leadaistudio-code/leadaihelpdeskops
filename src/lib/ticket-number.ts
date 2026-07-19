import prisma from "@/lib/prisma";

export type NumberSeries = "INC" | "REQ" | "PRB";

// Where a tenant's numbering starts when it has no counter row yet. These match
// the bases the old count()-derived scheme produced, so numbering is continuous
// for tenants that already have tickets.
const SERIES_BASE: Record<NumberSeries, number> = { INC: 10000, REQ: 10000, PRB: 1 };

export function formatNumber(series: NumberSeries, value: number) {
  return `${series}${String(value).padStart(7, "0")}`;
}

// Allocate the next ticket number for a tenant.
//
// The upsert compiles to a single INSERT ... ON CONFLICT DO UPDATE, so the
// increment happens under a row lock and two concurrent creates get two
// different numbers. Contrast the previous count()+1 approach, where both reads
// saw the same count and produced the same number.
export async function allocateNumber(domain: string, series: NumberSeries): Promise<string> {
  const row = await prisma.numberCounter.upsert({
    where: { domain_series: { domain, series } },
    create: { domain, series, last: SERIES_BASE[series] },
    update: { last: { increment: 1 } },
    select: { last: true },
  });
  return formatNumber(series, row.last);
}

export function seriesForTicketType(type: "INCIDENT" | "REQUEST"): NumberSeries {
  return type === "REQUEST" ? "REQ" : "INC";
}
