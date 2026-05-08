import { Hono } from "hono";
import { z } from "zod";
import { agentQueue } from "../lib/queue.js";
import { getProvider, getAvailableProviders } from "../lib/llm/registry.js";
import { cacheGet, cacheSet } from "../lib/cache.js";

// In-memory store for runs (also persisted to Postgres in production)
interface AgentRun {
  runId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "timeout";
  goal: string;
  url: string | null;
  provider: string;
  model: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  currentStep: number;
  totalSteps: number;
  result: unknown;
  error: string | null;
}

interface AgentEvent {
  runId: string;
  type: "run_created" | "browser_started" | "page_loaded" | "llm_planned" | "action_started" | "action_completed" | "extraction_completed" | "run_succeeded" | "run_failed";
  step: number;
  content: unknown;
  timestamp: string;
}

const runs = new Map<string, AgentRun>();
const events = new Map<string, AgentEvent[]>();

const MAX_RUNS = 50;

const AgentRunBody = z.object({
  url: z.string().url().optional(),
  goal: z.string().min(1).max(5000),
  outputSchema: z.record(z.any()).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  maxSteps: z.number().int().min(1).max(50).default(10),
  maxRuntimeSeconds: z.number().int().min(30).max(600).default(180),
  renderJs: z.boolean().default(true),
});

function generateId(): string {
  return crypto.randomUUID();
}

function addEvent(runId: string, type: AgentEvent["type"], step: number, content: unknown) {
  if (!events.has(runId)) events.set(runId, []);
  events.get(runId)!.push({
    runId, type, step,
    content,
    timestamp: new Date().toISOString(),
  });
}

// Cleanup old runs
setInterval(() => {
  const now = Date.now();
  for (const [id, run] of runs) {
    if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
      const age = now - new Date(run.createdAt).getTime();
      if (age > 3600_000) runs.delete(id); // remove after 1 hour
    }
  }
}, 60_000);

export const agentRoute = new Hono();

// Create agent run
agentRoute.post("/v1/agent/run", async (c) => {
  const body = AgentRunBody.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Limit concurrent runs
  const activeCount = [...runs.values()].filter((r) => r.status === "queued" || r.status === "running").length;
  if (activeCount >= 5) {
    return c.json({ error: "Max concurrent runs (5) reached. Wait for a running job to complete." }, 429);
  }

  const { url, goal, outputSchema, provider, model, maxSteps, maxRuntimeSeconds, renderJs } = body.data;

  // Check provider availability early
  try {
    getProvider(provider);
  } catch (err) {
    const available = getAvailableProviders();
    return c.json({
      error: (err as Error).message,
      availableProviders: available,
    }, 400);
  }

  const runId = generateId();
  const now = new Date().toISOString();

  const run: AgentRun = {
    runId,
    status: "queued",
    goal,
    url: url ?? null,
    provider: provider ?? "openai",
    model: model ?? null,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    currentStep: 0,
    totalSteps: 0,
    result: null,
    error: null,
  };

  runs.set(runId, run);
  addEvent(runId, "run_created", 0, { goal, url });

  // Enqueue to agent worker
  await agentQueue.add("agent-run", {
    runId,
    url,
    goal,
    outputSchema,
    provider: provider ?? "openai",
    model,
    maxSteps,
    maxRuntimeSeconds,
    renderJs,
  });

  return c.json({
    runId,
    status: "queued",
    createdAt: now,
  });
});

// Get run status
agentRoute.get("/v1/agent/run/:id", async (c) => {
  const runId = c.req.param("id");
  const run = runs.get(runId);
  if (!run) return c.json({ error: "Run not found" }, 404);

  return c.json({
    runId: run.runId,
    status: run.status,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    currentStep: run.currentStep,
    totalSteps: run.totalSteps,
    error: run.error,
  });
});

// Get run result
agentRoute.get("/v1/agent/run/:id/result", async (c) => {
  const runId = c.req.param("id");
  const run = runs.get(runId);
  if (!run) return c.json({ error: "Run not found" }, 404);

  if (run.status !== "succeeded" && run.status !== "failed") {
    return c.json({ error: `Run is still ${run.status}. Poll /v1/agent/run/${runId} for status.` }, 400);
  }

  return c.json({
    runId: run.runId,
    status: run.status,
    result: run.result,
    error: run.error,
    currentStep: run.currentStep,
    totalSteps: run.totalSteps,
  });
});

// Get run events (SSE stream)
agentRoute.get("/v1/agent/run/:id/events", async (c) => {
  const runId = c.req.param("id");
  const run = runs.get(runId);
  if (!run) return c.json({ error: "Run not found" }, 404);

  const runEvents = events.get(runId) ?? [];

  // Support both SSE and JSON responses
  const accept = c.req.header("accept") ?? "";
  if (accept.includes("text/event-stream")) {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    // Return existing events as SSE
    let sse = "";
    for (const evt of runEvents) {
      sse += `data: ${JSON.stringify(evt)}\n\n`;
    }

    // If run is still active, set up polling
    if (run.status === "queued" || run.status === "running") {
      // The client will poll for updates
    }

    return c.body(sse);
  }

  return c.json(runEvents);
});

// Get available providers (helper endpoint)
agentRoute.get("/v1/agent/providers", async (c) => {
  return c.json({ providers: getAvailableProviders() });
});
