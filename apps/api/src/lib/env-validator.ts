import { config } from "./config.js";

export interface EnvCheck {
  name: string;
  required: boolean;
  present: boolean;
  hint: string;
}

export function validateEnv(): EnvCheck[] {
  const checks: EnvCheck[] = [
    // Core infra (always required)
    { name: "DATABASE_URL", required: true, present: !!config.databaseUrl, hint: "Set DATABASE_URL to a Postgres connection string" },
    { name: "REDIS_URL", required: true, present: !!config.redisUrl, hint: "Set REDIS_URL to a Redis connection string" },
    { name: "SEARXNG_URL", required: true, present: !!config.searxngUrl, hint: "Set SEARXNG_URL to your SearXNG instance" },

    // LLM providers (at least one recommended)
    { name: "OPENAI_API_KEY", required: false, present: !!config.openaiApiKey, hint: "Set OPENAI_API_KEY for OpenAI provider" },
    { name: "ANTHROPIC_API_KEY", required: false, present: !!config.anthropicApiKey, hint: "Set ANTHROPIC_API_KEY for Anthropic provider" },
    { name: "GEMINI_API_KEY", required: false, present: !!config.geminiApiKey, hint: "Set GEMINI_API_KEY for Gemini provider" },
    { name: "OPENROUTER_API_KEY", required: false, present: !!config.openrouterApiKey, hint: "Set OPENROUTER_API_KEY for OpenRouter provider" },
    { name: "OLLAMA_BASE_URL", required: false, present: !!config.ollamaBaseUrl && config.ollamaBaseUrl !== "http://localhost:11434", hint: "Set OLLAMA_BASE_URL for local Ollama models" },
  ];

  return checks;
}

export function checkRequiredEnv(): void {
  const checks = validateEnv();
  const missing = checks.filter((c) => c.required && !c.present);

  if (missing.length > 0) {
    console.error("[openfinch] Missing required environment variables:");
    for (const m of missing) {
      console.error(`  - ${m.name}: ${m.hint}`);
    }
    throw new Error(`Missing ${missing.length} required environment variable(s)`);
  }

  const configuredProviders = checks.filter((c) => !c.required && c.present);
  if (configuredProviders.length === 0) {
    console.warn("[openfinch] No LLM provider configured. Extract and Agent APIs will not work.");
    console.warn("  Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or OLLAMA_BASE_URL");
  } else {
    console.log(`[openfinch] LLM providers configured: ${configuredProviders.map((c) => c.name.replace(/_API_KEY|_BASE_URL/, "")).join(", ")}`);
  }
}
