// Dual cache: Redis (primary) + in-memory fallback

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

export async function cacheGet<T>(key: string): Promise<T | null> {
  const fullKey = REDIS_PREFIX + key;

  // Try memory first (fast path)
  const mem = memoryGet<T>(fullKey);
  if (mem !== null) return mem;

  // Try Redis
  try {
    const r = await getRedis();
    if (r) {
      const val = await r.get(fullKey);
      if (val) {
        const parsed = JSON.parse(val) as { data: T; expires?: number };
        // Also populate memory cache
        memorySet(fullKey, parsed.data, 60);
        return parsed.data as T;
      }
    }
  } catch {
    // Redis unavailable - already using memory fallback
  }

  return null;
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number = 300): Promise<void> {
  const fullKey = REDIS_PREFIX + key;

  // Always write to memory
  memorySet(fullKey, data, ttlSeconds);

  // Try Redis
  try {
    const r = await getRedis();
    if (r) {
      await r.set(fullKey, JSON.stringify({ data }), { EX: ttlSeconds });
    } else if (!redisWarned) {
      redisWarned = true;
      console.warn("[cache] Redis unavailable, using in-memory cache only");
    }
  } catch {
    // non-fatal
  }
}
