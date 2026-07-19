import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocked at the Clerk/Prisma boundary so the real getSessionUser/requireAgent
// logic runs — these tests are about the tenant + role gates, so stubbing the
// gates themselves would defeat the point.

// vi.hoisted: vi.mock factories are lifted above module scope, so the mocks
// they close over have to be lifted too.
const { prismaMock, clerkMock } = vi.hoisted(() => ({
  prismaMock: {
    incident: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
    incidentNote: { create: vi.fn() },
    user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
  clerkMock: { currentUser: vi.fn(), auth: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => clerkMock.currentUser(),
  auth: () => clerkMock.auth(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/actions/notificationActions", () => ({ notify: vi.fn(), notifyGroup: vi.fn() }));
vi.mock("@/app/actions/groupActions", () => ({ resolveGroupByName: vi.fn() }));
vi.mock("@/app/actions/slaActions", () => ({
  startSlaForIncident: vi.fn(),
  pauseSla: vi.fn(),
  resumeSla: vi.fn(),
  stopSla: vi.fn(),
  escalateIfBreached: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("ai", () => ({ generateObject: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn() }));

import { updateIncidentState, assignIncident, addIncidentNote } from "@/app/actions/incidentActions";

const ACME = "org_acme";
const EVIL = "org_evil";

// Sign in as a user of `domain` holding `role`. Mirrors the Clerk/DB shape
// getSessionUser expects, matched so it takes the no-write path.
function signIn(role: "ADMIN" | "IT_AGENT" | "EMPLOYEE", domain = ACME, id = "user_1") {
  clerkMock.currentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: "a@acme.test" }],
    publicMetadata: { role, modules: ["SELF_SERVICE"] },
    firstName: "A",
    lastName: "User",
  });
  clerkMock.auth.mockResolvedValue({ orgId: domain });
  prismaMock.user.findUnique.mockResolvedValue({
    id,
    email: "a@acme.test",
    name: "A User",
    role,
    moduleAccess: ["SELF_SERVICE"],
    domain,
  });
  return { id, role, domain };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateIncidentState", () => {
  it("refuses an employee", async () => {
    signIn("EMPLOYEE");
    await expect(updateIncidentState("inc_1", "CLOSED")).rejects.toThrow("Not authorized");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("refuses an agent reaching into another tenant's ticket", async () => {
    signIn("IT_AGENT", EVIL);
    prismaMock.incident.findFirst.mockResolvedValue(null); // not in EVIL's domain
    await expect(updateIncidentState("inc_acme", "CLOSED")).rejects.toThrow("Incident not found");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("scopes the write by domain, not just the read", async () => {
    signIn("IT_AGENT", ACME);
    prismaMock.incident.findFirst.mockResolvedValue({
      status: "NEW", callerId: "user_9", number: "INC0010001", title: "t", domain: ACME,
    });
    prismaMock.incident.update.mockResolvedValue({ id: "inc_1", status: "IN_PROGRESS" });

    await updateIncidentState("inc_1", "IN_PROGRESS");

    expect(prismaMock.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inc_1", domain: ACME } })
    );
  });
});

describe("assignIncident", () => {
  it("refuses an employee", async () => {
    signIn("EMPLOYEE");
    await expect(assignIncident("inc_1", "user_2")).rejects.toThrow("Not authorized");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("refuses an assignee from another tenant", async () => {
    signIn("IT_AGENT", ACME);
    prismaMock.user.findFirst.mockResolvedValue(null); // no such agent in ACME
    await expect(assignIncident("inc_1", "user_evil")).rejects.toThrow("not an agent in this tenant");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("scopes the write by domain", async () => {
    signIn("IT_AGENT", ACME);
    prismaMock.user.findFirst.mockResolvedValue({ name: "Agent Smith" });
    prismaMock.incident.update.mockResolvedValue({ number: "INC0010001", title: "t", domain: ACME });

    await assignIncident("inc_1", "user_2");

    expect(prismaMock.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inc_1", domain: ACME } })
    );
  });
});

describe("addIncidentNote", () => {
  it("refuses a forged SYSTEM entry", async () => {
    signIn("ADMIN");
    await expect(addIncidentNote("inc_1", "fake audit line", "SYSTEM")).rejects.toThrow("Invalid note type");
    expect(prismaMock.incidentNote.create).not.toHaveBeenCalled();
  });

  it("refuses a note on another tenant's ticket", async () => {
    signIn("IT_AGENT", EVIL);
    prismaMock.incident.findFirst.mockResolvedValue(null);
    await expect(addIncidentNote("inc_acme", "hello")).rejects.toThrow("Incident not found");
    expect(prismaMock.incidentNote.create).not.toHaveBeenCalled();
  });

  it("refuses an internal work note from an employee", async () => {
    signIn("EMPLOYEE", ACME, "user_1");
    prismaMock.incident.findFirst.mockResolvedValue({
      callerId: "user_1", assigneeId: null, number: "INC0010001",
    });
    await expect(addIncidentNote("inc_1", "sneaky", "WORK_NOTE")).rejects.toThrow("Not authorized");
    expect(prismaMock.incidentNote.create).not.toHaveBeenCalled();
  });

  it("refuses an employee commenting on a colleague's ticket", async () => {
    signIn("EMPLOYEE", ACME, "user_1");
    prismaMock.incident.findFirst.mockResolvedValue({
      callerId: "user_someone_else", assigneeId: null, number: "INC0010001",
    });
    await expect(addIncidentNote("inc_1", "hello")).rejects.toThrow("Not authorized");
    expect(prismaMock.incidentNote.create).not.toHaveBeenCalled();
  });

  it("lets an employee comment on their own ticket", async () => {
    signIn("EMPLOYEE", ACME, "user_1");
    prismaMock.incident.findFirst.mockResolvedValue({
      callerId: "user_1", assigneeId: null, number: "INC0010001",
    });
    await addIncidentNote("inc_1", "any update?");
    expect(prismaMock.incidentNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ incidentId: "inc_1", type: "COMMENT", authorId: "user_1" }),
      })
    );
  });
});
