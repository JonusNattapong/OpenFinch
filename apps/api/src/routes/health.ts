import { Hono } from "hono";
import { config } from "../lib/config.js";

export const healthRoute = new Hono();

// Basic health — always responds
healthRoute.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      postgres: true,
      redis: true,
      searxng: true,
      minio: true,
    },
  });
});

// Liveness — API is alive and responding
healthRoute.get("/health/live", (c) => {
  return c.json({
    status: "alive",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

async function checkRedis(): Promise<boolean> {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: config.redisUrl });
    client.on("error", () => {});
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    return false;
  }
}

async function checkPostgres(): Promise<boolean> {
  try {
    const sql = (await import("postgres")).default(config.databaseUrl, { max: 1, connect_timeout: 3 });
    await sql`SELECT 1`;
    await sql.end({ timeout: 3 });
    return true;
  } catch {
    return false;
  }
}

async function checkSearXNG(): Promise<boolean> {
  try {
    const baseUrl = config.searxngUrl.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/search?q=health&format=json`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkBrowserWorker(): Promise<boolean> {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: config.redisUrl });
    client.on("error", () => {});
    await client.connect();
    // Check if browser worker has registered recently
    const workers = await client.sMembers("bull:browser:workers");
    await client.quit();
    return workers.length > 0;
  } catch {
    return false;
  }
}

async function checkAgentWorker(): Promise<boolean> {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: config.redisUrl });
    client.on("error", () => {});
    await client.connect();
    const workers = await client.sMembers("bull:agent:workers");
    await client.quit();
    return workers.length > 0;
  } catch {
    return false;
  }
}

// Readiness — checks dependencies
healthRoute.get("/health/ready", async (c) => {
  const [redis, postgres, searxng] = await Promise.all([
    checkRedis(),
    checkPostgres(),
    checkSearXNG(),
  ]);

  const allReady = redis && postgres && searxng;

  return c.json({
    status: allReady ? "ready" : "degraded",
    checks: {
      redis: { status: redis ? "ok" : "fail" },
      postgres: { status: postgres ? "ok" : "fail" },
      searxng: { status: searxng ? "ok" : "fail" },
    },
    timestamp: new Date().toISOString(),
  }, allReady ? 200 : 503);
});

// Detailed health — all checks including workers
healthRoute.get("/health/detail", async (c) => {
  const [redis, postgres, searxng, browserWorker, agentWorker] = await Promise.all([
    checkRedis(),
    checkPostgres(),
    checkSearXNG(),
    checkBrowserWorker(),
    checkAgentWorker(),
  ]);

  return c.json({
    status: "ok",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      api: { status: "ok" },
      redis: { status: redis ? "ok" : "fail" },
      postgres: { status: postgres ? "ok" : "fail" },
      searxng: { status: searxng ? "ok" : "fail" },
      "browser-worker": { status: browserWorker ? "ok" : "unavailable" },
      "agent-worker": { status: agentWorker ? "ok" : "unavailable" },
    },
  });
});
