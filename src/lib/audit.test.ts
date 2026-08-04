import { describe, it, expect, vi, beforeEach } from "vitest";

// An in-memory stand-in for the AuditLog table, so the real chaining and
// verification logic runs end to end. Deliberately *not* enforcing the
// append-only trigger: the point of these tests is to tamper with history and
// prove the chain notices.
type Row = {
  id: string;
  domain: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  summary: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  seq: number;
  prevHash: string | null;
  hash: string | null;
};

const { table, prismaMock } = vi.hoisted(() => {
  const table: { rows: unknown[] } = { rows: [] };
  return {
    table,
    prismaMock: {
      auditLog: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const rows = table.rows as Row[];
          if (rows.some((r) => r.domain === data.domain && r.seq === data.seq)) {
            const e = new Error("Unique constraint failed") as Error & { code?: string };
            e.code = "P2002";
            throw e;
          }
          const row = { id: `a${rows.length + 1}`, ...data } as Row;
          rows.push(row);
          return row;
        }),
        findFirst: vi.fn(async ({ where, orderBy }: { where: { domain: string }; orderBy: Record<string, string> }) => {
          const rows = (table.rows as Row[]).filter((r) => r.domain === where.domain);
          const key = Object.keys(orderBy)[0] as "seq" | "createdAt";
          const sorted = [...rows].sort((a, b) =>
            key === "seq" ? b.seq - a.seq : b.createdAt.getTime() - a.createdAt.getTime()
          );
          return sorted[0] ?? null;
        }),
        findMany: vi.fn(async ({ where }: { where: { domain: string } }) =>
          (table.rows as Row[]).filter((r) => r.domain === where.domain).sort((a, b) => a.seq - b.seq)
        ),
        count: vi.fn(async () => (table.rows as Row[]).length),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/auth-utils", () => ({ getSessionUser: vi.fn(async () => null) }));
vi.mock("@/lib/observability", () => ({ logError: vi.fn() }));

import { logAudit, verifyAuditChain } from "@/lib/audit";

const ACME = "org_acme";
const OTHER = "org_other";

function entry(summary: string, domain = ACME) {
  return { domain, action: "UPDATE", entityType: "Incident", summary, actor: null };
}

beforeEach(() => {
  table.rows = [];
});

describe("logAudit chaining", () => {
  it("numbers entries from 1 and links each to its predecessor", async () => {
    await logAudit(entry("first"));
    await logAudit(entry("second"));
    await logAudit(entry("third"));

    const rows = table.rows as Row[];
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3]);
    expect(rows[0].prevHash).toBeNull();
    expect(rows[1].prevHash).toBe(rows[0].hash);
    expect(rows[2].prevHash).toBe(rows[1].hash);
  });

  it("keeps a separate chain per tenant", async () => {
    await logAudit(entry("acme one", ACME));
    await logAudit(entry("other one", OTHER));
    await logAudit(entry("acme two", ACME));

    const rows = table.rows as Row[];
    // Each tenant restarts at seq 1 — one tenant's activity must not be
    // inferable from gaps in another's sequence.
    expect(rows.filter((r) => r.domain === ACME).map((r) => r.seq)).toEqual([1, 2]);
    expect(rows.filter((r) => r.domain === OTHER).map((r) => r.seq)).toEqual([1]);
    expect(rows.find((r) => r.domain === OTHER)!.prevHash).toBeNull();
  });

  it("never throws into the caller's path when the write fails", async () => {
    prismaMock.auditLog.findFirst.mockRejectedValueOnce(new Error("database is down"));
    await expect(logAudit(entry("during an outage"))).resolves.toBeUndefined();
  });
});

describe("verifyAuditChain", () => {
  it("passes on an untampered chain", async () => {
    await logAudit(entry("one"));
    await logAudit(entry("two"));

    const result = await verifyAuditChain(ACME);
    expect(result.ok).toBe(true);
    expect(result.checked).toBe(2);
  });

  it("passes on an empty log", async () => {
    expect((await verifyAuditChain(ACME)).ok).toBe(true);
  });

  it("detects an edited entry", async () => {
    await logAudit(entry("granted admin to alice"));
    await logAudit(entry("something later"));

    // Someone with DATABASE_URL rewrites history.
    (table.rows as Row[])[0].summary = "routine maintenance";

    const result = await verifyAuditChain(ACME);
    expect(result.ok).toBe(false);
    expect(result.brokenAtSeq).toBe(1);
    expect(result.reason).toMatch(/hash/i);
  });

  it("detects a deleted entry", async () => {
    await logAudit(entry("one"));
    await logAudit(entry("two"));
    await logAudit(entry("three"));

    table.rows = (table.rows as Row[]).filter((r) => r.seq !== 2);

    const result = await verifyAuditChain(ACME);
    expect(result.ok).toBe(false);
    expect(result.brokenAtSeq).toBe(3);
    expect(result.reason).toMatch(/deleted|gap/i);
  });

  it("detects a re-dated entry", async () => {
    await logAudit(entry("one"));
    await logAudit(entry("two"));

    // Timestamps are covered by the hash, so backdating an action to sit
    // outside an audit window is also caught.
    (table.rows as Row[])[1].createdAt = new Date("2020-01-01T00:00:00Z");

    const result = await verifyAuditChain(ACME);
    expect(result.ok).toBe(false);
    expect(result.brokenAtSeq).toBe(2);
  });

  it("does not report a gap when legacy rows occupy the early sequence numbers", async () => {
    // A database with audit history predating the migration has legacy rows at
    // seq 1..N, so the first hashed row starts at N+1. That is a migration
    // artefact, not tampering, and every existing deployment hits it.
    const legacy = (seq: number): Row => ({
      id: `legacy-${seq}`,
      domain: ACME,
      actorId: null,
      actorName: "System",
      actorEmail: null,
      action: "UPDATE",
      entityType: "Incident",
      entityId: null,
      entityLabel: null,
      summary: `backfilled ${seq}`,
      field: null,
      oldValue: null,
      newValue: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      seq,
      prevHash: null,
      hash: null,
    });
    (table.rows as Row[]).push(legacy(1), legacy(2), legacy(3));

    await logAudit(entry("first hashed entry"));
    await logAudit(entry("second hashed entry"));

    const result = await verifyAuditChain(ACME);
    expect(result.ok).toBe(true);
    expect((table.rows as Row[]).slice(3).map((r) => r.seq)).toEqual([4, 5]);
  });

  it("skips legacy rows written before the chain existed", async () => {
    // Pre-migration rows have no hash. They are outside the guarantee, but they
    // must not be reported as tampering or every existing deploy looks breached.
    (table.rows as Row[]).push({
      id: "legacy",
      domain: ACME,
      actorId: null,
      actorName: "System",
      actorEmail: null,
      action: "UPDATE",
      entityType: "Incident",
      entityId: null,
      entityLabel: null,
      summary: "written before hashing",
      field: null,
      oldValue: null,
      newValue: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      seq: 0,
      prevHash: null,
      hash: null,
    });
    await logAudit(entry("after the migration"));

    expect((await verifyAuditChain(ACME)).ok).toBe(true);
  });
});
