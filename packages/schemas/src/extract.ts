import { z } from "zod";

export const ExtractRequest = z.object({
  url: z.string().url().max(2048),
  prompt: z.string().max(2000).optional(),
  schema: z.record(z.any()).optional(),
  provider: z
    .enum(["openai", "anthropic", "gemini", "ollama", "openrouter"])
    .optional(),
  model: z.string().optional(),
});

export type ExtractRequest = z.infer<typeof ExtractRequest>;

export const ExtractResponse = z.object({
  url: z.string(),
  data: z.any(),
  provider: z.string(),
  model: z.string().optional(),
  cached: z.boolean().default(false),
});
