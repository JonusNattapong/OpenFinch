import { Hono } from "hono";
import { z } from "zod";
import { getProvider, getAvailableProviders } from "../lib/llm/registry.js";
import { cacheGet, cacheSet } from "../lib/cache.js";
import { htmlToMarkdown, extractTitle } from "../lib/html-utils.js";

const ExtractBody = z.object({
  url: z.string().url().max(2048),
  prompt: z.string().max(2000).optional(),
  schema: z.record(z.any()).optional(),
  renderJs: z.union([z.literal("auto"), z.boolean()]).default("auto"),
  provider: z.string().optional(),
  model: z.string().optional(),
});

const EXTRACTION_SYSTEM_PROMPT = `You are a web data extraction assistant. Given the content of a webpage and a user's request, extract the requested information and return it as valid JSON.

Rules:
- Only extract information that is present in the content provided.
- If the user provides a schema, follow it strictly.
- If no schema is provided, return a sensible JSON structure.
- Do not make up information.
- Return ONLY valid JSON, no other text.`;

async function fetchPageContent(url: string): Promise<{ content: string; title: string | null }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "OpenFinch/0.1.0 (self-hosted AI web agent; +https://github.com/openfinch)",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching page`);

  const html = await res.text();
  const title = extractTitle(html);
  const content = htmlToMarkdown(html);

  return { content, title };
}

function attemptJsonRepair(text: string): string {
  // Try extracting JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Try finding a JSON object/array in the text
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket) ? firstBrace : firstBracket;
  if (start >= 0) {
    const end = text.lastIndexOf("}");
    const endBracket = text.lastIndexOf("]");
    const endPos = end >= 0 && (endBracket < 0 || end > endBracket) ? end + 1 : endBracket + 1;
    if (endPos > start) return text.slice(start, endPos);
  }

  return text;
}

export const extractRoute = new Hono();

extractRoute.post("/v1/extract", async (c) => {
  const start = performance.now();
  const body = ExtractBody.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }

  const { url, prompt, schema, provider, model } = body.data;

  // Check available providers
  let llmProvider;
  try {
    llmProvider = getProvider(provider);
  } catch (err) {
    const available = getAvailableProviders();
    return c.json({
      url,
      data: null,
      provider: provider ?? "none",
      model: null,
      cached: false,
      tookMs: Math.round(performance.now() - start),
      error: (err as Error).message,
      availableProviders: available,
    }, 400);
  }

  // Build cache key
  const schemaStr = schema ? JSON.stringify(schema) : "";
  const cacheKey = `extract:${url}:${prompt ?? ""}:${schemaStr}:${llmProvider.name}:${model ?? ""}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true, tookMs: Math.round(performance.now() - start) });
  }

  // Fetch page
  let pageContent: string;
  let pageTitle: string | null;
  try {
    const result = await fetchPageContent(url);
    pageContent = result.content.slice(0, 100_000); // cap input for LLM
    pageTitle = result.title;
  } catch (err) {
    return c.json({
      url,
      data: null,
      provider: llmProvider.name,
      model,
      cached: false,
      tookMs: Math.round(performance.now() - start),
      error: `Failed to fetch page: ${(err as Error).message}`,
    }, 502);
  }

  // Build extraction prompt
  let extractionPrompt = `Page URL: ${url}\n`;
  if (pageTitle) extractionPrompt += `Page Title: ${pageTitle}\n\n`;
  extractionPrompt += `Page Content:\n${pageContent}\n\n`;
  extractionPrompt += `User Request: ${prompt ?? "Extract the key information from this page as structured JSON."}`;

  if (schema) {
    extractionPrompt += `\n\nUse this JSON schema:\n${JSON.stringify(schema, null, 2)}`;
  }

  // Call LLM
  try {
    const response = await llmProvider.call(extractionPrompt, {
      model,
      system: EXTRACTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(attemptJsonRepair(response.content));
    } catch {
      // If parsing fails, return raw text
      parsedData = { raw: response.content };
    }

    const tookMs = Math.round(performance.now() - start);
    const result = {
      url,
      data: parsedData,
      schema: schema ?? null,
      provider: response.provider,
      model: response.model,
      cached: false,
      tookMs,
      traceId: crypto.randomUUID(),
    };

    await cacheSet(cacheKey, result, 3600); // 1 hour cache
    return c.json(result);
  } catch (err) {
    const tookMs = Math.round(performance.now() - start);
    return c.json({
      url,
      data: null,
      provider: llmProvider.name,
      model,
      cached: false,
      tookMs,
      error: `LLM call failed: ${(err as Error).message}`,
    }, 502);
  }
});
