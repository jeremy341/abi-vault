"use client";

type CacheEntry<T> = { data?: T; promise?: Promise<T>; updatedAt: number };

export type FinanceCacheOptions = { scope?: string; ttlMs?: number };
type CacheListener = (value: unknown) => void;

const entries = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<CacheListener>>();
export const FINANCE_CACHE_TTL_MS = 15_000;

function scopedKey(key: string, scope = "anonymous") {
  return `${scope}::${key}`;
}

function isSuccessfulResult(value: unknown) {
  return !value || typeof value !== "object" || !("ok" in value) || value.ok !== false;
}

export function getFinanceCacheState<T>(key: string, scope = "anonymous") {
  const entry = entries.get(scopedKey(key, scope)) as CacheEntry<T> | undefined;
  if (!entry) return { data: undefined, fresh: false, refreshing: false };
  return {
    data: entry.data,
    fresh: entry.data !== undefined && Date.now() - entry.updatedAt < FINANCE_CACHE_TTL_MS,
    refreshing: Boolean(entry.promise),
  };
}

export function getCachedFinanceData<T>(key: string, scope = "anonymous") {
  return getFinanceCacheState<T>(key, scope).data;
}

export function subscribeFinanceQuery(key: string, listener: CacheListener, scope = "anonymous") {
  const cacheKey = scopedKey(key, scope);
  const current = listeners.get(cacheKey) ?? new Set<CacheListener>();
  current.add(listener);
  listeners.set(cacheKey, current);
  return () => {
    current.delete(listener);
    if (!current.size) listeners.delete(cacheKey);
  };
}

function notify(cacheKey: string, value: unknown) {
  for (const listener of listeners.get(cacheKey) ?? []) listener(value);
}

export function cachedFinanceQuery<T>(key: string, query: () => Promise<T>, options: FinanceCacheOptions = {}) {
  const scope = options.scope ?? "anonymous";
  const cacheKey = scopedKey(key, scope);
  const ttl = options.ttlMs ?? FINANCE_CACHE_TTL_MS;
  const current = entries.get(cacheKey) as CacheEntry<T> | undefined;
  if (current?.promise) return current.promise;
  if (current?.data !== undefined && Date.now() - current.updatedAt < ttl) return Promise.resolve(current.data);

  const startedAt = typeof performance === "undefined" ? 0 : performance.now();
  const promise = query();
  entries.set(cacheKey, { data: current?.data, updatedAt: current?.updatedAt ?? 0, promise });
  void promise.then((value) => {
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
