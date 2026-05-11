// Three-tier cache: Memory (L1) → Redis (L2) → Postgres (L3, durable)
// - Memory: fastest, process-local, lost on restart
// - Redis: shared across instances, lost on restart
// - Postgres: persistent, survives everything, slowest

import { db } from "../db/index.js";
import { cacheEntries } from "../db/schema.js";
import { eq, and, gt, lt } from "drizzle-orm";

const memoryCache = new Map<string, { data: unknown; expires: number }>();
const REDIS_PREFIX = "openfinch:cache:";

async function getRedisClient(): Promise<import("redis").RedisClientType | null> {
  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
    client.on("error", () => {});
    await client.connect();
    return client as import("redis").RedisClientType;
  } catch {
    return null;
  }
}

let redisClientPromise: Promise<import("redis").RedisClientType | null> | null = null;
let redisWarned = false;

function getRedis(): Promise<import("redis").RedisClientType | null> {
  if (!redisClientPromise) {
    redisClientPromise = getRedisClient().catch(() => null);
  }
  return redisClientPromise;
}

function memoryGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function memorySet(key: string, data: unknown, ttlSeconds: number): void {
  memoryCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
  // Evict old entries if cache grows too large
  if (memoryCache.size > 1000) {
    const keys = [...memoryCache.keys()];
    for (let i = 0; i < 200; i++) {
      memoryCache.delete(keys[i]);
    }
  }
}

// --- Postgres helpers (L3 — durable fallback) ---
let pgWarned = false;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}

async function pgGet<T>(key: string): Promise<T | null> {
  const rows = await withTimeout(
    db
      .select({ value: cacheEntries.value })
      .from(cacheEntries)
      .where(and(eq(cacheEntries.key, key), gt(cacheEntries.expiresAt, new Date())))
      .limit(1),
    2000 // 2s timeout — fast-fail when DB is unavailable
  );
  if (rows === null) {
    if (!pgWarned) {
      pgWarned = true;
      console.warn("[cache] Postgres query timed out — cache unavailable");
    }
    return null;
  }
  return (rows[0]?.value as T) ?? null;
}

async function pgSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await withTimeout(
    db
      .insert(cacheEntries)
      .values({ key, value: value as Record<string, unknown>, ttl: ttlSeconds, expiresAt })
      .onConflictDoUpdate({ target: cacheEntries.key, set: { value: value as Record<string, unknown>, ttl: ttlSeconds, expiresAt } }),
    2000
  );
  // non-fatal — best-effort only
}

async function pgDeleteExpired(): Promise<void> {
  await withTimeout(
    db.delete(cacheEntries).where(lt(cacheEntries.expiresAt, new Date())),
    5000
  );
}

// Kick off periodic cleanup every 10 minutes (best-effort)
setInterval(() => pgDeleteExpired(), 10 * 60 * 1000);

export async function cacheGet<T>(key: string): Promise<T | null> {
  const fullKey = REDIS_PREFIX + key;

  // L1: Memory (fastest)
  const mem = memoryGet<T>(fullKey);
  if (mem !== null) return mem;

  // L2: Redis
  try {
    const r = await getRedis();
    if (r) {
      const val = await r.get(fullKey);
      if (val) {
        const parsed = JSON.parse(val) as { data: T };
        memorySet(fullKey, parsed.data, 60);
        return parsed.data as T;
      }
    }
  } catch {
    // fall through to L3
  }

  // L3: Postgres (durable fallback)
  const pg = await pgGet<T>(fullKey);
  if (pg !== null) {
    memorySet(fullKey, pg, 60);
    // Re-populate Redis asynchronously (best-effort)
    getRedis().then(async (r) => {
      if (r) {
        try {
          await r.set(fullKey, JSON.stringify({ data: pg }), { EX: 300 });
        } catch { /* non-fatal */ }
      }
    });
    return pg;
  }

  return null;
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number = 300): Promise<void> {
  const fullKey = REDIS_PREFIX + key;

  // Write to all tiers in parallel
  memorySet(fullKey, data, ttlSeconds);

  const redisSet = (async () => {
    try {
      const r = await getRedis();
      if (r) {
        await r.set(fullKey, JSON.stringify({ data }), { EX: ttlSeconds });
      }
    } catch {
      // non-fatal
    }
  })();

  const pgSetAsync = pgSet(fullKey, data, ttlSeconds);

  await Promise.all([redisSet, pgSetAsync]);
}
