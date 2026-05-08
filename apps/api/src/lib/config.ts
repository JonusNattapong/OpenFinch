import { env, envInt, envBool } from "@openfinch/shared";

export const config = {
  apiPort: envInt("API_PORT", 8787),
  logLevel: env("LOG_LEVEL", "info"),
  nodeEnv: env("NODE_ENV", "development"),

  // Database
  databaseUrl: env("DATABASE_URL", "postgresql://openfinch:openfinch@localhost:5432/openfinch"),

  // Redis
  redisUrl: env("REDIS_URL", "redis://localhost:6379"),

  // Search
  searxngUrl: env("SEARXNG_URL", "http://localhost:8080"),

  // LLM providers
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  ollamaBaseUrl: env("OLLAMA_BASE_URL", "http://localhost:11434"),
  openaiCompatibleBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
  openaiCompatibleApiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
  openaiCompatibleModel: process.env.OPENAI_COMPATIBLE_MODEL,

  // Browser
  maxBrowserSessions: envInt("MAX_BROWSER_SESSIONS", 2),
  browserSessionTtlSeconds: envInt("BROWSER_SESSION_TTL_SECONDS", 300),
  browserHeadless: envBool("BROWSER_HEADLESS", true),

  // Agent
  maxAgentSteps: envInt("MAX_AGENT_STEPS", 20),
  maxAgentRuntimeSeconds: envInt("MAX_AGENT_RUNTIME_SECONDS", 180),

  // Safety
  respectRobotsTxt: envBool("RESPECT_ROBOTS_TXT", true),

  // MinIO
  minioEndpoint: env("MINIO_ENDPOINT", "localhost:9000"),
  minioAccessKey: env("MINIO_ACCESS_KEY", "openfinch"),
  minioSecretKey: env("MINIO_SECRET_KEY", "openfinch-secret"),
  minioBucket: env("MINIO_BUCKET", "openfinch-artifacts"),
  minioUseSsl: envBool("MINIO_USE_SSL", false),
};
