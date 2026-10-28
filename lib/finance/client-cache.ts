"use client";

type FinanceCacheValue = { ok?: boolean } | null | undefined;

type CacheEntry<T extends FinanceCacheValue> = { data?: T; promise?: Promise<T>; updatedAt: number };

export type FinanceCacheOptions = { scope?: string; ttlMs?: number };

type CacheListener<T> = (queryResult: T) => void;

const entries = new Map<string, CacheEntry<FinanceCacheValue>>();

const listeners = new Map<string, Set<CacheListener<FinanceCacheValue>>>();

export const FINANCE_CACHE_TTL_MS = 15_000;

function scopedKey(key: string, scope = "anonymous") {
  return `${scope}::${key}`;
}

function isSuccessfulResult(queryResult: FinanceCacheValue) {
  return !queryResult || !Object.prototype.hasOwnProperty.call(queryResult, "ok") || queryResult.ok !== false;
}

export function getFinanceCacheState<T extends FinanceCacheValue>(key: string, scope = "anonymous") {
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
  const typedListener: CacheListener<FinanceCacheValue> = (queryResult) => listener(queryResult as T);
  current.add(typedListener);
  listeners.set(cacheKey, current);

  return () => {
    current.delete(typedListener);

    if (!current.size) listeners.delete(cacheKey);
  };
}

function notify(cacheKey: string, queryResult: FinanceCacheValue) {
  for (const listener of listeners.get(cacheKey) ?? []) listener(queryResult);
}

export function cachedFinanceQuery<T extends FinanceCacheValue>(key: string, query: () => Promise<T>, options: FinanceCacheOptions = {}) {
  const scope = options.scope ?? "anonymous";
  const cacheKey = scopedKey(key, scope);
  const ttl = options.ttlMs ?? FINANCE_CACHE_TTL_MS;
  const current = entries.get(cacheKey) as CacheEntry<T> | undefined;

  if (current?.promise) return current.promise;

  if (current?.data !== undefined && Date.now() - current.updatedAt < ttl) return Promise.resolve(current.data);

  const startedAt = typeof performance === "undefined" ? 0 : performance.now();
  const promise = query();
  entries.set(cacheKey, { data: current?.data, updatedAt: current?.updatedAt ?? 0, promise });
  void promise.then((queryResult) => {
    const latest = entries.get(cacheKey) as CacheEntry<T> | undefined;

    if (!latest || latest.promise !== promise) return;
    latest.promise = undefined;

    if (isSuccessfulResult(queryResult)) {
      latest.data = queryResult;
      latest.updatedAt = Date.now();
      notify(cacheKey, queryResult);
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

export function financeScope(orgId: string | null | undefined, userId: string | null | undefined) {
  return `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
}
