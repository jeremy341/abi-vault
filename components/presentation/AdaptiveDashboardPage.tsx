"use client";

import { usePresentationMode } from "@/hooks/use-presentation-mode";
import DesktopDashboard from "./dashboard/DesktopDashboard";
import PhoneDashboard from "./dashboard/PhoneDashboard";
import TabletDashboard from "./dashboard/TabletDashboard";
import { useDashboardSnapshot } from "@/hooks/use-dashboard-snapshot";

export default function AdaptiveDashboardPage() {
  const mode = usePresentationMode();
  const { snapshot, loading, error } = useDashboardSnapshot();
  if (mode === "tablet")
    return (
      <TabletDashboard snapshot={snapshot} loading={loading} error={error} />
    );
  if (mode === "phone")
    return (
      <PhoneDashboard snapshot={snapshot} loading={loading} error={error} />
    );
  return (
    <DesktopDashboard snapshot={snapshot} loading={loading} error={error} />
  );
}
