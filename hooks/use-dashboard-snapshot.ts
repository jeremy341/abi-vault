"use client";

import { useAppAuth } from "@/components/auth/app-auth";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { financeScope } from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>> & { ok: true };

export function useDashboardSnapshot() {
  const { userId, orgId } = useAppAuth();
  const scope = financeScope(orgId, userId);
  const { data, loading, refreshing, failed } = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, scope);
  const snapshot = data?.ok ? data : null;
  const error = failed ? "The financial overview could not be loaded." : null;

  return { snapshot, loading, refreshing, error };
}
