import { z } from "zod";
import { getProvider } from "./llm-registry.js";
import type { LLMProvider } from "./llm-registry.js";
import { generateJson } from "./generate-json.js";
import { createSession, observe, executeAction, closeSession, detectLoop } from "./browser-adapter.js";
import type { Observation } from "./browser-adapter.js";
import { updateRunStatus, appendEvent, createArtifact } from "./repo.js";
import { getRun } from "./repo.js";
import { logger } from "@openfinch/shared";

// ============================================================
// LLM Decision Schema
// ============================================================

const AgentDecisionSchema = z.object({
  reasoningSummary: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1).optional(),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("goto"), url: z.string().url() }),
    z.object({ type: z.literal("click"), selector: z.string().min(1) }),
    z.object({ type: z.literal("type"), selector: z.string().min(1), text: z.string().min(1).max(10000) }),
    z.object({ type: z.literal("scroll"), direction: z.enum(["up", "down"]), amount: z.number().int().min(1).max(2000).optional() }),
    z.object({ type: z.literal("wait"), ms: z.number().int().min(100).max(60000) }),
    z.object({ type: z.literal("screenshot") }),
    z.object({ type: z.literal("extract"), instruction: z.string().min(1).max(2000), schema: z.record(z.unknown()).optional() }),
    z.object({ type: z.literal("finish"), answer: z.string().min(1), data: z.unknown().optional() }),
    z.object({ type: z.literal("fail"), reason: z.string().min(1) }),
  ]),
});

type AgentDecision = z.infer<typeof AgentDecisionSchema>;

// ============================================================
// System Prompt
// ============================================================

const SYSTEM_PROMPT = `You are OpenFinch Web Agent.

Your job is to complete the user's web task by choosing exactly one valid action at a time.

You receive:
- the user goal
- current URL
- page title
- visible text
- interactive elements (with selectors)
- remaining step budget

Available actions:
- goto(url): Navigate to a URL
- click(selector): Click an interactive element by selector
- type(selector, text): Type text into an input field
- scroll(direction, amount?): Scroll up or down (pixels, default 500)
- wait(ms): Wait (ms)
- screenshot(): Capture current page screenshot
- extract(instruction, schema?): Extract structured data from the page
- finish(answer, data?): Complete the task with the answer
- fail(reason): Mark the task as impossible

Rules:
- Choose one action only per response.
- Prefer simple reliable actions.
- Do not invent information.
- Use finish only when the task is complete.
- Use fail only when the task cannot be completed.
- Use reasoningSummary as short operational explanation.
- Do not click destructive actions (delete, purchase, submit payment, send) unless the user explicitly asked.
- Do not enter credentials unless explicitly provided for the task.
- Stay within allowed domains if provided.

Return JSON only. No explanation outside the JSON.`;

// ============================================================
// Agent Config
// ============================================================

interface AgentRunConfig {
  runId: string;
  goal: string;
  startUrl: string | null;
  provider: string;
  model?: string;
  maxSteps: number;
  timeoutMs: number;
  headless: boolean;
  renderJs: boolean;
  allowedDomains: string[] | null;
}

// ============================================================
// Build Observation Prompt
// ============================================================

function buildPrompt(obs: Observation, goal: string, step: number, maxSteps: number): string {
  const elements = obs.interactiveElements
    .slice(0, 50)
    .map((el) => {
      let label = `${el.tagName.toUpperCase()}`;
      if (el.text) label += ` text="${el.text.slice(0, 50)}"`;
      if (el.ariaLabel) label += ` aria="${el.ariaLabel}"`;
      if (el.placeholder) label += ` placeholder="${el.placeholder}"`;
      if (el.href) label += ` href="${el.href}"`;
      label += ` → selector: ${el.selector}`;
      return label;
    })
    .join("\n");

  return `User Goal: ${goal}

Current Page:
- URL: ${obs.url}
- Title: ${obs.title}

Visible Text:
${obs.text || "(no visible text)"}

Interactive Elements:
${elements || "(none detected)"}

Remaining Steps: ${maxSteps - step}

Return JSON only.`;;
}

