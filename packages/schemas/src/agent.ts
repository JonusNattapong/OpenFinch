import { z } from "zod";

// ============================================================
// Agent Run
// ============================================================

export const AgentRunStatusEnum = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatusEnum>;

export const AgentRunRequest = z.object({
  goal: z.string().min(1).max(5000),
  startUrl: z.string().url().optional(),
  maxSteps: z.number().int().min(1).max(100).default(20),
  timeoutMs: z.number().int().min(30_000).max(600_000).default(120_000),
  allowedDomains: z.array(z.string()).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  headless: z.boolean().default(true),
  renderJs: z.boolean().default(true),
});

export type AgentRunRequest = z.infer<typeof AgentRunRequest>;

export const AgentRunResponse = z.object({
  runId: z.string(),
  status: AgentRunStatusEnum,
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  currentStep: z.number().int().optional(),
  maxSteps: z.number().int().optional(),
  result: z.unknown().nullable(),
  error: z.string().nullable(),
  goal: z.string().optional(),
});

export type AgentRunResponse = z.infer<typeof AgentRunResponse>;

export const AgentRunListResponse = z.object({
  runs: z.array(AgentRunResponse),
  total: z.number(),
});

export type AgentRunListResponse = z.infer<typeof AgentRunListResponse>;

// ============================================================
// Agent Events
// ============================================================

export const AgentEventTypeEnum = z.enum([
  "run_created",
  "run_started",
  "observation",
  "llm_decision",
  "action_validated",
  "action_executed",
  "action_failed",
  "artifact_created",
  "run_completed",
  "run_failed",
  "run_cancelled",
  "run_timed_out",
]);
export type AgentEventType = z.infer<typeof AgentEventTypeEnum>;

export const AgentEventResponse = z.object({
  id: z.string(),
  runId: z.string(),
  step: z.number().int(),
  type: AgentEventTypeEnum,
  data: z.unknown(),
  createdAt: z.string(),
});

export type AgentEventResponse = z.infer<typeof AgentEventResponse>;

export const AgentEventsResponse = z.object({
  runId: z.string(),
  events: z.array(AgentEventResponse),
});

export type AgentEventsResponse = z.infer<typeof AgentEventsResponse>;

// ============================================================
// Agent Artifacts
// ============================================================

export const AgentArtifactTypeEnum = z.enum([
  "screenshot",
  "html",
  "markdown",
  "json",
  "text",
  "trace",
]);
export type AgentArtifactType = z.infer<typeof AgentArtifactTypeEnum>;

export const AgentArtifactResponse = z.object({
  id: z.string(),
  runId: z.string(),
  step: z.number().int().optional(),
  type: AgentArtifactTypeEnum,
  url: z.string().optional(),
  content: z.unknown().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
});

export type AgentArtifactResponse = z.infer<typeof AgentArtifactResponse>;

// ============================================================
// Agent Decision (LLM output)
// ============================================================

export const AgentDecisionGoto = z.object({
  type: z.literal("goto"),
  url: z.string().url(),
});
export type AgentDecisionGoto = z.infer<typeof AgentDecisionGoto>;

export const AgentDecisionClick = z.object({
  type: z.literal("click"),
  selector: z.string().min(1),
});
export type AgentDecisionClick = z.infer<typeof AgentDecisionClick>;

export const AgentDecisionType = z.object({
  type: z.literal("type"),
  selector: z.string().min(1),
  text: z.string().min(1).max(10000),
});
export type AgentDecisionType = z.infer<typeof AgentDecisionType>;

export const AgentDecisionScroll = z.object({
  type: z.literal("scroll"),
  direction: z.enum(["up", "down"]),
  amount: z.number().int().min(1).max(2000).optional(),
});
export type AgentDecisionScroll = z.infer<typeof AgentDecisionScroll>;

export const AgentDecisionWait = z.object({
  type: z.literal("wait"),
  ms: z.number().int().min(100).max(60_000),
});
export type AgentDecisionWait = z.infer<typeof AgentDecisionWait>;

export const AgentDecisionScreenshot = z.object({
  type: z.literal("screenshot"),
});
export type AgentDecisionScreenshot = z.infer<typeof AgentDecisionScreenshot>;

export const AgentDecisionExtract = z.object({
  type: z.literal("extract"),
  instruction: z.string().min(1).max(2000),
  schema: z.record(z.unknown()).optional(),
});
export type AgentDecisionExtract = z.infer<typeof AgentDecisionExtract>;

export const AgentDecisionFinish = z.object({
  type: z.literal("finish"),
  answer: z.string().min(1),
  data: z.unknown().optional(),
});
export type AgentDecisionFinish = z.infer<typeof AgentDecisionFinish>;

export const AgentDecisionFail = z.object({
  type: z.literal("fail"),
  reason: z.string().min(1),
});
export type AgentDecisionFail = z.infer<typeof AgentDecisionFail>;

export const AgentDecision = z.object({
  reasoningSummary: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1).optional(),
  action: z.discriminatedUnion("type", [
    AgentDecisionGoto,
    AgentDecisionClick,
    AgentDecisionType,
    AgentDecisionScroll,
    AgentDecisionWait,
    AgentDecisionScreenshot,
    AgentDecisionExtract,
    AgentDecisionFinish,
    AgentDecisionFail,
  ]),
});

export type AgentDecision = z.infer<typeof AgentDecision>;

// ============================================================
// Observation (browser state)
// ============================================================

export const InteractiveElement = z.object({
  selector: z.string(),
  tagName: z.string(),
  role: z.string().optional(),
  text: z.string().optional(),
  ariaLabel: z.string().optional(),
  placeholder: z.string().optional(),
  href: z.string().optional(),
  isVisible: z.boolean(),
});
export type InteractiveElement = z.infer<typeof InteractiveElement>;

export const Observation = z.object({
  url: z.string(),
  title: z.string(),
  text: z.string().max(50_000),
  interactiveElements: z.array(InteractiveElement),
  screenshotUrl: z.string().optional(),
  timestamp: z.string(),
});
export type Observation = z.infer<typeof Observation>;

// ============================================================
// Cancellation
// ============================================================

export const CancelResponse = z.object({
  runId: z.string(),
  status: z.enum(["cancelled", "not_found", "already_terminal"]),
});
export type CancelResponse = z.infer<typeof CancelResponse>;