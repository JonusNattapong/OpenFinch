import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

// ============================================================
// Types
// ============================================================

export interface InteractiveElement {
  selector: string;
  tagName: string;
  role?: string;
  text?: string;
  ariaLabel?: string;
  placeholder?: string;
  href?: string;
  isVisible: boolean;
}

export interface Observation {
  url: string;
  title: string;
  text: string;
  interactiveElements: InteractiveElement[];
  screenshotUrl?: string;
  timestamp: string;
}

export type AgentAction =
  | { type: "goto"; url: string }
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; text: string }
  | { type: "scroll"; direction: "up" | "down"; amount?: number }
  | { type: "wait"; ms: number }
  | { type: "screenshot" }
  | { type: "extract"; instruction: string; schema?: unknown }
  | { type: "finish"; answer: string; data?: unknown }
  | { type: "fail"; reason: string };

export interface ActionResult {
  success: boolean;
  error?: string;
  observation?: Observation;
  screenshotBase64?: string;
  extractedData?: unknown;
}

// ============================================================
// URL / Domain Safety Validation
// ============================================================

const BLOCKED_PROTOCOLS = ["javascript:", "data:", "file:"];
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

export function validateUrl(url: string, allowedDomains?: string[]): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  const proto = parsed.protocol.toLowerCase();
  if (!["http:", "https:"].includes(proto)) {
    return { valid: false, reason: `Protocol ${proto} is not allowed. Use http or https.` };
  }

  if (BLOCKED_PROTOCOLS.some((p) => proto === p)) {
    return { valid: false, reason: `Protocol ${proto} is blocked.` };
  }

  if (allowedDomains && allowedDomains.length > 0) {
    const host = parsed.host.toLowerCase();
    const allowed = allowedDomains.map((d) => d.toLowerCase());
    const matches = allowed.some((a) => host === a || host.endsWith("." + a));
    if (!matches) {
      return { valid: false, reason: `Domain ${host} is not in allowed domains: ${allowed.join(", ")}` };
    }
  }

  return { valid: true };
}

// ============================================================
// Session Management
// ============================================================

let browser: Browser | null = null;
const activeSessions = new Map<string, { context: BrowserContext; page: Page; sessionId: string }>();

export async function createSession(options: {
  headless?: boolean;
  width?: number;
  height?: number;
}): Promise<string> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: options.headless ?? true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }

  const context = await browser.newContext({
    viewport: { width: options.width ?? 1280, height: options.height ?? 720 },
  });
  const page = await context.newPage();

  const sessionId = crypto.randomUUID();
  activeSessions.set(sessionId, { context, page, sessionId });
  return sessionId;
}

export function getPage(sessionId: string): Page | null {
  const session = activeSessions.get(sessionId);
  return session?.page ?? null;
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  try {
    await session.page.close();
    await session.context.close();
  } catch {
    // already closed
  }
  activeSessions.delete(sessionId);
}

