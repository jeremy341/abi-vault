"use client";

import { useEffect, useState } from "react";
import { getReportSnapshot } from "@/features/finance/actions/queries";

export function useReportSnapshot() {
  const [snapshot, setSnapshot] = useState<Extract<Awaited<ReturnType<typeof getReportSnapshot>>, { ok: true }> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getReportSnapshot().then((result) => {
      if (active && result.ok) setSnapshot(result);
    }).catch(() => undefined).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return { snapshot, loading };
}
