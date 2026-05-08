import { Worker } from "bullmq";
import { logger } from "@openfinch/shared";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker(
  "search",
  async (job) => {
    logger.info("Processing search job", { jobId: job.id, query: job.data.query });
    // TODO: call SearXNG
    return { results: [] };
  },
  { connection: { url: redisUrl } },
);

worker.on("completed", (job) => {
  logger.info("Search job completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.error("Search job failed", { jobId: job?.id, error: err.message });
});

logger.info("Search worker started");
