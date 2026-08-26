"use client";

import { useEffect, useState } from "react";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>> & { ok: true };

export function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getDashboardSnapshot().then((result) => {
      if (active && result.ok) setSnapshot(result);
    }).catch(() => undefined).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return { snapshot, loading };
}
