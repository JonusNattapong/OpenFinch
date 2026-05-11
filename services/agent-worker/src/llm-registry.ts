import type { LLMCallOptions, LLMResponse } from "./types.js";

export interface LLMProvider {
  name: string;
  call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse>;
}

function createOpenAIProvider(apiKey: string, baseUrl = "https://api.openai.com/v1"): LLMProvider {
  return {
    name: "openai-compatible",
    async call(prompt: string, options?: LLMCallOptions) {
      const body = {
        model: options?.model ?? "gpt-4o",
        messages: [
          ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.1,
      };

      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);

      const data = (await res.json()) as { choices: Array<{ message: { content: string } }>; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }; model: string };
      return {
        content: data.choices[0]?.message?.content ?? "",
        model: data.model,
        provider: "openai-compatible",
        usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined,
      };
    },
  };
}

function createAnthropicProvider(apiKey: string): LLMProvider {
  return {
    name: "anthropic",
    async call(prompt: string, options?: LLMCallOptions) {
      const body = {
        model: options?.model ?? "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.1,
        system: options?.system ?? undefined,
        messages: [{ role: "user", content: prompt }],
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { content: Array<{ text: string }>; model: string; usage?: { input_tokens: number; output_tokens: number } };
      return {
        content: data.content[0]?.text ?? "",
        model: data.model,
        provider: "anthropic",
        usage: data.usage ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens, totalTokens: data.usage.input_tokens + data.usage.output_tokens } : undefined,
      };
    },
  };
}

function createOllamaProvider(baseUrl: string): LLMProvider {
  return {
    name: "ollama",
    async call(prompt: string, options?: LLMCallOptions) {
      const model = options?.model ?? process.env.OLLAMA_MODEL ?? "llama3.2";
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
            { role: "user", content: prompt },
          ],
          stream: false,
          options: { temperature: options?.temperature ?? 0.1, num_predict: options?.maxTokens ?? 4096 },
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { message?: { content: string }; model: string; eval_count?: number };
      return { content: data.message?.content ?? "", model: data.model, provider: "ollama", usage: data.eval_count ? { totalTokens: data.eval_count } : undefined };
    },
  };
}

const providers = new Map<string, LLMProvider>();

function getOrCreate(name: string): LLMProvider | null {
  if (providers.has(name)) return providers.get(name)!;

  let provider: LLMProvider | null = null;
  switch (name) {
    case "openai":
      if (process.env.OPENAI_API_KEY) provider = createOpenAIProvider(process.env.OPENAI_API_KEY!);
      break;
    case "openai-compatible":
      if (process.env.OPENAI_COMPATIBLE_API_KEY && process.env.OPENAI_COMPATIBLE_BASE_URL) {
        provider = createOpenAIProvider(process.env.OPENAI_COMPATIBLE_API_KEY, process.env.OPENAI_COMPATIBLE_BASE_URL);
      }
      break;
    case "openrouter":
      if (process.env.OPENROUTER_API_KEY) provider = createOpenAIProvider(process.env.OPENROUTER_API_KEY, "https://openrouter.ai/api/v1");
      break;
    case "anthropic":
      if (process.env.ANTHROPIC_API_KEY) provider = createAnthropicProvider(process.env.ANTHROPIC_API_KEY!);
      break;
    case "gemini":
      if (process.env.GEMINI_API_KEY) provider = createOpenAIProvider(process.env.GEMINI_API_KEY!, "https://generativelanguage.googleapis.com/v1beta/openai");
      break;
    case "ollama":
      provider = createOllamaProvider(process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
      break;
  }
  if (provider) providers.set(name, provider);
  return provider;
}

export function getProvider(name?: string): LLMProvider {
  const requested = name ?? "openai";
  const p = getOrCreate(requested);
  if (p) return p;

  // Fallback priority
  for (const fallback of ["openai", "anthropic", "openrouter", "gemini", "ollama"]) {
    const fp = getOrCreate(fallback);
    if (fp) return fp;
  }

  throw new Error(
    "No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, " +
    "OPENROUTER_API_KEY, or OLLAMA_BASE_URL.",
  );
}