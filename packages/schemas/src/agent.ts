import { z } from "zod";

export const AgentRunRequest = z.object({
  task: z.string().min(1).max(10000),
  model: z.string().optional(),
  max_steps: z.number().int().min(1).max(100).default(20),
  provider: z
    .enum(["openai", "anthropic", "gemini", "ollama", "openrouter"])
    .optional(),
  tools: z
    .array(z.enum(["search", "fetch", "extract", "browser", "screenshot"]))
    .optional(),
});

export type AgentRunRequest = z.infer<typeof AgentRunRequest>;

export const AgentRunResponse = z.object({
  run_id: z.string().uuid(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  created_at: z.string(),
});

export type AgentRunResponse = z.infer<typeof AgentRunResponse>;

export const AgentStatusResponse = z.object({
  run_id: z.string().uuid(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  created_at: z.string(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  current_step: z.number().int().optional(),
  total_steps: z.number().int().optional(),
  error: z.string().optional(),
});

export type AgentStatusResponse = z.infer<typeof AgentStatusResponse>;

export const AgentEvent = z.object({
  type: z.enum(["thought", "action", "observation", "result", "error"]),
  step: z.number().int(),
  content: z.any(),
  timestamp: z.string(),
});

export type AgentEvent = z.infer<typeof AgentEvent>;
