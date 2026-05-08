import { createMiddleware } from "hono/factory";
import { cacheGet, cacheSet } from "../lib/cache.js";

// Domain-level rate limiting using the existing cache layer.
// Tracks per-domain request counts.

export const domainRateLimit = (maxRequests: number = 30, windowSeconds: number = 60) =>
  createMiddleware(async (c, next) => {
    // Only rate-limit POST endpoints that take a URL or query
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    let targetDomain = "unknown";
    try {
      const body = await c.req.json();
      if (body.url) targetDomain = new URL(body.url).hostname;
      else if (body.query) targetDomain = "search";
    } catch {
      // not JSON or no body - skip
    }

    const key = `ratelimit:${targetDomain}`;
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / (windowSeconds * 1000))}`;

    const current = (await cacheGet<number>(windowKey)) ?? 0;
    if (current >= maxRequests) {
      return c.json({
        error: `Rate limit exceeded for domain "${targetDomain}". Max ${maxRequests} requests per ${windowSeconds}s.`,
      }, 429);
    }

    await cacheSet(windowKey, current + 1, windowSeconds);

    await next();
  });
