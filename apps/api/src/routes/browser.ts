import { Hono } from "hono";
import { z } from "zod";

// In-memory session store (also persisted to Postgres in production)
interface BrowserSession {
  sessionId: string;
  status: "created" | "running" | "closed" | "expired";
  createdAt: string;
  expiresAt: string;
  viewport: { width: number; height: number };
}

const sessions = new Map<string, BrowserSession>();

const CreateSessionBody = z.object({
  headless: z.boolean().default(true),
  ttlSeconds: z.number().int().min(30).max(3600).default(300),
  viewport: z.object({
    width: z.number().int().min(320).max(3840).default(1280),
    height: z.number().int().min(240).max(2160).default(720),
  }).default({ width: 1280, height: 720 }),
});

const MAX_SESSIONS = parseInt(process.env.MAX_BROWSER_SESSIONS ?? "2", 10);

// Auto-expiry checker
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.status === "closed" || session.status === "expired") {
      sessions.delete(id);
      continue;
    }
    if (new Date(session.expiresAt).getTime() < now) {
      sessions.set(id, { ...session, status: "expired" });
    }
  }
}, 10_000);

function generateId(): string {
  return crypto.randomUUID();
}

export const browserRoute = new Hono();

// Create session
browserRoute.post("/v1/browser/session", async (c) => {
  // Enforce max sessions
  const activeCount = [...sessions.values()].filter(
    (s) => s.status === "created" || s.status === "running",
  ).length;
  if (activeCount >= MAX_SESSIONS) {
    return c.json({ error: `Max browser sessions (${MAX_SESSIONS}) reached. Close an existing session first.` }, 429);
  }

  const body = CreateSessionBody.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }

  const { headless, ttlSeconds, viewport } = body.data;

  const sessionId = generateId();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const session: BrowserSession = {
    sessionId,
    status: "created",
    createdAt,
    expiresAt,
    viewport,
  };

  sessions.set(sessionId, session);

  // TODO: enqueue to browser-worker for actual Playwright launch

  return c.json({
    sessionId,
    status: "created",
    createdAt,
    expiresAt,
  });
});

// Get session
browserRoute.get("/v1/browser/session/:id", async (c) => {
  const sessionId = c.req.param("id");
  const session = sessions.get(sessionId);
  if (!session) return c.json({ error: "Session not found" }, 404);

  return c.json({
    sessionId: session.sessionId,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });
});

// Screenshot
browserRoute.post("/v1/browser/session/:id/screenshot", async (c) => {
  const sessionId = c.req.param("id");
  const session = sessions.get(sessionId);
  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.status === "closed" || session.status === "expired") {
    return c.json({ error: `Session is ${session.status}` }, 400);
  }

  // TODO: enqueue to browser-worker for actual screenshot capture
  return c.json({
    sessionId,
    screenshotUrl: null,
    capturedAt: new Date().toISOString(),
    message: "Screenshot requires browser-worker to be running. Use agent API for end-to-end browser tasks.",
  });
});

// Delete/close session
browserRoute.delete("/v1/browser/session/:id", async (c) => {
  const sessionId = c.req.param("id");
  const session = sessions.get(sessionId);
  if (!session) return c.json({ error: "Session not found" }, 404);

  session.status = "closed";
  // TODO: enqueue close to browser-worker

  return c.json({ sessionId, status: "closed" });
});
