import { describe, it, expect } from "vitest";
import { normalizeOsUser, pickOwner, type OwnerCandidate } from "@/lib/device-owner";

const users: OwnerCandidate[] = [
  { id: "u_santosh", name: "Santosh Rawat", email: "santosh.rawat@acme.com" },
  { id: "u_ada", name: "Ada Lovelace", email: "ada@acme.com" },
  { id: "u_ada2", name: "Ada Byron", email: "ada.byron@acme.com" },
];

describe("normalizeOsUser", () => {
  it("strips domain prefixes, host suffixes, and case", () => {
    expect(normalizeOsUser("CORP\\JDoe")).toBe("jdoe");
    expect(normalizeOsUser("jdoe@LAPTOP-1")).toBe("jdoe");
    expect(normalizeOsUser("  Ada  ")).toBe("ada");
  });
  it("returns null for empty input", () => {
    expect(normalizeOsUser(null)).toBeNull();
    expect(normalizeOsUser("")).toBeNull();
    expect(normalizeOsUser("   ")).toBeNull();
  });
});

describe("pickOwner", () => {
  it("matches on email local-part", () => {
    expect(pickOwner(users, "santosh.rawat")).toBe("u_santosh");
  });

  it("matches on full name with separators normalized", () => {
    // No email local-part is "santosh rawat"; falls through to the name match.
    expect(pickOwner(users, "Santosh_Rawat")).toBe("u_santosh");
  });

  it("refuses to guess when the match is ambiguous", () => {
    // "ada" matches ada@acme.com's local-part uniquely...
    expect(pickOwner(users, "ada")).toBe("u_ada");
    // ...but a bare first name shared by two people has no unique match.
    const twoAdas: OwnerCandidate[] = [
      { id: "a1", name: "Ada One", email: "ada@x.com" },
      { id: "a2", name: "Ada Two", email: "ada@y.com" },
    ];
    expect(pickOwner(twoAdas, "ada")).toBeNull();
  });

  it("returns null when nothing matches — never a wrong link", () => {
    expect(pickOwner(users, "unknown.person")).toBeNull();
    expect(pickOwner(users, null)).toBeNull();
  });
});
