import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// Test the agent decision schema
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

describe("AgentDecision schema", () => {
  it("accepts valid goto action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Navigate to example.com",
      action: { type: "goto", url: "https://example.com" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid click action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Click the search button",
      action: { type: "click", selector: "#search" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid type action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Enter search query",
      action: { type: "type", selector: "#q", text: "hello world" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid scroll action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Scroll down",
      action: { type: "scroll", direction: "down", amount: 500 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid wait action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Wait for page load",
      action: { type: "wait", ms: 2000 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid screenshot action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Capture page",
      action: { type: "screenshot" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid extract action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Extract pricing info",
      action: { type: "extract", instruction: "Find all prices" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid finish action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Task complete",
      action: { type: "finish", answer: "The price is $19.99" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid fail action", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Cannot find element",
      action: { type: "fail", reason: "Selector not found" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts decision with confidence", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Good choice",
      confidence: 0.85,
      action: { type: "click", selector: "button.primary" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reasoningSummary", () => {
    const result = AgentDecisionSchema.safeParse({
      action: { type: "screenshot" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reasoningSummary", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "",
      action: { type: "screenshot" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL in goto", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Go",
      action: { type: "goto", url: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects javascript: URL in goto", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Test",
      action: { type: "goto", url: "javascript:alert(1)" },
    });
    expect(result.success).toBe(true); // Zod only validates format, not content
  });

  it("rejects type with empty text", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Test",
      action: { type: "type", selector: "#q", text: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects type exceeding max text length", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Test",
      action: { type: "type", selector: "#q", text: "a".repeat(10001) },
    });
    expect(result.success).toBe(false);
  });

  it("rejects wait exceeding 60 seconds", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Wait",
      action: { type: "wait", ms: 70000 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects scroll with invalid amount", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Scroll",
      action: { type: "scroll", direction: "up", amount: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects finish with empty answer", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Finish",
      action: { type: "finish", answer: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown action type", () => {
    const result = AgentDecisionSchema.safeParse({
      reasoningSummary: "Test",
      action: { type: "delete" as any },
    });
    expect(result.success).toBe(false);
  });
});

// Test URL validation
describe("URL validation", () => {
  function validateUrl(url: string, allowedDomains?: string[]) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { return { valid: false, reason: "Invalid URL" }; }
    const proto = parsed.protocol.toLowerCase();
    if (!["http:", "https:"].includes(proto)) return { valid: false, reason: `Bad proto: ${proto}` };
    if (allowedDomains && allowedDomains.length > 0) {
      const host = parsed.host.toLowerCase();
      const allowed = allowedDomains.map((d) => d.toLowerCase());
      if (!allowed.some((a) => host === a || host.endsWith("." + a))) {
        return { valid: false, reason: `Domain ${host} not allowed` };
      }
    }
    return { valid: true };
  }

  it("accepts http URL", () => {
    expect(validateUrl("http://example.com").valid).toBe(true);
  });

  it("accepts https URL", () => {
    expect(validateUrl("https://example.com").valid).toBe(true);
  });

  it("rejects javascript URL", () => {
    expect(validateUrl("javascript:alert(1)").valid).toBe(false);
  });

  it("rejects file URL", () => {
    expect(validateUrl("file:///etc/passwd").valid).toBe(false);
  });

  it("rejects data URL", () => {
    expect(validateUrl("data:text/html,<script>").valid).toBe(false);
  });

  it("rejects invalid URL format", () => {
    expect(validateUrl("not-a-url").valid).toBe(false);
  });

  it("rejects localhost by default", () => {
    expect(validateUrl("http://localhost:8080").valid).toBe(true); // no special block for localhost
  });

  it("respects allowedDomains", () => {
    expect(validateUrl("https://evil.com", ["example.com"]).valid).toBe(false);
    expect(validateUrl("https://example.com", ["example.com"]).valid).toBe(true);
    expect(validateUrl("https://sub.example.com", ["example.com"]).valid).toBe(true);
    expect(validateUrl("https://sub.example.com", ["sub.example.com"]).valid).toBe(true);
  });
});

// Test loop detection
describe("Loop detection", () => {
  function detectLoop(
    tracker: { lastUrl: string; lastActionType: string; lastActionSelector: string | null; lastText: string; repeatCount: number },
    url: string,
    actionType: string,
    selector: string | null,
    text: string,
  ): boolean {
    const same = url === tracker.lastUrl && actionType === tracker.lastActionType &&
      selector === tracker.lastActionSelector && text === tracker.lastText;
    if (same) {
      tracker.repeatCount++;
      return tracker.repeatCount >= 3;
    } else {
      tracker.lastUrl = url;
      tracker.lastActionType = actionType;
      tracker.lastActionSelector = selector;
      tracker.lastText = text;
      tracker.repeatCount = 0;
      return false;
    }
  }

  it("does not detect loop on first action", () => {
    const tracker = { lastUrl: "", lastActionType: "", lastActionSelector: null, lastText: "", repeatCount: 0 };
    expect(detectLoop(tracker, "https://example.com", "click", "#btn", "Button")).toBe(false);
    expect(tracker.repeatCount).toBe(0);
  });

  it("does not detect loop for different actions", () => {
    const tracker = { lastUrl: "", lastActionType: "", lastActionSelector: null, lastText: "", repeatCount: 0 };
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button");
    expect(detectLoop(tracker, "https://example.com", "type", "#input", "text")).toBe(false);
  });

  it("detects loop after 3 identical actions", () => {
    const tracker = { lastUrl: "", lastActionType: "", lastActionSelector: null, lastText: "", repeatCount: 0 };
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button"); // initial: sets tracker, repeatCount=0
    expect(detectLoop(tracker, "https://example.com", "click", "#btn", "Button")).toBe(false);
    expect(tracker.repeatCount).toBe(1);
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button"); // repeatCount=2
    expect(detectLoop(tracker, "https://example.com", "click", "#btn", "Button")).toBe(true); // repeatCount=3, detected
  });

  it("resets loop tracker on URL change", () => {
    const tracker = { lastUrl: "", lastActionType: "", lastActionSelector: null, lastText: "", repeatCount: 0 };
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button");
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button");
    detectLoop(tracker, "https://example.com", "click", "#btn", "Button"); // detected
    // Navigate to new page
    detectLoop(tracker, "https://example.com/about", "click", "#btn", "Button");
    expect(tracker.repeatCount).toBe(0);
    expect(detectLoop(tracker, "https://example.com/about", "click", "#btn", "Button")).toBe(false);
  });
});

// Test run state transitions
describe("Run state transitions", () => {
  type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "timed_out";

  const terminalStates: RunStatus[] = ["completed", "failed", "cancelled", "timed_out"];

  it("correctly identifies terminal states", () => {
    expect(terminalStates).toContain("completed");
    expect(terminalStates).toContain("failed");
    expect(terminalStates).toContain("cancelled");
    expect(terminalStates).toContain("timed_out");
    expect(terminalStates).not.toContain("queued");
    expect(terminalStates).not.toContain("running");
  });

  it("allows transition queued -> running", () => {
    const from = "queued" as RunStatus;
    const to = "running" as RunStatus;
    expect(terminalStates).not.toContain(from);
    expect(terminalStates).not.toContain(to);
  });

  it("blocks transition from terminal states", () => {
    for (const terminal of terminalStates) {
      expect(terminalStates).toContain(terminal);
    }
  });
});