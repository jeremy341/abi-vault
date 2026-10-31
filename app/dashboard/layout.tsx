import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ResponsiveDashboardShell from "@/components/presentation/ResponsiveDashboardShell";
import { FinanceCacheLifecycle } from "@/components/finance-cache-lifecycle";
import { syncCurrentOrganization } from "@/lib/auth/bootstrap";
import { isLocalMode } from "@/lib/auth/local";
import { isDemoData } from "@/lib/demo/mode";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isLocalMode()) {
    return (
      <ResponsiveDashboardShell isAdmin localMode demoMode={isDemoData()}>
        <FinanceCacheLifecycle />
        {children}
      </ResponsiveDashboardShell>
    );
  }

  const { isAuthenticated, orgId, orgRole } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  if (orgId) await syncCurrentOrganization();

  return (
    <ResponsiveDashboardShell isAdmin={orgRole === "org:admin"} demoMode={isDemoData()}>
      <FinanceCacheLifecycle />
      {orgId ? children : (
        <main className="flex min-h-full items-center justify-center p-6">
          <section className="w-full max-w-lg border-t border-[var(--ink)] pt-4">
            <h1 className="text-lg font-semibold">No workspace selected</h1>
            <p className="mt-2 text-sm text-muted-foreground">Join the Abi workspace through an invitation link or choose an active workspace.</p>
          </section>
        </main>
      )}
    </ResponsiveDashboardShell>
  );
}
