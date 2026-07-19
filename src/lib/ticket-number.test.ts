import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { numberCounter: { upsert: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

import { allocateNumber, formatNumber, seriesForTicketType } from "@/lib/ticket-number";

const ACME = "org_acme";

beforeEach(() => vi.clearAllMocks());

describe("formatNumber", () => {
  it("pads to the legacy 7-digit format", () => {
    expect(formatNumber("INC", 10000)).toBe("INC0010000");
    expect(formatNumber("PRB", 1)).toBe("PRB0000001");
  });
});

describe("seriesForTicketType", () => {
  it("maps request to REQ and everything else to INC", () => {
    expect(seriesForTicketType("REQUEST")).toBe("REQ");
    expect(seriesForTicketType("INCIDENT")).toBe("INC");
  });
});

describe("allocateNumber", () => {
  it("keys the counter by tenant and series", async () => {
    prismaMock.numberCounter.upsert.mockResolvedValue({ last: 10001 });
    await allocateNumber(ACME, "INC");
    expect(prismaMock.numberCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { domain_series: { domain: ACME, series: "INC" } } })
    );
  });

  it("increments rather than counting rows", async () => {
    prismaMock.numberCounter.upsert.mockResolvedValue({ last: 10005 });
    expect(await allocateNumber(ACME, "INC")).toBe("INC0010005");
    expect(prismaMock.numberCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { last: { increment: 1 } } })
    );
  });

  it("starts a fresh tenant at the series base, preserving the old scheme", async () => {
    prismaMock.numberCounter.upsert.mockResolvedValue({ last: 10000 });
    await allocateNumber(ACME, "REQ");
    expect(prismaMock.numberCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { domain: ACME, series: "REQ", last: 10000 } })
    );

    prismaMock.numberCounter.upsert.mockResolvedValue({ last: 1 });
    expect(await allocateNumber(ACME, "PRB")).toBe("PRB0000001");
    expect(prismaMock.numberCounter.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ create: { domain: ACME, series: "PRB", last: 1 } })
    );
  });

  it("gives two tenants independent sequences", async () => {
    prismaMock.numberCounter.upsert.mockResolvedValue({ last: 10000 });
    expect(await allocateNumber("org_a", "INC")).toBe("INC0010000");
    expect(await allocateNumber("org_b", "INC")).toBe("INC0010000");
    // Same number in both tenants is now legal — that's the point of
    // @@unique([domain, number]) replacing a global unique on number.
    const domains = prismaMock.numberCounter.upsert.mock.calls.map(
      (c) => c[0].where.domain_series.domain
    );
    expect(domains).toEqual(["org_a", "org_b"]);
  });
});
