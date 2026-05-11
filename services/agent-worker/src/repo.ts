import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { agentRuns, agentEvents, agentArtifacts } from "./schema.js";

export async function createRun(data: {
  goal: string;
  startUrl?: string;
  provider?: string;
  model?: string;
  maxSteps?: number;
  allowedDomains?: string[];
}): Promise<string> {
  const [run] = await db.insert(agentRuns).values({
    goal: data.goal,
    startUrl: data.startUrl ?? null,
    provider: data.provider ?? "openai",
    model: data.model ?? null,
    maxSteps: data.maxSteps ?? 20,
    allowedDomains: data.allowedDomains ?? null,
    status: "queued",
  }).returning({ id: agentRuns.id });
  return run.id;
}

export async function getRun(runId: string) {
  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId));
  return run ?? null;
}

export async function updateRunStatus(
  runId: string,
  status: string,
  extra?: {
    startedAt?: Date;
    completedAt?: Date;
    currentStep?: number;
    result?: unknown;
    error?: string;
  },
): Promise<void> {
  const setStatus = status as "queued" | "running" | "completed" | "failed" | "cancelled" | "timed_out";
  await db.update(agentRuns).set({
    status: setStatus,
    ...(extra?.startedAt !== undefined ? { startedAt: extra.startedAt } : {}),
    ...(extra?.completedAt !== undefined ? { completedAt: extra.completedAt } : {}),
    ...(extra?.currentStep !== undefined ? { currentStep: extra.currentStep } : {}),
    ...(extra?.result !== undefined ? { result: extra.result } : {}),
    ...(extra?.error !== undefined ? { error: extra.error } : {}),
  }).where(eq(agentRuns.id, runId));
}

export async function appendEvent(data: {
  runId: string;
  step: number;
  type: string;
  data: unknown;
}): Promise<void> {
  await db.insert(agentEvents).values({
    runId: data.runId,
    step: data.step,
    type: data.type as any,
    data: data.data,
  });
}

export async function createArtifact(data: {
  runId: string;
  step?: number;
  type: string;
  url?: string;
  content?: unknown;
  metadata?: unknown;
}): Promise<void> {
  await db.insert(agentArtifacts).values({
    runId: data.runId,
    step: data.step ?? null,
    type: data.type as any,
    url: data.url ?? null,
    content: data.content ?? null,
    metadata: data.metadata ?? null,
  });
}