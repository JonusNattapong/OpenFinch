import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the agent repo
vi.mock("../db/agent-repo.js", () => {
  const runs = new Map<string, {
    id: string; goal: string; status: string; startUrl: string | null;
    provider: string | null; model: string | null; maxSteps: number;
    currentStep: number; result: unknown; error: string | null;
    allowedDomains: unknown; createdAt: Date; startedAt: Date | null;
    completedAt: Date | null; updatedAt: Date;
  }>();
  const events: Array<{ id: string; runId: string; step: number; type: string; data: unknown; createdAt: Date }> = [];

  return {
    createRun: vi.fn(async (data: any) => {
      const id = crypto.randomUUID();
      runs.set(id, {
        id, goal: data.goal, status: "queued", startUrl: data.startUrl ?? null,
        provider: data.provider ?? "openai", model: data.model ?? null,
        maxSteps: data.maxSteps ?? 20, currentStep: 0, result: null, error: null,
        allowedDomains: data.allowedDomains ?? null,
        createdAt: new Date(), startedAt: null, completedAt: null, updatedAt: new Date(),
      });
      return id;
    }),
    getRun: vi.fn(async (runId: string) => runs.get(runId) ?? null),
    updateRunStatus: vi.fn(async (runId: string, status: string, extra?: any) => {
      const run = runs.get(runId);
      if (run) {
        run.status = status;
        if (extra?.startedAt) run.startedAt = extra.startedAt;
        if (extra?.completedAt) run.completedAt = extra.completedAt;
        if (extra?.currentStep !== undefined) run.currentStep = extra.currentStep;
        if (extra?.result !== undefined) run.result = extra.result;
        if (extra?.error !== undefined) run.error = extra.error;
      }
    }),
    listEvents: vi.fn(async (runId: string) => events.filter((e) => e.runId === runId)),
    appendEvent: vi.fn(async (data: any) => {
      events.push({
        id: crypto.randomUUID(), runId: data.runId, step: data.step,
        type: data.type, data: data.data, createdAt: new Date(),
      });
    }),
    listRuns: vi.fn(async () => [...runs.values()].slice(0, 50)),
  };
});

// Mock queue
vi.mock("../lib/queue.js", () => ({
  agentQueue: {
    add: vi.fn(async () => ({})),
  },
}));

// Mock LLM registry
vi.mock("../lib/llm/registry.js", () => ({
  getProvider: vi.fn(() => ({
    name: "test",
    call: vi.fn(async () => ({ content: "{}", model: "test", provider: "test" })),
  })),
  getAvailableProviders: vi.fn(() => ["test"]),
}));

import { agentRoute } from "../routes/agent.js";
import { Hono } from "hono";

let app: Hono;
let createRunSpy: any;
let getRunSpy: any;
let agentQueueAddSpy: any;

beforeEach(async () => {
  app = new Hono();
  app.route("/", agentRoute);

  const repo = await import("../db/agent-repo.js");
  createRunSpy = repo.createRun as any;
  getRunSpy = repo.getRun as any;
  const queue = await import("../lib/queue.js");
  agentQueueAddSpy = queue.agentQueue.add as any;

  createRunSpy.mockClear();
  getRunSpy.mockClear();
  agentQueueAddSpy.mockClear();
});

