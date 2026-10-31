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

export function selectQueryState<T extends QueryResult>(
  state: QueryState<T>,
  key: string,
  scope: string,
  cached: CachedQueryState<T>,
) {
  if (state.key === key && state.scope === scope) {
    return {
      data: state.data,
      loading: state.loading,
      refreshing: state.refreshing,
      failed: state.failed,
    };
  }

  return {
    data: cached.data,
    loading: cached.data === undefined,
    refreshing: cached.data !== undefined && !cached.fresh,
    failed: false,
  };
}

export function useFinanceQuery<T extends QueryResult>(
  key: string,
  query: () => Promise<T>,
  scope: string,
) {
  const cached = getFinanceCacheState<T>(key, scope);

  const [state, setState] = useState<QueryState<T>>(() => ({
    key,
    scope,
    data: cached.data,
    loading: cached.data === undefined,
    refreshing: cached.data !== undefined && !cached.fresh,
    failed: false,
  }));

  const currentState = selectQueryState(state, key, scope, cached);

  useEffect(() => {
    let active = true;

    function applyResult(result: T) {
      if (!active) return;

      setState((current) => ({
        key,
        scope,
        data: result.ok
          ? result
          : current.key === key && current.scope === scope
            ? current.data
            : undefined,
        loading: false,
        refreshing: false,
        failed: !result.ok,
      }));
    }

    function markFailed() {
      if (!active) return;

      setState((current) => {
        if (current.key !== key || current.scope !== scope) return current;

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
    setState((current) =>
      current.key === key && current.scope === scope
        ? { ...current, refreshing: true, failed: false }
        : current,
    );

    cachedFinanceQuery(key, query, { scope })
      .then((result) => {
        setState((current) => {
          if (current.key !== key || current.scope !== scope) return current;

          return {
            ...current,
            data: result.ok ? result : current.data,
            refreshing: false,
            failed: !result.ok,
          };
        });
      })
      .catch(() => {
        setState((current) =>
          current.key === key && current.scope === scope
            ? { ...current, refreshing: false, failed: true }
            : current,
        );
      });
  }, [key, query, scope]);

  return { ...currentState, refetch };
}
