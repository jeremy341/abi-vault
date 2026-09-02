import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ResponsiveDashboardShell from "@/components/presentation/ResponsiveDashboardShell";
import { FinanceCacheLifecycle } from "@/components/finance-cache-lifecycle";
import { ensureCurrentOrganizationData } from "@/lib/auth/bootstrap";
import { isLocalMode } from "@/lib/auth/local";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isLocalMode()) {
    return (
      <ResponsiveDashboardShell isAdmin localMode>
        <FinanceCacheLifecycle />
        {children}
      </ResponsiveDashboardShell>
    );
  }

  const { isAuthenticated, orgId, orgRole } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }
  if (orgId) await ensureCurrentOrganizationData();

  return (
    <ResponsiveDashboardShell isAdmin={orgRole === "org:admin"}>
      <FinanceCacheLifecycle />
      {orgId ? children : (
        <main className="flex min-h-full items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-card">
            <h1 className="text-lg font-semibold tracking-tight">No workspace selected</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please tritt dem Abi-Workspace über einen Einladungslink bei oder wähle einen aktiven Workspace aus.</p>
          </section>
        </main>
      )}
    </ResponsiveDashboardShell>
  );
}
