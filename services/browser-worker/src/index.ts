import { Worker } from "bullmq";
import { logger } from "@openfinch/shared";
import { createSession, takeScreenshot, closeSession, closeAll } from "./session-manager.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker(
  "browser",
  async (job) => {
    const { type, ...params } = job.data;

    switch (type) {
      case "create-session": {
        const session = await createSession(params.viewport, params.ttlSeconds);
        return {
          sessionId: session.sessionId,
          status: "created",
          createdAt: new Date(session.createdAt).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
        };
      }

      case "screenshot": {
        const buffer = await takeScreenshot(params.sessionId, params.fullPage);
        return {
          sessionId: params.sessionId,
          screenshotBase64: buffer.toString("base64"),
          capturedAt: new Date().toISOString(),
        };
      }

      case "close-session": {
        await closeSession(params.sessionId);
        return { sessionId: params.sessionId, status: "closed" };
      }

      default:
        throw new Error(`Unknown browser job type: ${type}`);
    }
  },
  { connection: { url: redisUrl }, concurrency: 2 },
);

worker.on("completed", (job) => {
  logger.info("Browser job completed", { jobId: job.id, type: job.data.type });
});

worker.on("failed", (job, err) => {
  logger.error("Browser job failed", { jobId: job?.id, type: job?.data.type, error: err.message });
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down browser worker");
  await closeAll();
  await worker.close();
});

logger.info("Browser worker started");

// Keep process alive
await new Promise(() => {});
