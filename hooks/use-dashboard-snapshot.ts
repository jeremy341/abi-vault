"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import {
  cachedFinanceQuery,
  getFinanceCacheState,
  subscribeFinanceQuery,
} from "@/lib/finance/client-cache";

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>> & { ok: true };

export function useDashboardSnapshot() {
  const { userId, orgId } = useAuth();
  const scope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  const cached = getFinanceCacheState<DashboardSnapshot>("dashboard-snapshot", scope);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(cached.data ?? null);
  const [loading, setLoading] = useState(!cached.data);
  const [refreshing, setRefreshing] = useState(Boolean(cached.data && !cached.fresh));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const applyResult = (result: Awaited<ReturnType<typeof getDashboardSnapshot>>) => {
      if (!active) return;
      if (result.ok) {
        setSnapshot(result);
        setError(null);
      } else {
        setError("Die Finanzübersicht konnte nicht geladen werden.");
      }
    };
    const unsubscribe = subscribeFinanceQuery("dashboard-snapshot", (value) => applyResult(value as Awaited<ReturnType<typeof getDashboardSnapshot>>), scope);
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, { scope }).then(applyResult).catch(() => {
      if (active) setError("Die Finanzübersicht konnte nicht geladen werden.");
    }).finally(() => {
      if (active) {
        setLoading(false);
        setRefreshing(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [scope]);
  return { snapshot, loading, refreshing, error };
}
