import { LLMProvider, LLMCallOptions, LLMResponse } from "../types.js";

export function createOllamaProvider(baseUrl: string = "http://localhost:11434"): LLMProvider {
  return {
    name: "ollama",
    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
      const model = options?.model ?? process.env.OLLAMA_MODEL ?? "llama3.2";
      const url = `${baseUrl.replace(/\/+$/, "")}/api/chat`;

      const body = {
        model,
        messages: [
          ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
          { role: "user" as const, content: prompt },
        ],
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.1,
          num_predict: options?.maxTokens ?? 4096,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000), // Ollama can be slow
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        message?: { content: string };
        model: string;
        eval_count?: number;
      };

      return {
        content: data.message?.content ?? "",
        model: data.model,
        provider: "ollama",
        usage: data.eval_count ? { totalTokens: data.eval_count } : undefined,
      };
    },
  };
}
