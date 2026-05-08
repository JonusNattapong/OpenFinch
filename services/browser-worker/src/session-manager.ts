import { Browser, BrowserContext, Page, chromium } from "playwright";
import { randomUUID } from "crypto";

export interface Session {
  sessionId: string;
  context: BrowserContext;
  page: Page;
  createdAt: number;
  expiresAt: number;
  viewport: { width: number; height: number };
}

const MAX_SESSIONS = parseInt(process.env.MAX_BROWSER_SESSIONS ?? "2", 10);
const DEFAULT_TTL = parseInt(process.env.BROWSER_SESSION_TTL_SECONDS ?? "300", 10);

let browser: Browser | null = null;
const sessions = new Map<string, Session>();

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: process.env.BROWSER_HEADLESS !== "false",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

export async function createSession(
  viewport: { width: number; height: number } = { width: 1280, height: 720 },
  ttlSeconds: number = DEFAULT_TTL,
): Promise<Session> {
  // Enforce max
  cleanupExpired();
  const activeCount = [...sessions.values()].filter(
    (s) => s.expiresAt > Date.now(),
  ).length;
  if (activeCount >= MAX_SESSIONS) {
    throw new Error(`Max browser sessions (${MAX_SESSIONS}) reached`);
  }

  const b = await getBrowser();
  const context = await b.newContext({ viewport });
  const page = await context.newPage();

  const sessionId = randomUUID();
  const now = Date.now();

  const session: Session = {
    sessionId,
    context,
    page,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
    viewport,
  };

  sessions.set(sessionId, session);
  return session;
}

export async function takeScreenshot(
  sessionId: string,
  fullPage: boolean = false,
): Promise<Buffer> {
  const session = getSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.expiresAt < Date.now()) throw new Error("Session expired");

  return await session.page.screenshot({ fullPage, type: "png" });
}

export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  if (session.expiresAt < Date.now()) {
    closeSession(sessionId).catch(() => {});
    return undefined;
  }
  return session;
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;
  try {
    await session.page.close();
    await session.context.close();
  } catch {
    // already closed
  }
  sessions.delete(sessionId);
}

export async function closeAll(): Promise<void> {
  for (const [id] of sessions) {
    await closeSession(id);
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) {
      closeSession(id).catch(() => {});
    }
  }
}

// Auto-cleanup every 30s
setInterval(cleanupExpired, 30_000);

export function getActiveCount(): number {
  cleanupExpired();
  return [...sessions.values()].filter((s) => s.expiresAt > Date.now()).length;
}
