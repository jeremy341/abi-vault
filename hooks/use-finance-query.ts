"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cachedFinanceQuery,
  getFinanceCacheState,
  invalidateFinanceQuery,
  subscribeFinanceQuery,
} from "@/lib/finance/client-cache";

type QueryResult = { ok: boolean };

type QueryState<T extends QueryResult> = {
  key: string;
  scope: string;
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  failed: boolean;
};

type CachedQueryState<T> = {
  data: T | undefined;
  fresh: boolean;
};

function isSameQuery<T extends QueryResult>(state: QueryState<T>, key: string, scope: string) {
  return state.key === key && state.scope === scope;
}

export function selectQueryState<T extends QueryResult>(
  state: QueryState<T>,
  key: string,
  scope: string,
  cached: CachedQueryState<T>,
) {
  if (isSameQuery(state, key, scope)) {
    return {
      data: state.data,
      loading: state.loading,
      refreshing: state.refreshing,
      failed: state.failed,
    };
  }

  const hasCachedData = cached.data !== undefined;

  return {
    data: cached.data,
    loading: !hasCachedData,
    refreshing: hasCachedData && !cached.fresh,
    failed: false,
  };
}

export function useFinanceQuery<T extends QueryResult>(
  key: string,
  query: () => Promise<T>,
  scope: string,
) {
  const cached = getFinanceCacheState<T>(key, scope);
  const hasCachedData = cached.data !== undefined;

  const [state, setState] = useState<QueryState<T>>(() => ({
    key,
    scope,
    data: cached.data,
    loading: !hasCachedData,
    refreshing: hasCachedData && !cached.fresh,
    failed: false,
  }));

  const currentState = selectQueryState(state, key, scope, cached);

  useEffect(() => {
    let active = true;

    function applyResult(result: T) {
      if (!active) return;

      setState((current) => {
        let data: T | undefined;

        if (result.ok) {
          data = result;
        } else if (isSameQuery(current, key, scope)) {
          data = current.data;
        } else {
          data = undefined;
        }

        return {
          key,
          scope,
          data,
          loading: false,
          refreshing: false,
          failed: !result.ok,
        };
      });
    }

    function markFailed() {
      if (!active) return;

      setState((current) => {
        if (!isSameQuery(current, key, scope)) return current;

        return { ...current, loading: false, refreshing: false, failed: true };
      });
    }

    const unsubscribe = subscribeFinanceQuery<T>(key, applyResult, scope);

    cachedFinanceQuery(key, query, { scope })
      .then(applyResult)
      .catch(markFailed);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, query, scope]);

  const refetch = useCallback(() => {
    invalidateFinanceQuery(key);

    setState((current) => {
      if (!isSameQuery(current, key, scope)) return current;

      return { ...current, refreshing: true, failed: false };
    });

    cachedFinanceQuery(key, query, { scope })
      .then((result) => {
        setState((current) => {
          if (!isSameQuery(current, key, scope)) return current;

          let data: T | undefined;

          if (result.ok) {
            data = result;
          } else {
            data = current.data;
          }

          return {
            ...current,
            data,
            refreshing: false,
            failed: !result.ok,
          };
        });
      })
      .catch(() => {
        setState((current) => {
          if (!isSameQuery(current, key, scope)) return current;

          return { ...current, refreshing: false, failed: true };
        });
      });
  }, [key, query, scope]);

  return { ...currentState, refetch };
}