export async function closeAllSessions(): Promise<void> {
  for (const [id] of activeSessions) {
    await closeSession(id);
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// ============================================================
// Observe
// ============================================================

const MAX_TEXT_LENGTH = 30_000;

export async function observe(sessionId: string): Promise<Observation> {
  const page = getPage(sessionId);
  if (!page) throw new Error("Session not found or expired");

  const url = page.url();
  let title = "";
  let text = "";
  let interactiveElements: InteractiveElement[] = [];

  try {
    title = await page.title();
  } catch { /* ignore */ }

  // Get visible text from body
  try {
    text = await page.evaluate(() => {
      const body = document.body;
      if (!body) return "";
      // Get text content, stripping scripts and styles
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("script, style, noscript, svg, canvas").forEach((el) => el.remove());
      return clone.innerText ?? "";
    });
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + "\n...[truncated]";
    }
  } catch { /* ignore */ }

  // Get interactive elements
  try {
    interactiveElements = await page.evaluate(() => {
      const targets = document.querySelectorAll(
        "a, button, input, textarea, select, [role='button'], [role='link'], [role='textbox'], [role='combobox'], [onclick]",
      );
      const results: Array<{
        selector: string;
        tagName: string;
        role: string | undefined;
        text: string | undefined;
        ariaLabel: string | undefined;
        placeholder: string | undefined;
        href: string | undefined;
        isVisible: boolean;
      }> = [];

      for (const el of Array.from(targets)) {
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && el.tagName !== "INPUT") continue;

        // Build selector
        let selector = "";
        if (el.id) selector = `#${el.id}`;
        else if (el.getAttribute("data-testid")) selector = `[data-testid="${el.getAttribute("data-testid")}"]`;
        else if (el.getAttribute("aria-label")) selector = `[aria-label="${el.getAttribute("aria-label")}"]`;
        else if (el.getAttribute("name")) selector = `${el.tagName.toLowerCase}[name="${el.getAttribute("name")}"]`;
        else {
          // CSS path fallback
          const path: string[] = [];
          let current: Element | null = el;
          while (current && path.length < 5) {
            let part = current.tagName.toLowerCase();
            if (current.id) { part += `#${current.id}`; path.unshift(part); break; }
            const cls = Array.from(current.classList).filter(Boolean).join(".");
            if (cls) part += `.${cls}`;
            if (path.length === 0 || cls) path.unshift(part);
            current = current.parentElement;
          }
          selector = path.join(" > ");
        }

        results.push({
          selector,
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute("role") ?? undefined,
          text: ((el as HTMLElement).innerText ?? el.textContent ?? "").trim().slice(0, 200) || undefined,
          ariaLabel: el.getAttribute("aria-label") ?? undefined,
          placeholder: (el as HTMLInputElement).placeholder || undefined,
          href: (el as HTMLAnchorElement).href || undefined,
          isVisible: rect.top >= 0 && rect.top < window.innerHeight,
        });
      }

      return results;
    });
  } catch { /* ignore */ }

  return {
    url,
    title,
    text,
    interactiveElements,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Action Execution
// ============================================================

export async function executeAction(
  sessionId: string,
  action: AgentAction,
  options?: { allowedDomains?: string[] },
): Promise<ActionResult> {
  const page = getPage(sessionId);
  if (!page) return { success: false, error: "Session not found or expired" };

  switch (action.type) {
    case "goto": {
      const validation = validateUrl(action.url, options?.allowedDomains);
      if (!validation.valid) return { success: false, error: validation.reason };
      try {
        await page.goto(action.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        // Brief wait for JS execution
        await page.waitForTimeout(500);
      } catch (err) {
        return { success: false, error: `Navigation failed: ${(err as Error).message}` };
      }
      break;
    }

    case "click": {
      try {
        await page.click(action.selector, { timeout: 10_000 });
        await page.waitForTimeout(300);
      } catch (err) {
        return { success: false, error: `Click failed: ${(err as Error).message}` };
      }
      break;
    }

    case "type": {
      try {
        await page.fill(action.selector, action.text);
        await page.waitForTimeout(100);
      } catch (err) {
        return { success: false, error: `Type failed: ${(err as Error).message}` };
      }
      break;
    }

    case "scroll": {
      const amount = action.amount ?? 500;
      if (action.direction === "down") {
        await page.evaluate((dy) => window.scrollBy(0, dy), amount);
      } else {
        await page.evaluate((dy) => window.scrollBy(0, -dy), amount);
      }
      await page.waitForTimeout(200);
      break;
    }

    case "wait": {
      const ms = Math.min(action.ms, 60_000);
      await page.waitForTimeout(ms);
      break;
    }

    case "screenshot": {
      const buffer = await page.screenshot({ type: "png" });
      return {
        success: true,
        screenshotBase64: buffer.toString("base64"),
      };
    }

    case "finish":
    case "fail":
      // Handled by caller
      return { success: true };
  }

  // Return new observation after action
  const obs = await observe(sessionId);
  return { success: true, observation: obs };
}

// ============================================================
// Loop Detection
// ============================================================

interface LoopTracker {
  lastUrl: string;
  lastActionType: string;
  lastActionSelector: string | null;
  lastText: string;
  repeatCount: number;
}

export function detectLoop(
  tracker: LoopTracker,
  url: string,
  actionType: string,
  selector: string | null,
  text: string,
): boolean {
  const same = url === tracker.lastUrl &&
    actionType === tracker.lastActionType &&
    selector === tracker.lastActionSelector &&
    text === tracker.lastText;

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