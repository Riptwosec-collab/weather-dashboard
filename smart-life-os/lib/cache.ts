type CacheRecord<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();

export async function getCached<T>(key: string): Promise<T | null> {
  const record = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (!record || record.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return record.value;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<T> {
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value
  });

  return value;
}

export async function cachedJson<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached) return cached;

  const value = await loader();
  await setCached(key, value, ttlSeconds);
  return value;
}

export const cacheTtl = {
  weather: 60 * 15,
  market: 60,
  places: 60 * 60 * 6,
  briefing: 60 * 10,
  tech: 60 * 30
} as const;
