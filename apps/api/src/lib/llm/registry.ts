import { LLMProvider } from "./types.js";
import { createOpenAIProvider } from "./providers/openai-compatible.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createOllamaProvider } from "./providers/ollama.js";
import { config } from "../config.js";

const providers = new Map<string, LLMProvider>();

function getOrCreate(name: string): LLMProvider | null {
  if (providers.has(name)) return providers.get(name)!;

  let provider: LLMProvider | null = null;

  switch (name) {
    case "openai":
      if (config.openaiApiKey) {
        provider = createOpenAIProvider(config.openaiApiKey);
      }
      break;
    case "openai-compatible":
      if (config.openaiCompatibleBaseUrl && config.openaiCompatibleApiKey) {
        provider = createOpenAIProvider(
          config.openaiCompatibleApiKey,
          config.openaiCompatibleBaseUrl,
        );
      }
      break;
    case "openrouter":
      if (config.openrouterApiKey) {
        provider = createOpenAIProvider(config.openrouterApiKey, "https://openrouter.ai/api/v1");
      }
      break;
    case "anthropic":
      if (config.anthropicApiKey) {
        provider = createAnthropicProvider(config.anthropicApiKey);
      }
      break;
    case "gemini":
      // Gemini uses OpenAI-compatible endpoint
      if (config.geminiApiKey) {
        provider = createOpenAIProvider(config.geminiApiKey, "https://generativelanguage.googleapis.com/v1beta/openai");
      }
      break;
    case "ollama":
      provider = createOllamaProvider(config.ollamaBaseUrl);
      break;
  }

  if (provider) providers.set(name, provider);
  return provider;
}

export function getProvider(name?: string): LLMProvider {
  const requested = name ?? "openai";
  const provider = getOrCreate(requested);

  if (provider) return provider;

  // Fallback: try providers in priority order
  const priority = ["openai", "anthropic", "openrouter", "gemini", "ollama"];
  for (const p of priority) {
    const fallback = getOrCreate(p);
    if (fallback) return fallback;
  }

  throw new Error(
    "No LLM provider configured. Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, " +
    "GEMINI_API_KEY, OPENROUTER_API_KEY, or OLLAMA_BASE_URL for local models.",
  );
}

export function getAvailableProviders(): string[] {
  const available: string[] = [];
  const checks: Array<[string, () => LLMProvider | null]> = [
    ["openai", () => config.openaiApiKey ? createOpenAIProvider(config.openaiApiKey!) : null],
    ["anthropic", () => config.anthropicApiKey ? createAnthropicProvider(config.anthropicApiKey!) : null],
    ["openrouter", () => config.openrouterApiKey ? createOpenAIProvider(config.openrouterApiKey!, "https://openrouter.ai/api/v1") : null],
    ["gemini", () => config.geminiApiKey ? createOpenAIProvider(config.geminiApiKey!, "https://generativelanguage.googleapis.com/v1beta/openai") : null],
    ["ollama", () => createOllamaProvider(config.ollamaBaseUrl)],
  ];

  for (const [name, factory] of checks) {
    try {
      if (factory()) available.push(name);
    } catch {
      // skip
    }
  }

  return available;
}
