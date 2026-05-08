import { z } from "zod";

export const FetchRequest = z.object({
  url: z.string().url().max(2048),
  format: z.enum(["markdown", "text", "html", "json"]).default("markdown"),
  renderJs: z.union([z.literal("auto"), z.boolean()]).default("auto"),
  timeoutMs: z.number().int().min(1000).max(60000).default(15000),
});

export type FetchRequest = z.infer<typeof FetchRequest>;

export const FetchResponse = z.object({
  url: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  format: z.enum(["markdown", "text", "html", "json"]),
  status: z.number(),
  rendered: z.boolean(),
  cached: z.boolean(),
  tookMs: z.number(),
  metadata: z.object({
    contentType: z.string().nullable(),
    contentLength: z.number().nullable(),
  }),
});

export type FetchResponse = z.infer<typeof FetchResponse>;
