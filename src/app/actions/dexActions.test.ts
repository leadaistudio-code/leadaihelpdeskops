import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocked at the Clerk/Prisma boundary so the real role + tenant gate in
// assignDeviceOwner runs.
const { prismaMock, clerkMock } = vi.hoisted(() => ({
  prismaMock: {
    device: { updateMany: vi.fn() },
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
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/hardware-prediction", () => ({ predictForDevice: vi.fn(() => []) }));
vi.mock("ai", () => ({ generateText: vi.fn(), generateObject: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn() }));

import { assignDeviceOwner } from "@/app/actions/dexActions";

const ACME = "org_acme";
const EVIL = "org_evil";

function signIn(role: "ADMIN" | "IT_AGENT" | "EMPLOYEE", domain = ACME) {
  clerkMock.currentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: "a@acme.test" }],
    publicMetadata: { role, modules: ["SELF_SERVICE"] },
    firstName: "A", lastName: "User",
  });
  clerkMock.auth.mockResolvedValue({ orgId: domain });
  prismaMock.user.findUnique.mockResolvedValue({
    id: "agent_1", email: "a@acme.test", name: "A User", role, moduleAccess: ["SELF_SERVICE"], domain,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("assignDeviceOwner", () => {
  it("refuses an employee", async () => {
    signIn("EMPLOYEE");
    await expect(assignDeviceOwner("dev_1", "user_2")).rejects.toThrow("Not authorized");
    expect(prismaMock.device.updateMany).not.toHaveBeenCalled();
  });

  it("refuses an owner from another tenant", async () => {
    signIn("IT_AGENT", ACME);
    prismaMock.user.findFirst.mockResolvedValue(null); // owner not in ACME
    await expect(assignDeviceOwner("dev_1", "user_evil")).rejects.toThrow("not in this tenant");
    expect(prismaMock.device.updateMany).not.toHaveBeenCalled();
  });

  it("scopes the device write by domain", async () => {
    signIn("IT_AGENT", ACME);
    prismaMock.user.findFirst.mockResolvedValue({ id: "user_2" });
    prismaMock.device.updateMany.mockResolvedValue({ count: 1 });

    await assignDeviceOwner("dev_1", "user_2");

    expect(prismaMock.device.updateMany).toHaveBeenCalledWith({
      where: { id: "dev_1", domain: ACME },
      data: { ownerId: "user_2" },
    });
  });

  it("cannot reach a device in another tenant", async () => {
    signIn("IT_AGENT", EVIL);
    prismaMock.user.findFirst.mockResolvedValue({ id: "user_2" });
    prismaMock.device.updateMany.mockResolvedValue({ count: 0 }); // nothing matched in EVIL
    await expect(assignDeviceOwner("dev_acme", "user_2")).rejects.toThrow("Device not found");
  });

  it("allows clearing the owner (null) without a tenant check", async () => {
    signIn("ADMIN", ACME);
    prismaMock.device.updateMany.mockResolvedValue({ count: 1 });
    await assignDeviceOwner("dev_1", null);
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.device.updateMany).toHaveBeenCalledWith({
      where: { id: "dev_1", domain: ACME },
      data: { ownerId: null },
    });
  });
});
