import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = "test:allow-then-block";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    expect(rateLimit(key, 3, 60_000).ok).toBe(false);
  });

  it("tracks remaining correctly", () => {
    const key = "test:remaining";
    expect(rateLimit(key, 2, 60_000).remaining).toBe(1);
    expect(rateLimit(key, 2, 60_000).remaining).toBe(0);
  });

  it("isolates separate keys", () => {
    expect(rateLimit("test:key-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("test:key-b", 1, 60_000).ok).toBe(true);
    expect(rateLimit("test:key-a", 1, 60_000).ok).toBe(false);
  });
});
