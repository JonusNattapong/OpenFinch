import { pgTable, uuid, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  goal: text("goal").notNull(),
  status: text("status", { enum: ["queued", "running", "completed", "failed", "cancelled", "timed_out"] })
    .notNull()
    .default("queued"),
  startUrl: text("start_url"),
  provider: text("provider").default("openai"),
  model: text("model"),
  maxSteps: integer("max_steps").default(20),
  currentStep: integer("current_step").default(0),
  result: jsonb("result"),
  error: text("error"),
  allowedDomains: jsonb("allowed_domains"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentEvents = pgTable("agent_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").references(() => agentRuns.id).notNull(),
  step: integer("step").notNull(),
  type: text("type", { enum: [
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
  ]}).notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentArtifacts = pgTable("agent_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").references(() => agentRuns.id).notNull(),
  step: integer("step"),
  type: text("type", { enum: ["screenshot", "html", "markdown", "json", "text", "trace"] }).notNull(),
  url: text("url"),
  content: jsonb("content"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
