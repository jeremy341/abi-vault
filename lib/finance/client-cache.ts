"use client";

type FinanceCacheValue = { ok?: boolean } | null | undefined;

type CacheEntry<T extends FinanceCacheValue> = { data?: T; promise?: Promise<T>; updatedAt: number };

export type FinanceCacheOptions = { scope?: string; ttlMs?: number };

type CacheListener<T> = (value: T) => void;

const entries = new Map<string, CacheEntry<FinanceCacheValue>>();

const listeners = new Map<string, Set<CacheListener<FinanceCacheValue>>>();

export const FINANCE_CACHE_TTL_MS = 15_000;

function scopedKey(key: string, scope = "anonymous") {
  return `${scope}::${key}`;
}

function isSuccessfulResult(value: FinanceCacheValue) {
  return !value || !Object.prototype.hasOwnProperty.call(value, "ok") || value.ok !== false;
}

export function getFinanceCacheState<T extends FinanceCacheValue>(key: string, scope = "anonymous") {
  // SAFETY: all cache entries are created by cachedFinanceQuery with the same key and value type.
  const entry = entries.get(scopedKey(key, scope)) as CacheEntry<T> | undefined;

  if (!entry) return { data: undefined, fresh: false, refreshing: false };

  return {
    data: entry.data,
    fresh: entry.data !== undefined && Date.now() - entry.updatedAt < FINANCE_CACHE_TTL_MS,
    refreshing: Boolean(entry.promise),
  };
}

export function getCachedFinanceData<T extends FinanceCacheValue>(key: string, scope = "anonymous") {
  return getFinanceCacheState<T>(key, scope).data;
}

export function subscribeFinanceQuery<T>(
  key: string,
  listener: CacheListener<T>,
  scope = "anonymous",
) {
  const cacheKey = scopedKey(key, scope);
  const current = listeners.get(cacheKey) ?? new Set<CacheListener<FinanceCacheValue>>();
  // SAFETY: the caller's listener type is paired with the same cache key and query value.
  const typedListener: CacheListener<FinanceCacheValue> = (value) => listener(value as T);
  current.add(typedListener);
  listeners.set(cacheKey, current);

  return () => {
    current.delete(typedListener);

    if (!current.size) listeners.delete(cacheKey);
  };
}

function notify(cacheKey: string, value: FinanceCacheValue) {
  for (const listener of listeners.get(cacheKey) ?? []) listener(value);
}

export function cachedFinanceQuery<T extends FinanceCacheValue>(key: string, query: () => Promise<T>, options: FinanceCacheOptions = {}) {
  const scope = options.scope ?? "anonymous";
  const cacheKey = scopedKey(key, scope);
  const ttl = options.ttlMs ?? FINANCE_CACHE_TTL_MS;
  // SAFETY: the cache key is paired with the query generic at every call site.
  const current = entries.get(cacheKey) as CacheEntry<T> | undefined;

  if (current?.promise) return current.promise;

  if (current?.data !== undefined && Date.now() - current.updatedAt < ttl) return Promise.resolve(current.data);

  const startedAt = typeof performance === "undefined" ? 0 : performance.now();
  const promise = query();
  entries.set(cacheKey, { data: current?.data, updatedAt: current?.updatedAt ?? 0, promise });
  void promise.then((value) => {
    // SAFETY: this promise is the value stored for the same typed cache key.
    const latest = entries.get(cacheKey) as CacheEntry<T> | undefined;

    if (!latest || latest.promise !== promise) return;
    latest.promise = undefined;

    if (isSuccessfulResult(value)) {
      latest.data = value;
      latest.updatedAt = Date.now();
      notify(cacheKey, value);
    }

    const duration = startedAt ? performance.now() - startedAt : 0;

    if (process.env.NODE_ENV === "development" && duration > 300) console.debug(`[finance] ${key} took ${Math.round(duration)}ms`);
  }).catch(() => {
    // SAFETY: this promise is the value stored for the same typed cache key.
    const latest = entries.get(cacheKey) as CacheEntry<T> | undefined;

    if (latest?.promise === promise) latest.promise = undefined;
  });

  return promise;
}

export function invalidateFinanceQuery(...keys: string[]) {
  if (!keys.length) {
    entries.clear();

    return;
  }

  for (const cacheKey of entries.keys()) {
    if (keys.some((key) => cacheKey.endsWith(`::${key}`) || cacheKey === key)) entries.delete(cacheKey);
  }
}

export function clearFinanceCache() {
  entries.clear();
  listeners.clear();
}
