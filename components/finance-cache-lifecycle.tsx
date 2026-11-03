"use client";

import { useEffect, useRef } from "react";
import { clearFinanceCache } from "@/lib/finance/client-cache";
import { useAppAuth } from "@/components/auth/app-auth";

export function FinanceCacheLifecycle() {
  const { userId, orgId, isLoaded } = useAppAuth();
  const previousScope = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    const scope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
    if (previousScope.current && previousScope.current !== scope) clearFinanceCache();
    previousScope.current = scope;
  }, [isLoaded, orgId, userId]);
  return null;
}
