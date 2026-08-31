import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions-server";

export default async function PeriodsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requirePermission("lockPeriods");
  } catch {
    redirect("/dashboard");
  }
  return children;
}
