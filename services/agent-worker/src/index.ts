import { Worker } from "bullmq";
import { logger } from "@openfinch/shared";
import { runAgent } from "./agent-engine.js";
import { closeDb } from "./db.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker(
  "agent",
  async (job) => {
    const {
      runId,
      startUrl,
      goal,
      maxSteps,
      timeoutMs,
      provider,
      model,
      headless,
      renderJs,
      allowedDomains,
    } = job.data;

    logger.info("Agent run starting", { runId, goal: goal?.slice(0, 80) });

    try {
      await runAgent({
        runId,
        goal,
        startUrl: startUrl ?? null,
        provider: provider ?? "openai",
        model,
        maxSteps: maxSteps ?? 20,
        timeoutMs: timeoutMs ?? 120_000,
        headless: headless ?? true,
        renderJs: renderJs ?? true,
        allowedDomains: allowedDomains ?? null,
      });
    } catch (err) {
      logger.error("Agent run threw unhandled error", { runId, error: (err as Error).message });
    }

    // No return value needed - state is in DB
    return { runId, status: "processed" };
  },
  {
    connection: { url: redisUrl },
    concurrency: 2,
    lockDuration: 300_000,
  },
);

worker.on("completed", (job) => {
  logger.info("Agent job completed", { jobId: job.id, runId: job.data.runId });
});

worker.on("failed", (job, err) => {
  logger.error("Agent job failed", { jobId: job?.id, runId: job?.data.runId, error: err.message });
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down agent worker");
  await worker.close();
  await closeDb();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Shutting down agent worker");
  await worker.close();
  await closeDb();
  process.exit(0);
});

logger.info("Agent worker started");

// Keep alive
await new Promise(() => {});