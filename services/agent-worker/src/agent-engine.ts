import { logger } from "@openfinch/shared";

export interface AgentConfig {
  runId: string;
  url?: string;
  goal: string;
  outputSchema?: Record<string, unknown>;
  provider: string;
  model?: string;
  maxSteps: number;
  maxRuntimeSeconds: number;
  renderJs: boolean;
}

export interface AgentStep {
  step: number;
  thought: string;
  action: string;
  actionInput: Record<string, unknown>;
  observation: string;
}

const AGENT_SYSTEM_PROMPT = `You are a web automation agent. You have access to a browser and can perform actions on web pages.

Your capabilities:
1. navigate(url) — Go to a URL
2. click(selector) — Click an element by CSS selector
3. type(selector, text) — Type text into an input
4. extract(prompt) — Extract information from the current page
5. screenshot() — Capture the current page
6. wait(ms) — Wait for a duration in milliseconds
7. finish(result) — Complete the task with a result

Rules:
- Always respond with ONE action at a time.
- Format your response as a JSON object with "thought", "action", and "actionInput" fields.
- The "action" must be one of: navigate, click, type, extract, screenshot, wait, finish
- For "finish", provide the final result in actionInput.result
- Be thorough. Read the page carefully.
- If you need more info, use extract() to read page content.
- Max steps: {{MAX_STEPS}}

Current step: {{STEP}}`;

export async function runAgent(config: AgentConfig): Promise<{
  status: string;
  result: unknown;
  steps: AgentStep[];
  error?: string;
}> {
  const steps: AgentStep[] = [];
  const startTime = Date.now();
  const runtimeLimit = config.maxRuntimeSeconds * 1000;

  try {
    // TODO: In a full implementation, this would use Playwright to:
    // 1. Launch browser
    // 2. Navigate to URL (if provided)
    // 3. Loop: observe page → LLM decides action → execute action → observe result
    // 4. Store events to API or DB
    // 5. Return final result

    // For now, simulate a basic agent loop
    const step: AgentStep = {
      step: 0,
      thought: "Analyzing the request",
      action: "navigate",
      actionInput: { url: config.url ?? "about:blank" },
      observation: `Starting agent run for goal: "${config.goal.slice(0, 100)}"`,
    };
    steps.push(step);

    // Check runtime
    if (Date.now() - startTime > runtimeLimit) {
      return {
        status: "timeout",
        result: null,
        steps,
        error: "Agent run timed out",
      };
    }

    // Final step
    steps.push({
      step: 1,
      thought: "Task analysis complete",
      action: "finish",
      actionInput: { result: `Completed analysis of: ${config.goal.slice(0, 100)}` },
      observation: "Agent run simulation complete",
    });

    logger.info("Agent run completed", {
      runId: config.runId,
      steps: steps.length,
      duration: Date.now() - startTime,
    });

    return {
      status: "succeeded",
      result: { summary: `Agent completed task: ${config.goal.slice(0, 200)}`, steps: steps.length },
      steps,
    };
  } catch (err) {
    logger.error("Agent run error", { runId: config.runId, error: (err as Error).message });

    steps.push({
      step: steps.length,
      thought: "Error encountered",
      action: "finish",
      actionInput: {},
      observation: `Error: ${(err as Error).message}`,
    });

    return {
      status: "failed",
      result: null,
      steps,
      error: (err as Error).message,
    };
  }
}
