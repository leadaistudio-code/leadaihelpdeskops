import { describe, it, expect } from "vitest";
import { attachmentVisibleTo } from "@/lib/attachment-access";

const ACME = "org_acme";

describe("attachmentVisibleTo", () => {
  it("scopes staff to their own tenant via both parents", () => {
    const where = attachmentVisibleTo({ id: "u1", role: "IT_AGENT" }, ACME);
    expect(where).toEqual({
      OR: [{ incident: { domain: ACME } }, { article: { domain: ACME } }],
    });
  });

  it("additionally restricts an employee to tickets they raised", () => {
    const where = attachmentVisibleTo({ id: "u1", role: "EMPLOYEE" }, ACME);
    expect(where).toEqual({
      OR: [{ incident: { domain: ACME, callerId: "u1" } }, { article: { domain: ACME } }],
    });
  });

  it("never omits the domain constraint for any role", () => {
    for (const role of ["ADMIN", "IT_AGENT", "EMPLOYEE"] as const) {
      const where = attachmentVisibleTo({ id: "u1", role }, ACME);
      // Every branch must pin the tenant; a branch without `domain` would make
      // the whole OR reachable across tenants.
      for (const branch of where.OR!) {
        const parent = Object.values(branch)[0] as { domain?: string };
        expect(parent.domain).toBe(ACME);
      }
    }
  });
});
