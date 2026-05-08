import { z } from "zod";

export const HealthResponse = z.object({
  status: z.literal("ok"),
  version: z.string(),
  uptime: z.number(),
  services: z.object({
    postgres: z.boolean(),
    redis: z.boolean(),
    searxng: z.boolean(),
    minio: z.boolean(),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponse>;
