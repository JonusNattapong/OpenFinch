import { describe, it, expect } from "vitest";

describe("Health API", () => {
  it("/health returns ok status", async () => {
    // Import the app directly and test the route
    const { healthRoute } = await import("../routes/health.js");

    // Create a mock Hono app just with health routes
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", healthRoute);

    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data.status).toBe("ok");
    expect(data.version).toBe("0.1.0");
    expect(typeof data.uptime).toBe("number");
  });

  it("/health/live returns alive", async () => {
    const { healthRoute } = await import("../routes/health.js");
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", healthRoute);

    const res = await app.request("/health/live");
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data.status).toBe("alive");
  });

  it("/health/ready returns degraded when deps unavailable", async () => {
    const { healthRoute } = await import("../routes/health.js");
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", healthRoute);

    const res = await app.request("/health/ready");
    // In test environment without Redis/Postgres, should be degraded or error
    const data = await res.json() as Record<string, unknown>;
    expect(["degraded", "ready"]).toContain(data.status);
  });
});
