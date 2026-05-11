import type { LLMProvider } from "./types.js";
import { type ZodType, type ZodSchema } from "zod";

export interface GenerateJsonOptions<T> {
  provider: LLMProvider;
  model?: string;
  system?: string;
  prompt: string;
  schema: ZodSchema<T>;
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

function attemptRepair(text: string): string {
  // Try extracting JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Try finding JSON object/array
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
    ? firstBrace
    : firstBracket;

  if (start < 0) return text;

  const endBrace = text.lastIndexOf("}");
  const endBracket = text.lastIndexOf("]");
  const endPos = endBrace >= 0 && (endBracket < 0 || endBrace > endBracket)
    ? endBrace + 1
    : endBracket >= 0 ? endBracket + 1 : -1;

  if (endPos <= start) return text;
  return text.slice(start, endPos);
}

export async function generateJson<T>(
  options: GenerateJsonOptions<T>,
): Promise<T> {
  const { provider, model, system, prompt, schema, temperature = 0.1, maxTokens = 4096 } = options;

  const callLLM = async (p: string, repair = false): Promise<string> => {
    const repairHint = repair
      ? "\n\nIMPORTANT: Return ONLY valid JSON. Do not include any explanation, markdown, or wrapping text. Start with { or [."
      : "";

    const response = await provider.call(p + repairHint, {
      model,
      system,
      temperature,
      maxTokens,
      schema: undefined,
    });

    return response.content;
  };

  // First attempt
  let raw = await callLLM(prompt, false);

  // Parse and validate
  let parsed = attemptJson(raw, schema);
  if (parsed !== null) return parsed;

  // Retry once with repair prompt
  raw = await callLLM(prompt, true);
  parsed = attemptJson(raw, schema);
  if (parsed !== null) return parsed;

  throw new JsonGenerationError(
    "Failed to generate valid JSON after 2 attempts",
    2,
    raw.slice(0, 500),
  );
}

function attemptJson<T>(raw: string, schema: ZodSchema<T>): T | null {
  try {
    const repaired = attemptRepair(raw);
    const parsed = JSON.parse(repaired);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}