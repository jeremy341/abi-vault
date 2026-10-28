"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cachedFinanceQuery,
  getFinanceCacheState,
  invalidateFinanceQuery,
  subscribeFinanceQuery,
} from "@/lib/finance/client-cache";

type QueryResult = { ok: boolean };

// The query must be a stable module-level function, otherwise the effect re-runs on every render.
export function useFinanceQuery<T extends QueryResult>(
  key: string,
  query: () => Promise<T>,
  scope: string,
) {
  const cached = getFinanceCacheState<T>(key, scope);
  const [data, setData] = useState<T | undefined>(cached.data);
  const [loading, setLoading] = useState(!cached.data);
  const [refreshing, setRefreshing] = useState(Boolean(cached.data && !cached.fresh));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const apply = (result: T) => {
      if (!active) return;

      if (result.ok) setData(result);
      setFailed(!result.ok);
    };

    const unsubscribe = subscribeFinanceQuery<T>(key, apply, scope);

    cachedFinanceQuery(key, query, { scope })
      .then(apply)
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, query, scope]);

  const refetch = useCallback(() => {
    invalidateFinanceQuery(key);
    setRefreshing(true);

    cachedFinanceQuery(key, query, { scope })
      .then((result) => setFailed(!result.ok))
      .catch(() => setFailed(true))
      .finally(() => setRefreshing(false));
  }, [key, query, scope]);

  return { data, loading, refreshing, failed, refetch };
}
