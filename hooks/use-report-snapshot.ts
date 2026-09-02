"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { getReportSnapshot } from "@/features/finance/actions/queries";
import {
  cachedFinanceQuery,
  getFinanceCacheState,
  subscribeFinanceQuery,
} from "@/lib/finance/client-cache";

export function useReportSnapshot() {
  const { userId, orgId } = useAppAuth();
  const scope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  type ReportSnapshot = Extract<Awaited<ReturnType<typeof getReportSnapshot>>, { ok: true }>;
  const cached = getFinanceCacheState<ReportSnapshot>("report-snapshot", scope);
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(cached.data ?? null);
  const [loading, setLoading] = useState(!cached.data);
  const [refreshing, setRefreshing] = useState(Boolean(cached.data && !cached.fresh));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const applyResult = (result: Awaited<ReturnType<typeof getReportSnapshot>>) => {
      if (!active) return;
      if (result.ok) {
        setSnapshot(result);
        setError(null);
      } else {
        setError("Die Berichte konnten nicht geladen werden.");
      }
    };
    const unsubscribe = subscribeFinanceQuery("report-snapshot", (value) => applyResult(value as Awaited<ReturnType<typeof getReportSnapshot>>), scope);
    cachedFinanceQuery("report-snapshot", getReportSnapshot, { scope }).then(applyResult).catch(() => {
      if (active) setError("Die Berichte konnten nicht geladen werden.");
    }).finally(() => {
      if (active) { setLoading(false); setRefreshing(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, [scope]);
  return { snapshot, loading, refreshing, error };
}
