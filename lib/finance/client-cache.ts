"use client";

type CacheEntry<T> = { promise: Promise<T>; createdAt: number };

const entries = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 2_000;

export function cachedFinanceQuery<T>(key: string, query: () => Promise<T>) {
  const current = entries.get(key) as CacheEntry<T> | undefined;
  if (current && Date.now() - current.createdAt < CACHE_TTL_MS) return current.promise;
  const promise = query();
  entries.set(key, { promise, createdAt: Date.now() });
  const startedAt = performance.now();
  void promise.then(() => {
    const duration = performance.now() - startedAt;
    if (process.env.NODE_ENV === "development" && duration > 300) {
      console.debug(`[finance] ${key} took ${Math.round(duration)}ms`);
    }
  }).catch(() => undefined);
  return promise;
}

export function invalidateFinanceQuery(...keys: string[]) {
  if (!keys.length) entries.clear();
  for (const key of keys) entries.delete(key);
}
