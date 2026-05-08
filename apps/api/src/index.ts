import { serve, ServerType } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoute } from "./routes/health.js";
import { searchRoute } from "./routes/search.js";
import { fetchRoute } from "./routes/fetch.js";
import { browserRoute } from "./routes/browser.js";
import { extractRoute } from "./routes/extract.js";
import { agentRoute } from "./routes/agent.js";
import { config } from "./lib/config.js";
import { checkRequiredEnv } from "./lib/env-validator.js";
import { traceIdMiddleware } from "./middleware/error-handler.js";

// Validate environment on startup
try {
  checkRequiredEnv();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

const app = new Hono();

// Global middleware (order matters)
app.use("*", cors());
app.use("*", logger());
app.use("*", traceIdMiddleware);
app.onError((err, c) => {
  return c.json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    traceId: crypto.randomUUID(),
  }, 500);
});

// Routes
app.route("/", healthRoute);
app.route("/", searchRoute);
app.route("/", fetchRoute);
app.route("/", browserRoute);
app.route("/", extractRoute);
app.route("/", agentRoute);

const port = config.apiPort;
const server: ServerType = serve({ fetch: app.fetch, port });

console.log(`[openfinch] API server started on port ${port}`);

// Graceful shutdown
let shuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n[openfinch] Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(async () => {
    console.log("[openfinch] HTTP server closed");

    // Close queue connections
    try {
      const { searchQueue, fetchQueue, browserQueue, agentQueue } = await import("./lib/queue.js");
      await Promise.allSettled([
        searchQueue.close(),
        fetchQueue.close(),
        browserQueue.close(),
        agentQueue.close(),
      ]);
      console.log("[openfinch] BullMQ queues closed");
    } catch (e) {
      console.warn("[openfinch] Error closing queues:", (e as Error).message);
    }

    // Close Redis cache connections
    try {
      const { createClient } = await import("redis");
      const redisClient = createClient({ url: config.redisUrl });
      redisClient.on("error", () => {});
      await redisClient.connect();
      await redisClient.quit();
      console.log("[openfinch] Redis connection closed");
    } catch {
      // Non-fatal
    }

    // Close database connections
    try {
      const sql = (await import("postgres")).default(config.databaseUrl);
      await sql.end({ timeout: 5 });
      console.log("[openfinch] Database connection closed");
    } catch {
      // Non-fatal
    }

    console.log("[openfinch] Graceful shutdown complete");
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error("[openfinch] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