// ============================================================
// Run Agent Loop
// ============================================================

export async function runAgent(config: AgentRunConfig): Promise<void> {
  const startTime = Date.now();
  let sessionId: string | null = null;

  // Mark run as running
  await updateRunStatus(config.runId, "running", { startedAt: new Date() });
  await appendEvent({ runId: config.runId, step: 0, type: "run_started", data: { startedAt: new Date().toISOString() } });

  // Get LLM provider
  let llmProvider: LLMProvider;
  try {
    llmProvider = getProvider(config.provider);
  } catch (err) {
    const msg = `No LLM provider available: ${(err as Error).message}`;
    await updateRunStatus(config.runId, "failed", { completedAt: new Date(), error: msg });
    await appendEvent({ runId: config.runId, step: 0, type: "run_failed", data: { error: msg } });
    return;
  }

  // Create browser session
  try {
    sessionId = await createSession({ headless: config.headless });
  } catch (err) {
    const msg = `Browser launch failed: ${(err as Error).message}`;
    await updateRunStatus(config.runId, "failed", { completedAt: new Date(), error: msg });
    await appendEvent({ runId: config.runId, step: 0, type: "run_failed", data: { error: msg } });
    return;
  }

  // Navigate to start URL
  if (config.startUrl) {
    const result = await executeAction(sessionId, { type: "goto", url: config.startUrl }, { allowedDomains: config.allowedDomains ?? undefined });
    if (!result.success) {
      if (sessionId) await closeSession(sessionId);
      await updateRunStatus(config.runId, "failed", { completedAt: new Date(), error: result.error ?? "Navigation failed" });
      await appendEvent({ runId: config.runId, step: 0, type: "run_failed", data: { error: result.error } });
      return;
    }
  }

  // Loop state
  const loopTracker = { lastUrl: "", lastActionType: "", lastActionSelector: null as string | null, lastText: "", repeatCount: 0 };

  // Main agent loop
  for (let step = 1; step <= config.maxSteps; step++) {
    // Check timeout
    if (Date.now() - startTime > config.timeoutMs) {
      await updateRunStatus(config.runId, "timed_out", { completedAt: new Date(), error: "Timeout exceeded" });
      await appendEvent({ runId: config.runId, step, type: "run_timed_out", data: { timeoutMs: config.timeoutMs, elapsedMs: Date.now() - startTime } });
      break;
    }

    // Check terminal status
    const run = await getRun(config.runId);
    if (run && (run.status === "cancelled" || run.status === "completed" || run.status === "failed" || run.status === "timed_out")) {
      break;
    }

    // Observe
    let obs: Observation;
    try {
      obs = await observe(sessionId!);
    } catch (err) {
      await appendEvent({ runId: config.runId, step, type: "action_failed", data: { error: `Observation failed: ${(err as Error).message}` } });
      await updateRunStatus(config.runId, "running", { currentStep: step });
      continue;
    }
    await appendEvent({ runId: config.runId, step, type: "observation", data: obs });

    // Ask LLM
    let decision: AgentDecision;
    try {
      decision = await generateJson({
        provider: llmProvider,
        model: config.model,
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(obs, config.goal, step, config.maxSteps),
        schema: AgentDecisionSchema,
        temperature: 0.1,
        maxTokens: 2048,
      });
    } catch (err) {
      await appendEvent({ runId: config.runId, step, type: "action_failed", data: { error: `LLM decision failed: ${(err as Error).message}` } });
      await updateRunStatus(config.runId, "running", { currentStep: step });
      continue;
    }
    await appendEvent({ runId: config.runId, step, type: "llm_decision", data: { reasoningSummary: decision.reasoningSummary, action: decision.action } });

    // Handle terminal actions
    if (decision.action.type === "finish") {
      const action = decision.action;
      await updateRunStatus(config.runId, "completed", {
        completedAt: new Date(),
        currentStep: step,
        result: { answer: action.answer, data: action.data },
      });
      await appendEvent({ runId: config.runId, step, type: "run_completed", data: { answer: action.answer, data: action.data } });
      break;
    }

    if (decision.action.type === "fail") {
      const action = decision.action;
      await updateRunStatus(config.runId, "failed", {
        completedAt: new Date(),
        currentStep: step,
        error: action.reason,
      });
      await appendEvent({ runId: config.runId, step, type: "run_failed", data: { reason: action.reason } });
      break;
    }

    // Build browser action
    const browserAction = buildBrowserAction(decision.action);
    if (!browserAction) {
      await appendEvent({ runId: config.runId, step, type: "action_failed", data: { error: "Invalid action from LLM" } });
      await updateRunStatus(config.runId, "running", { currentStep: step });
      continue;
    }

    // Loop detection
    const selector = "selector" in browserAction ? browserAction.selector as string | null : null;
    if (detectLoop(loopTracker, obs.url, browserAction.type, selector, obs.text)) {
      await updateRunStatus(config.runId, "failed", {
        completedAt: new Date(),
        currentStep: step,
        error: "Loop detected: same action repeated 3 times with no page change",
      });
      await appendEvent({ runId: config.runId, step, type: "run_failed", data: { error: "loop_detected" } });
      break;
    }

    // Execute action
    const result = await executeAction(sessionId!, browserAction, { allowedDomains: config.allowedDomains ?? undefined });

    if (!result.success) {
      await appendEvent({ runId: config.runId, step, type: "action_failed", data: { action: browserAction.type, error: result.error } });
      await updateRunStatus(config.runId, "running", { currentStep: step });
      continue;
    }

    await appendEvent({ runId: config.runId, step, type: "action_executed", data: { action: browserAction.type } });

    // Handle screenshot artifact
    if (browserAction.type === "screenshot" && result.screenshotBase64) {
      await createArtifact({
        runId: config.runId,
        step,
        type: "screenshot",
        content: result.screenshotBase64,
        metadata: { format: "base64-png" },
      });
      await appendEvent({ runId: config.runId, step, type: "artifact_created", data: { type: "screenshot", step } });
    }

    // Handle extract artifact
    if (browserAction.type === "extract" && result.extractedData) {
      await createArtifact({
        runId: config.runId,
        step,
        type: "json",
        content: result.extractedData,
        metadata: { instruction: browserAction.instruction },
      });
      await appendEvent({ runId: config.runId, step, type: "artifact_created", data: { type: "json", step } });
    }

    await updateRunStatus(config.runId, "running", { currentStep: step });
    await new Promise((r) => setTimeout(r, 200)); // brief throttle
  }

  // Max steps reached without terminal status
  const finalRun = await getRun(config.runId);
  if (finalRun && !["completed", "failed", "cancelled", "timed_out"].includes(finalRun.status)) {
    await updateRunStatus(config.runId, "failed", {
      completedAt: new Date(),
      error: `Max steps (${config.maxSteps}) reached without completion`,
    });
    await appendEvent({ runId: config.runId, step: config.maxSteps, type: "run_failed", data: { error: "max_steps_exceeded" } });
  }

  // Cleanup
  if (sessionId) {
    await closeSession(sessionId);
  }

  logger.info("Agent run finished", { runId: config.runId, status: finalRun?.status });
}

// ============================================================
// Action Builder
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBrowserAction(action: any) {
  switch (action.type) {
    case "goto": return { type: "goto", url: action.url } as const;
    case "click": return { type: "click", selector: action.selector } as const;
    case "type": return { type: "type", selector: action.selector, text: action.text } as const;
    case "scroll": return { type: "scroll", direction: action.direction as "up" | "down", amount: action.amount } as const;
    case "wait": return { type: "wait", ms: action.ms } as const;
    case "screenshot": return { type: "screenshot" } as const;
    case "extract": return { type: "extract", instruction: action.instruction, schema: action.schema } as const;
    default: return null;
  }
}