describe("POST /v1/agent/run", () => {
  it("rejects missing goal", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const json = await res.json() as any;
    expect(json.error).toBeDefined();
  });

  it("rejects goal exceeding max length", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "a".repeat(5001) }),
    });
    expect(res.status).toBe(400);
  });

  it("creates a run and enqueues job", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: "Summarize example.com",
        startUrl: "https://example.com",
        maxSteps: 10,
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.runId).toBeDefined();
    expect(json.status).toBe("queued");
    expect(createRunSpy).toHaveBeenCalledWith(expect.objectContaining({
      goal: "Summarize example.com",
      startUrl: "https://example.com",
      maxSteps: 10,
    }));
    expect(agentQueueAddSpy).toHaveBeenCalledWith("agent-run", expect.objectContaining({
      goal: "Summarize example.com",
      runId: expect.any(String),
    }));
  });

  it("uses defaults when optional fields not provided", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "Test task" }),
    });
    expect(res.status).toBe(200);
    expect(createRunSpy).toHaveBeenCalledWith(expect.objectContaining({
      maxSteps: 20,
      allowedDomains: undefined,
    }));
  });

  it("accepts startUrl as optional", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "Do something", startUrl: "https://example.com" }),
    });
    expect(res.status).toBe(200);
  });

  it("rejects invalid startUrl", async () => {
    const res = await app.request("/v1/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "Test", startUrl: "not-a-url" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /v1/agent/run/:id", () => {
  it("returns 404 for unknown run", async () => {
    getRunSpy.mockResolvedValueOnce(null);
    const res = await app.request("/v1/agent/run/unknown-id-123");
    expect(res.status).toBe(404);
  });

  it("returns run status for existing run", async () => {
    const mockRun = {
      id: "run-123", goal: "Test goal", status: "running" as const,
      startUrl: null, provider: "openai", model: null,
      maxSteps: 20, currentStep: 3, result: null, error: null,
      allowedDomains: null, createdAt: new Date("2024-01-01"),
      startedAt: new Date("2024-01-01"), completedAt: null, updatedAt: new Date(),
    };
    getRunSpy.mockResolvedValueOnce(mockRun);

    const res = await app.request("/v1/agent/run/run-123");
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.id).toBe("run-123");
    expect(json.status).toBe("running");
    expect(json.currentStep).toBe(3);
  });
});

describe("GET /v1/agent/run/:id/events", () => {
  it("returns 404 for unknown run", async () => {
    getRunSpy.mockResolvedValueOnce(null);
    const res = await app.request("/v1/agent/run/unknown-id/events");
    expect(res.status).toBe(404);
  });

  it("returns events as JSON", async () => {
    const mockRun = {
      id: "run-456", goal: "Test", status: "running" as const,
      startUrl: null, provider: "openai", model: null,
      maxSteps: 20, currentStep: 1, result: null, error: null,
      allowedDomains: null, createdAt: new Date(), startedAt: new Date(),
      completedAt: null, updatedAt: new Date(),
    };
    getRunSpy.mockResolvedValueOnce(mockRun);

    const res = await app.request("/v1/agent/run/run-456/events");
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.runId).toBe("run-456");
    expect(json.events).toBeDefined();
  });
});

describe("POST /v1/agent/run/:id/cancel", () => {
  it("returns 404 for unknown run", async () => {
    getRunSpy.mockResolvedValueOnce(null);
    const res = await app.request("/v1/agent/run/unknown-id/cancel", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for already terminal run", async () => {
    const mockRun = {
      id: "run-789", goal: "Test", status: "completed" as const,
      startUrl: null, provider: "openai", model: null,
      maxSteps: 20, currentStep: 5, result: {}, error: null,
      allowedDomains: null, createdAt: new Date(), startedAt: new Date(),
      completedAt: new Date(), updatedAt: new Date(),
    };
    getRunSpy.mockResolvedValueOnce(mockRun);
    const res = await app.request("/v1/agent/run/run-789/cancel", { method: "POST" });
    expect(res.status).toBe(400);
  });

  it("cancels a running run", async () => {
    const mockRun = {
      id: "run-active", goal: "Test", status: "running" as const,
      startUrl: null, provider: "openai", model: null,
      maxSteps: 20, currentStep: 3, result: null, error: null,
      allowedDomains: null, createdAt: new Date(), startedAt: new Date(),
      completedAt: null, updatedAt: new Date(),
    };
    getRunSpy.mockResolvedValueOnce(mockRun);

    const res = await app.request("/v1/agent/run/run-active/cancel", { method: "POST" });
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe("cancelled");
  });
});

describe("GET /v1/agent/providers", () => {
  it("returns available providers", async () => {
    const res = await app.request("/v1/agent/providers");
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.providers).toBeDefined();
    expect(Array.isArray(json.providers)).toBe(true);
  });
});