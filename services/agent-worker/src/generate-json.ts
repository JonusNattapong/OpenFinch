import { getProvider } from "./llm-registry.js";
import type { LLMProvider } from "./llm-registry.js";
import type { ZodType } from "zod";

export interface GenerateJsonOptions {
  provider: LLMProvider;
  model?: string;
  system?: string;
  prompt: string;
  schema: ZodType;
  temperature?: number;
  maxTokens?: number;
}

export class JsonGenerationError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastResponse: string,
  ) {
    super(message);
    this.name = "JsonGenerationError";
  }
}

function repairJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) return block[1].trim();
  const first = text.indexOf("{");
  const firstArr = text.indexOf("[");
  const start = first >= 0 && (firstArr < 0 || first < firstArr) ? first : firstArr;
  if (start < 0) return text;
  const lastBrace = text.lastIndexOf("}");
  const lastArr = text.lastIndexOf("]");
  const end = lastBrace >= 0 && (lastArr < 0 || lastBrace > lastArr) ? lastBrace + 1 : lastArr + 1;
  return end > start ? text.slice(start, end) : text;
}

function parseJson<T>(raw: string, schema: ZodType): T | null {
  try {
    const repaired = repairJson(raw);
    return schema.parse(JSON.parse(repaired)) as T;
  } catch {
    return null;
  }
}

export async function generateJson<T>(opts: GenerateJsonOptions): Promise<T> {
  const { provider, model, system, prompt, schema, temperature = 0.1, maxTokens = 4096 } = opts;

  const call = async (p: string, repair: boolean): Promise<string> => {
    const hint = repair
      ? "\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No explanation, no markdown, no wrapping. Start with { or [."
      : "";
    const resp = await provider.call(p + hint, {
      model,
      system,
      temperature,
      maxTokens,
    });
    return resp.content;
  };

  let raw = await call(prompt, false);
  let result = parseJson<T>(raw, schema);
  if (result !== null) return result;

  raw = await call(prompt, true);
  result = parseJson<T>(raw, schema);
  if (result !== null) return result;

  throw new JsonGenerationError("Failed to generate valid JSON after 2 attempts", 2, raw.slice(0, 500));
}