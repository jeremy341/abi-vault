"use client";

import { useAppAuth } from "@/components/auth/app-auth";
import { getReportSnapshot } from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { financeScope } from "@/lib/finance/client-cache";

export function useReportSnapshot() {
  const { userId, orgId } = useAppAuth();
  const scope = financeScope(orgId, userId);
  const { data, loading, refreshing, failed } = useFinanceQuery("report-snapshot", getReportSnapshot, scope);
  const snapshot = data?.ok ? data : null;
  const error = failed ? "Reports could not be loaded." : null;

  return { snapshot, loading, refreshing, error };
}
