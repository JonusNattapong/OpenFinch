import { LLMProvider, LLMCallOptions, LLMResponse } from "../types.js";

interface OpenAICompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export function createOpenAIProvider(
  apiKey: string,
  baseUrl: string = "https://api.openai.com/v1",
): LLMProvider {
  return {
    name: "openai-compatible",
    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
      const body: OpenAICompletionRequest = {
        model: options?.model ?? "gpt-4o",
        messages: [
          ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.1,
      };

      if (options?.schema) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model: string;
      };

      return {
        content: data.choices[0]?.message?.content ?? "",
        model: data.model,
        provider: "openai-compatible",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    },
  };
}
