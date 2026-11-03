"use client";

type FinanceCacheValue = { ok?: boolean } | null | undefined;

type CacheEntry<T extends FinanceCacheValue> = {
  data?: T;
  promise?: Promise<T>;
  updatedAt: number;
};

export type FinanceCacheOptions = { scope?: string; ttlMs?: number };

type CacheListener<T> = (queryResult: T) => void;

const entries = new Map<string, CacheEntry<FinanceCacheValue>>();

const listeners = new Map<string, Set<CacheListener<FinanceCacheValue>>>();

export const FINANCE_CACHE_TTL_MS = 15_000;

function scopedKey(key: string, scope = "anonymous") {
  return `${scope}::${key}`;
}

function isSuccessfulResult(queryResult: FinanceCacheValue) {
  if (!queryResult) return true;

  if (!Object.prototype.hasOwnProperty.call(queryResult, "ok")) return true;

  return queryResult.ok !== false;
}

export function getFinanceCacheState<T extends FinanceCacheValue>(key: string, scope = "anonymous") {
  const entry = entries.get(scopedKey(key, scope)) as CacheEntry<T> | undefined;

  if (!entry) {
    return { data: undefined, fresh: false, refreshing: false };
  }

  const isFresh = entry.data !== undefined && Date.now() - entry.updatedAt < FINANCE_CACHE_TTL_MS;

  return {
    data: entry.data,
    fresh: isFresh,
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
  const keyListeners = listeners.get(cacheKey) ?? new Set<CacheListener<FinanceCacheValue>>();
  const typedListener: CacheListener<FinanceCacheValue> = (queryResult) => listener(queryResult as T);
  keyListeners.add(typedListener);
  listeners.set(cacheKey, keyListeners);

  return () => {
    keyListeners.delete(typedListener);

    if (!keyListeners.size) {
      listeners.delete(cacheKey);
    }
  };
}

function notify(cacheKey: string, queryResult: FinanceCacheValue) {
  const cacheListeners = listeners.get(cacheKey) ?? [];

  for (const listener of cacheListeners) {
    listener(queryResult);
  }
}

export function cachedFinanceQuery<T extends FinanceCacheValue>(key: string, query: () => Promise<T>, options: FinanceCacheOptions = {}) {
  const scope = options.scope ?? "anonymous";
  const cacheKey = scopedKey(key, scope);
  const ttl = options.ttlMs ?? FINANCE_CACHE_TTL_MS;
  const existing = entries.get(cacheKey) as CacheEntry<T> | undefined;

  if (existing?.promise) {
    return existing.promise;
  }

  if (existing?.data !== undefined && Date.now() - existing.updatedAt < ttl) {
    return Promise.resolve(existing.data);
  }

  const startedAt = typeof performance === "undefined" ? 0 : performance.now();
  const promise = query();
  entries.set(cacheKey, { data: existing?.data, updatedAt: existing?.updatedAt ?? 0, promise });
  void promise
    .then((queryResult) => {
      const latest = entries.get(cacheKey) as CacheEntry<T> | undefined;

      if (!latest || latest.promise !== promise) return;
      latest.promise = undefined;

      if (isSuccessfulResult(queryResult)) {
        latest.data = queryResult;
        latest.updatedAt = Date.now();
        notify(cacheKey, queryResult);
      }

      const duration = startedAt ? performance.now() - startedAt : 0;

      if (process.env.NODE_ENV === "development" && duration > 300) {
        console.debug(`[finance] ${key} took ${Math.round(duration)}ms`);
      }
    })
    .catch(() => {
      const latest = entries.get(cacheKey) as CacheEntry<T> | undefined;

      if (latest?.promise === promise) {
        latest.promise = undefined;
      }
    });

  return promise;
}

export function invalidateFinanceQuery(...keys: string[]) {
  if (!keys.length) {
    entries.clear();

    return;
  }

  for (const cacheKey of entries.keys()) {
    const matches = keys.some((key) => cacheKey.endsWith(`::${key}`) || cacheKey === key);

    if (matches) {
      entries.delete(cacheKey);
    }
  }
}

export function clearFinanceCache() {
  entries.clear();
  listeners.clear();
}

export function financeScope(orgId: string | null | undefined, userId: string | null | undefined) {
  const orgPart = orgId ?? "no-org";
  const userPart = userId ?? "anonymous";

  return `${orgPart}:${userPart}`;
}
