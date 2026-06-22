import { describe, it, expect } from "vitest";
import { tokenize, scoreArticle, formatBytes } from "@/lib/text-rank";

describe("tokenize", () => {
  it("lowercases and drops short tokens and punctuation", () => {
    expect(tokenize("Can't connect to VPN!")).toEqual(["can", "connect", "vpn"]);
  });
  it("returns empty for no usable terms", () => {
    expect(tokenize("a, b; c")).toEqual([]);
  });
});

describe("scoreArticle", () => {
  it("weights title hits more than content hits", () => {
    const titleHit = scoreArticle("vpn", "VPN setup guide", "unrelated body");
    const contentHit = scoreArticle("vpn", "Unrelated", "how to use the vpn client");
    expect(titleHit).toBeGreaterThan(contentHit);
    expect(titleHit).toBe(3);
    expect(contentHit).toBe(1);
  });
  it("accumulates across multiple terms", () => {
    expect(scoreArticle("vpn password", "VPN password reset", "vpn password")).toBe(8);
  });
  it("returns 0 when nothing matches", () => {
    expect(scoreArticle("printer", "VPN guide", "network access")).toBe(0);
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
