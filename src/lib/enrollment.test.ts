import { describe, it, expect } from "vitest";
import { tokenState, newEnrollmentTokenValue, DEFAULT_ENROLLMENT_TTL_HOURS } from "@/lib/enrollment";

const HOUR = 3_600_000;

function token(over: Partial<Parameters<typeof tokenState>[0]> = {}) {
  return {
    revokedAt: null,
    expiresAt: new Date(Date.now() + HOUR),
    useCount: 0,
    maxUses: 1,
    ...over,
  };
}

describe("tokenState", () => {
  it("accepts a fresh, unused, unexpired token", () => {
    expect(tokenState(token())).toBe("ACTIVE");
  });

  it("rejects a revoked token even while it is otherwise valid", () => {
    // Revocation must win over every other signal — that is the whole point of
    // being able to revoke.
    expect(tokenState(token({ revokedAt: new Date() }))).toBe("REVOKED");
  });

  it("rejects an expired token", () => {
    expect(tokenState(token({ expiresAt: new Date(Date.now() - 1_000) }))).toBe("EXPIRED");
  });

  it("rejects a token that has been used up", () => {
    expect(tokenState(token({ useCount: 1, maxUses: 1 }))).toBe("EXHAUSTED");
  });

  it("still accepts a multi-use token with uses remaining", () => {
    expect(tokenState(token({ useCount: 3, maxUses: 10 }))).toBe("ACTIVE");
  });

  it("treats an exactly-now expiry as expired, not active", () => {
    expect(tokenState(token({ expiresAt: new Date(Date.now()) }))).toBe("EXPIRED");
  });
});

describe("newEnrollmentTokenValue", () => {
  it("is prefixed and long enough to resist guessing", () => {
    const v = newEnrollmentTokenValue();
    expect(v.startsWith("enr_")).toBe(true);
    // Two UUIDs' worth of hex — 256 bits of entropy.
    expect(v.length).toBe("enr_".length + 64);
  });

  it("does not repeat", () => {
    const values = new Set(Array.from({ length: 200 }, newEnrollmentTokenValue));
    expect(values.size).toBe(200);
  });
});

describe("defaults", () => {
  it("expires within a day by default", () => {
    expect(DEFAULT_ENROLLMENT_TTL_HOURS).toBeLessThanOrEqual(24);
  });
});
