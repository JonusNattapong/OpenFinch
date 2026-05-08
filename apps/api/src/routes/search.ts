import { Hono } from "hono";
import { z } from "zod";
import { cacheGet, cacheSet } from "../lib/cache.js";
import { config } from "../lib/config.js";

const SearchBody = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  language: z.string().optional(),
  region: z.string().optional(),
});

async function searchSearXNG(
  query: string,
  limit: number,
  language?: string,
  region?: string,
) {
  const baseUrl = config.searxngUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({ q: query, format: "json", pageno: "1" });
  if (language) params.set("language", language);

  const res = await fetch(`${baseUrl}/search?${params}`, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`SearXNG returned ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
      engine?: string;
    }>;
  };
  return (data.results ?? []).slice(0, limit).map((r, i) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.content ?? "",
    source: r.engine ?? null,
    rank: i + 1,
  }));
}

export const searchRoute = new Hono();

searchRoute.post("/v1/search", async (c) => {
  const start = performance.now();
  const body = SearchBody.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({
      query: "",
      results: [],
      cached: false,
      tookMs: 0,
      error: body.error.flatten(),
    }, 400);
  }

  const { query, limit, language, region } = body.data;
  const cacheKey = `search:${query}:${limit}:${language ?? ""}:${region ?? ""}`;

  const cached = await cacheGet<{
    query: string;
    results: Array<{ title: string; url: string; snippet: string; source: string | null; rank: number }>;
  }>(cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true, tookMs: Math.round(performance.now() - start) });
  }

  try {
    const results = await searchSearXNG(query, limit, language, region);
    const tookMs = Math.round(performance.now() - start);
    const response = { query, results, cached: false, tookMs };
    await cacheSet(cacheKey, response, 600); // 10 min cache
    return c.json(response);
  } catch (err) {
    const tookMs = Math.round(performance.now() - start);
    return c.json({
      query,
      results: [],
      cached: false,
      tookMs,
      error: (err as Error).message,
    }, 502);
  }
});
