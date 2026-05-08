import { describe, it, expect } from "vitest";

describe("CLI module", () => {
  it("can import doctor module", async () => {
    const doctor = await import("../doctor.js");
    expect(doctor.runDoctor).toBeDefined();
    expect(typeof doctor.runDoctor).toBe("function");
  });

  it("doctor.runDoctor returns check results", async () => {
    const { runDoctor } = await import("../doctor.js");
    // Run in silent mode - should return results without throwing
    const results = await runDoctor();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("status");
      expect(r).toHaveProperty("detail");
      expect(["ok", "warn", "fail", "skip"]).toContain(r.status);
    }
  });
});
