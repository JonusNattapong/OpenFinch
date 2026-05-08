import { Worker } from "bullmq";
import { logger } from "@openfinch/shared";
import { runAgent } from "./agent-engine.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker(
  "agent",
  async (job) => {
    const { runId, url, goal, outputSchema, provider, model, maxSteps, maxRuntimeSeconds, renderJs } = job.data;
    logger.info("Starting agent run", { runId, goal: goal?.slice(0, 100) });

    const result = await runAgent({
      runId,
      url,
      goal,
      outputSchema,
      provider,
      model,
      maxSteps,
      maxRuntimeSeconds,
      renderJs,
    });

    return result;
  },
  {
    connection: { url: redisUrl },
    concurrency: 2,
    lockDuration: 300_000, // 5 min job lock
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
});

logger.info("Agent worker started");

// Keep alive
await new Promise(() => {});
