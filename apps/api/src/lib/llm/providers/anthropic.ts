import { LLMProvider, LLMCallOptions, LLMResponse } from "../types.js";

export function createAnthropicProvider(apiKey: string): LLMProvider {
  return {
    name: "anthropic",
    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
      const body = {
        model: options?.model ?? "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.1,
        system: options?.system ?? undefined,
        messages: [{ role: "user" as const, content: prompt }],
      };

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        content: Array<{ text: string }>;
        model: string;
        usage?: { input_tokens: number; output_tokens: number };
      };

      return {
        content: data.content[0]?.text ?? "",
        model: data.model,
        provider: "anthropic",
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined,
      };
    },
  };
}
