import { describe, it, expect } from "vitest";

describe("Cache behavior (in-memory)", () => {
  it("stores and retrieves values via internal module", async () => {
    // Direct test of the memory cache logic without Redis dependency
    const { cacheSet, cacheGet } = await import("../lib/cache.js");
    // Use a unique key to avoid collisions
    const key = `test-${Date.now()}`;
    await cacheSet(key, { hello: "world" }, 60);
    const result = await cacheGet<{ hello: string }>(key);
    expect(result).toEqual({ hello: "world" });
  });

  it("returns null for missing keys", async () => {
    const { cacheGet } = await import("../lib/cache.js");
    const result = await cacheGet(`nonexistent-${Date.now()}`);
    expect(result).toBeNull();
  });
});
