import { Hono } from "hono";
import { agentQueue } from "../lib/queue.js";
import { getProvider, getAvailableProviders } from "../lib/llm/registry.js";
import { createRun, getRun, listEvents, updateRunStatus } from "../db/agent-repo.js";
import { AgentRunRequest } from "@openfinch/schemas";

export const agentRoute = new Hono();

// Create agent run
agentRoute.post("/v1/agent/run", async (c) => {
  const bodyParse = AgentRunRequest.safeParse(await c.req.json());
  if (!bodyParse.success) {
    return c.json({ error: bodyParse.error.flatten() }, 400);
  }

  const { goal, startUrl, maxSteps, provider, model, headless, renderJs, timeoutMs, allowedDomains } = bodyParse.data;

  // Check provider availability
  try {
    getProvider(provider);
  } catch (err) {
    const available = getAvailableProviders();
    return c.json({
      error: (err as Error).message,
      availableProviders: available,
    }, 400);
  }

  // Create run in DB
  const runId = await createRun({
    goal,
    startUrl,
    provider,
    model,
    maxSteps,
    allowedDomains,
  });

  // Enqueue to agent worker
  await agentQueue.add("agent-run", {
    runId,
    startUrl: startUrl ?? null,
    goal,
    maxSteps,
    timeoutMs,
    provider: provider ?? "openai",
    model,
    headless,
    renderJs,
    allowedDomains: allowedDomains ?? null,
  });

  return c.json({
    runId,
    status: "queued",
    createdAt: new Date().toISOString(),
  });
});

// Get run status
agentRoute.get("/v1/agent/run/:id", async (c) => {
  const runId = c.req.param("id");
  const run = await getRun(runId);
  if (!run) return c.json({ error: "Run not found" }, 404);

  return c.json({
    id: run.id,
    goal: run.goal,
    status: run.status,
    currentStep: run.currentStep,
    maxSteps: run.maxSteps,
    result: run.result,
    error: run.error,
    createdAt: run.createdAt.toISOString(),
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
  });
});

// Get run events
agentRoute.get("/v1/agent/run/:id/events", async (c) => {
  const runId = c.req.param("id");
  const run = await getRun(runId);
  if (!run) return c.json({ error: "Run not found" }, 404);

  const accept = c.req.header("accept") ?? "";

  if (accept.includes("text/event-stream")) {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    const existing = await listEvents(runId);
    let sse = "";
    for (const evt of existing) {
      sse += `data: ${JSON.stringify({
        id: evt.id,
        runId: evt.runId,
        step: evt.step,
        type: evt.type,
        data: evt.data,
        createdAt: evt.createdAt.toISOString(),
      })}\n\n`;
    }
    return c.body(sse);
  }

  const events = await listEvents(runId);
  return c.json({
    runId,
    events: events.map((e) => ({
      id: e.id,
      runId: e.runId,
      step: e.step,
      type: e.type,
      data: e.data,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

// Cancel a run
agentRoute.post("/v1/agent/run/:id/cancel", async (c) => {
  const runId = c.req.param("id");
  const run = await getRun(runId);

  if (!run) {
    return c.json({ runId, status: "not_found" }, 404);
  }

  const terminal = ["completed", "failed", "cancelled", "timed_out"];
  if (terminal.includes(run.status)) {
    return c.json({ runId, status: "already_terminal" }, 400);
  }

  await updateRunStatus(runId, "cancelled", {
    completedAt: new Date(),
    error: "Cancelled by user",
  });

  return c.json({ runId, status: "cancelled" });
});

// Get available providers
agentRoute.get("/v1/agent/providers", async (c) => {
  return c.json({ providers: getAvailableProviders() });
});