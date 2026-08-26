"use client";

import { useEffect, useState } from "react";
import { getReportSnapshot } from "@/features/finance/actions/queries";
import { cachedFinanceQuery } from "@/lib/finance/client-cache";

export function useReportSnapshot() {
  const [snapshot, setSnapshot] = useState<Extract<Awaited<ReturnType<typeof getReportSnapshot>>, { ok: true }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    cachedFinanceQuery("report-snapshot", getReportSnapshot).then((result) => {
      if (!active) return;
      if (result.ok) {
        setSnapshot(result);
      } else {
        setError("Die Berichte konnten nicht geladen werden.");
      }
    }).catch(() => {
      if (active) setError("Die Berichte konnten nicht geladen werden.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return { snapshot, loading, error };
}
