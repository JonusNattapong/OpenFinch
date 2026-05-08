import { pgTable, uuid, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  task: text("task").notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] })
    .notNull()
    .default("pending"),
  provider: text("provider"),
  model: text("model"),
  maxSteps: integer("max_steps").default(20),
  currentStep: integer("current_step").default(0),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const agentEvents = pgTable("agent_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").references(() => agentRuns.id).notNull(),
  type: text("type", { enum: ["thought", "action", "observation", "result", "error"] })
    .notNull(),
  step: integer("step").notNull(),
  content: jsonb("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const browserSessions = pgTable("browser_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status", { enum: ["created", "active", "closed", "expired"] })
    .notNull()
    .default("created"),
  url: text("url"),
  width: integer("width").default(1280),
  height: integer("height").default(720),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  closedAt: timestamp("closed_at"),
});

export const screenshots = pgTable("screenshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => browserSessions.id).notNull(),
  url: text("url").notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
});

export const cacheEntries = pgTable("cache_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  ttl: integer("ttl").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
