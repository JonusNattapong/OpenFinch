import { eq, desc } from "drizzle-orm";
import { db } from "./index.js";
import { agentRuns, agentEvents, agentArtifacts } from "./schema.js";
import type { AgentRunStatus } from "@openfinch/schemas";

export async function createRun(data: {
  goal: string;
  startUrl?: string;
  provider?: string;
  model?: string;
  maxSteps?: number;
  allowedDomains?: string[];
}): Promise<string> {
  const [run] = await db
    .insert(agentRuns)
    .values({
      goal: data.goal,
      startUrl: data.startUrl ?? null,
      provider: data.provider ?? "openai",
      model: data.model ?? null,
      maxSteps: data.maxSteps ?? 20,
      allowedDomains: data.allowedDomains ?? null,
      status: "queued",
    })
    .returning({ id: agentRuns.id });

  return run.id;
}

export async function getRun(runId: string): Promise<{
  id: string;
  goal: string;
  status: string;
  startUrl: string | null;
  provider: string | null;
  model: string | null;
  maxSteps: number | null;
  currentStep: number | null;
  result: unknown;
  error: string | null;
  allowedDomains: unknown;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
} | null> {
  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId));
  return run ?? null;
}

export async function updateRunStatus(
  runId: string,
  status: AgentRunStatus,
  extra?: {
    startedAt?: Date;
    completedAt?: Date;
    currentStep?: number;
    result?: unknown;
    error?: string;
  },
): Promise<void> {
  await db
    .update(agentRuns)
    .set({
      status,
      ...(extra?.startedAt !== undefined ? { startedAt: extra.startedAt } : {}),
      ...(extra?.completedAt !== undefined ? { completedAt: extra.completedAt } : {}),
      ...(extra?.currentStep !== undefined ? { currentStep: extra.currentStep } : {}),
      ...(extra?.result !== undefined ? { result: extra.result } : {}),
      ...(extra?.error !== undefined ? { error: extra.error } : {}),
      updatedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
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
    type: data.type as "run_created" | "run_started" | "observation" | "llm_decision" | "action_validated" | "action_executed" | "action_failed" | "artifact_created" | "run_completed" | "run_failed" | "run_cancelled" | "run_timed_out",
    data: data.data,
  });
}

export async function listEvents(runId: string): Promise<Array<{
  id: string;
  runId: string;
  step: number;
  type: string;
  data: unknown;
  createdAt: Date;
}>> {
  return db
    .select()
    .from(agentEvents)
    .where(eq(agentEvents.runId, runId))
    .orderBy(agentEvents.createdAt);
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
    type: data.type as "screenshot" | "html" | "markdown" | "json" | "text" | "trace",
    url: data.url ?? null,
    content: data.content ?? null,
    metadata: data.metadata ?? null,
  });
}

export async function listArtifacts(runId: string): Promise<Array<{
  id: string;
  runId: string;
  step: number | null;
  type: string;
  url: string | null;
  content: unknown;
  metadata: unknown;
  createdAt: Date;
}>> {
  return db
    .select()
    .from(agentArtifacts)
    .where(eq(agentArtifacts.runId, runId))
    .orderBy(agentArtifacts.createdAt);
}

export async function listRuns(limit = 50): Promise<Array<{
  id: string;
  goal: string;
  status: string;
  maxSteps: number | null;
  currentStep: number | null;
  createdAt: Date;
  completedAt: Date | null;
}>> {
  const rows = await db
    .select({
      id: agentRuns.id,
      goal: agentRuns.goal,
      status: agentRuns.status,
      maxSteps: agentRuns.maxSteps,
      currentStep: agentRuns.currentStep,
      createdAt: agentRuns.createdAt,
      completedAt: agentRuns.completedAt,
    })
    .from(agentRuns)
    .orderBy(desc(agentRuns.createdAt))
    .limit(limit);
  return rows;
}