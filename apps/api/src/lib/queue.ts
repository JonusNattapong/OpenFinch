import { Queue } from "bullmq";
import { config } from "./config.js";

const connection = { url: config.redisUrl };

export const searchQueue = new Queue("search", { connection });
export const fetchQueue = new Queue("fetch", { connection });
export const browserQueue = new Queue("browser", { connection });
export const agentQueue = new Queue("agent", { connection });
