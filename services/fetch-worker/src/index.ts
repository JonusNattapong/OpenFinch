import { Worker } from "bullmq";
import { logger } from "@openfinch/shared";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker(
  "fetch",
  async (job) => {
    logger.info("Processing fetch job", { jobId: job.id, url: job.data.url });
    // TODO: HTTP fetch with Playwright fallback
    return { content: "", format: "markdown", used_browser: false };
  },
  { connection: { url: redisUrl } },
);

worker.on("completed", (job) => {
  logger.info("Fetch job completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.error("Fetch job failed", { jobId: job?.id, error: err.message });
});

logger.info("Fetch worker started");
