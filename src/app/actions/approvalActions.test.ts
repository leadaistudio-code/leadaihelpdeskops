import { describe, it, expect, vi, beforeEach } from "vitest";

// See incidentActions.test.ts — mocked at the Clerk/Prisma boundary so the real
// role gate runs rather than a stub.
const { prismaMock, clerkMock } = vi.hoisted(() => ({
  prismaMock: {
    incident: { update: vi.fn(), findMany: vi.fn() },
    incidentNote: { create: vi.fn() },
    catalogRequest: { updateMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
  clerkMock: { currentUser: vi.fn(), auth: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => clerkMock.currentUser(),
  auth: () => clerkMock.auth(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/actions/notificationActions", () => ({ notify: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

import { approveRequest, rejectRequest } from "@/app/actions/approvalActions";

const ACME = "org_acme";

function signIn(role: "ADMIN" | "IT_AGENT" | "EMPLOYEE", domain = ACME, id = "user_1") {
  clerkMock.currentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: "a@acme.test" }],
    publicMetadata: { role, modules: ["SELF_SERVICE"] },
    firstName: "A",
    lastName: "User",
  });
  clerkMock.auth.mockResolvedValue({ orgId: domain });
  prismaMock.user.findUnique.mockResolvedValue({
    id, email: "a@acme.test", name: "A User", role, moduleAccess: ["SELF_SERVICE"], domain,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.incident.update.mockResolvedValue({
    callerId: "user_9", number: "REQ0010001", title: "t", domain: ACME,
  });
});

describe("approveRequest", () => {
  it("refuses an employee", async () => {
    signIn("EMPLOYEE");
    await expect(approveRequest("inc_1")).rejects.toThrow("Not authorized");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("scopes the approval to the caller's tenant", async () => {
    signIn("IT_AGENT", ACME);
    await approveRequest("inc_1");
    expect(prismaMock.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inc_1", domain: ACME } })
    );
  });

  it("scopes the linked catalog request too", async () => {
    signIn("IT_AGENT", ACME);
    await approveRequest("inc_1");
    expect(prismaMock.catalogRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { incidentId: "inc_1", domain: ACME } })
    );
  });
});

describe("rejectRequest", () => {
  it("refuses an employee", async () => {
    signIn("EMPLOYEE");
    await expect(rejectRequest("inc_1", "nope")).rejects.toThrow("Not authorized");
    expect(prismaMock.incident.update).not.toHaveBeenCalled();
  });

  it("scopes the rejection to the caller's tenant", async () => {
    signIn("IT_AGENT", ACME);
    await rejectRequest("inc_1", "nope");
    expect(prismaMock.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inc_1", domain: ACME } })
    );
  });
});
