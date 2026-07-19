import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock at the Prisma / action boundary so the real scoping logic in
// executeChatTool runs — these tests exist to prove tools can't reach outside
// the viewer + tenant.
const { prismaMock, createIncidentMock } = vi.hoisted(() => ({
  prismaMock: {
    knowledgeArticle: { findMany: vi.fn() },
    incident: { findMany: vi.fn() },
    device: { findFirst: vi.fn() },
  },
  createIncidentMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/app/actions/incidentActions", () => ({ createIncident: createIncidentMock }));

import { executeChatTool, TOOL_SCHEMAS, type Viewer } from "@/lib/chat-tools";

const ACME = "org_acme";
const viewer: Viewer = { id: "user_1", name: "Ada Lovelace", role: "EMPLOYEE" };

beforeEach(() => vi.clearAllMocks());

describe("TOOL_SCHEMAS", () => {
  it("exposes no user-identity parameter on any tool", () => {
    // The model must never be able to name whose data to fetch — identity comes
    // from the session only.
    for (const schema of Object.values(TOOL_SCHEMAS)) {
      const keys = Object.keys(schema.shape);
      expect(keys).not.toContain("userId");
      expect(keys).not.toContain("callerId");
      expect(keys).not.toContain("email");
    }
  });
});

describe("search_knowledge_base", () => {
  it("scopes the query to the viewer's tenant", async () => {
    prismaMock.knowledgeArticle.findMany.mockResolvedValue([]);
    await executeChatTool("search_knowledge_base", { query: "vpn" }, viewer, ACME);
    const where = prismaMock.knowledgeArticle.findMany.mock.calls[0][0].where;
    expect(where.domain).toBe(ACME);
    expect(where.isPublished).toBe(true);
  });
});

describe("get_my_tickets", () => {
  it("filters to the viewer's own tickets in their tenant", async () => {
    prismaMock.incident.findMany.mockResolvedValue([]);
    await executeChatTool("get_my_tickets", {}, viewer, ACME);
    expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { domain: ACME, callerId: "user_1" } })
    );
  });
});

describe("get_my_device_health", () => {
  it("prefers the authoritative owner link before falling back to name", async () => {
    prismaMock.device.findFirst.mockResolvedValue(null);
    await executeChatTool("get_my_device_health", {}, viewer, ACME);

    // First query is the owner link, scoped to the viewer + tenant.
    expect(prismaMock.device.findFirst.mock.calls[0][0].where).toMatchObject({
      domain: ACME,
      ownerId: "user_1",
    });
    // Fallback only searches devices with no owner, matched by name.
    expect(prismaMock.device.findFirst.mock.calls[1][0].where).toEqual({
      domain: ACME,
      ownerId: null,
      user: { contains: "Ada Lovelace", mode: "insensitive" },
    });
  });

  it("does not fall back to a name match when a device is already owned", async () => {
    prismaMock.device.findFirst.mockResolvedValueOnce({
      hostname: "WS-1", cpuPct: 12, memUsedMb: 4000, memTotalMb: 8000,
      diskPct: 40, batteryPct: 90, latencyMs: 20, lastSeenAt: new Date(0),
    });
    const res = await executeChatTool("get_my_device_health", {}, viewer, ACME);
    expect(prismaMock.device.findFirst).toHaveBeenCalledTimes(1); // no fallback
    expect(res).toMatchObject({ matched: true, device: { hostname: "WS-1" } });
  });

  it("skips the name fallback when the user has no name on file", async () => {
    prismaMock.device.findFirst.mockResolvedValue(null); // no owned device
    const res = await executeChatTool("get_my_device_health", {}, { ...viewer, name: null }, ACME);
    expect(prismaMock.device.findFirst).toHaveBeenCalledTimes(1); // owner query only
    expect(res).toMatchObject({ matched: false });
  });
});

describe("create_ticket", () => {
  it("forces callerId to the viewer, never a model-supplied id", async () => {
    createIncidentMock.mockResolvedValue({ number: "INC0010001", id: "inc_1" });
    // Even if the model smuggles a callerId in the input, it must be ignored.
    const res = await executeChatTool(
      "create_ticket",
      { title: "Laptop won't boot", description: "black screen", callerId: "user_victim" },
      viewer,
      ACME
    );
    expect(createIncidentMock).toHaveBeenCalledWith(
      expect.objectContaining({ callerId: "user_1", title: "Laptop won't boot" })
    );
    // The smuggled id must not have reached createIncident.
    expect(createIncidentMock.mock.calls[0][0].callerId).toBe("user_1");
    expect(res).toMatchObject({ created: true, number: "INC0010001" });
  });

  it("refuses to file without a title", async () => {
    const res = await executeChatTool("create_ticket", { description: "x" }, viewer, ACME);
    expect(res).toMatchObject({ created: false });
    expect(createIncidentMock).not.toHaveBeenCalled();
  });
});
