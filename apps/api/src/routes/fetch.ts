import { Hono } from "hono";
import { z } from "zod";
import { cacheGet, cacheSet } from "../lib/cache.js";
import { isUrlAllowed } from "../lib/robots-txt.js";
import { htmlToMarkdown, extractTitle } from "../lib/html-utils.js";

const FetchBody = z.object({
  url: z.string().url().max(2048),
  format: z.enum(["markdown", "text", "html", "json"]).default("markdown"),
  renderJs: z.union([z.literal("auto"), z.boolean()]).default("auto"),
  timeoutMs: z.number().int().min(1000).max(60000).default(15000),
});

async function httpFetch(url: string, timeoutMs: number) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "OpenFinch/0.1.0 (self-hosted AI web agent; +https://github.com/openfinch)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });

  const rawHtml = await res.text();
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const contentLength = rawHtml.length;
  const title = extractTitle(rawHtml);

  return { status: res.status, rawHtml, title, contentType, contentLength };
}

export const fetchRoute = new Hono();

fetchRoute.post("/v1/fetch", async (c) => {
  const start = performance.now();
  const body = FetchBody.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({
      url: "", title: null, content: "", format: "markdown" as const,
      status: 400, rendered: false, cached: false, tookMs: 0,
      metadata: { contentType: null, contentLength: null },
      error: body.error.flatten(),
    }, 400);
  }

  const { url, format, renderJs, timeoutMs } = body.data;

  if (process.env.RESPECT_ROBOTS_TXT !== "false") {
    const allowed = await isUrlAllowed(url);
    if (!allowed) {
      return c.json({
        url, title: null, content: "", format,
        status: 403, rendered: false, cached: false,
        tookMs: Math.round(performance.now() - start),
        metadata: { contentType: null, contentLength: null },
        error: "Blocked by robots.txt",
      }, 403);
    }
  }

  const cacheKey = `fetch:${url}:${format}:${renderJs}`;
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true, tookMs: Math.round(performance.now() - start) });
  }

  try {
    const { status, rawHtml, title, contentType, contentLength } = await httpFetch(url, timeoutMs);

    let content = rawHtml;
    if (format === "markdown") content = htmlToMarkdown(rawHtml);
    else if (format === "text") {
      content = htmlToMarkdown(rawHtml)
        .replace(/\*\*/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/```[\s\S]*?```/g, "");
    } else if (format === "json") {
      content = JSON.stringify({ url, title, html: rawHtml.slice(0, 100_000) });
    }

    content = content.slice(0, 500_000);
    const tookMs = Math.round(performance.now() - start);
    const result = {
      url, title, content, format, status, rendered: false, cached: false, tookMs,
      metadata: { contentType: contentType || null, contentLength },
    };

    await cacheSet(cacheKey, result, 3600);
    return c.json(result);
  } catch (err) {
    return c.json({
      url, title: null, content: "", format, status: 502, rendered: false, cached: false,
      tookMs: Math.round(performance.now() - start),
      metadata: { contentType: null, contentLength: null },
      error: (err as Error).message,
    }, 502);
  }
});
