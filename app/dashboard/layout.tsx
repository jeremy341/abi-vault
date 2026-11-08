import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ResponsiveDashboardShell from "@/components/presentation/ResponsiveDashboardShell";
import { FinanceCacheLifecycle } from "@/components/finance-cache-lifecycle";
import { syncCurrentOrganization } from "@/lib/auth/bootstrap";
import { isLocalMode } from "@/lib/auth/local";
import { getLocalSession } from "@/lib/auth/local-class-context";
import { LocalAuthProvider } from "@/components/auth/app-auth";
import { listLocalClasses } from "@/features/classes/actions/classes";
import { listLocalPeople } from "@/features/classes/actions/local-users";
import { isDemoData } from "@/lib/demo/mode";
import { currentDemoClassId, getDemoClasses } from "@/lib/demo/classes";

async function demoClassSwitch() {
  if (!isDemoData()) return undefined;

  return { classes: await getDemoClasses(), activeId: await currentDemoClassId() };
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isLocalMode() && isDemoData()) {
    return (
      <ResponsiveDashboardShell isAdmin localMode demoClasses={await demoClassSwitch()}>
        <FinanceCacheLifecycle />
        {children}
      </ResponsiveDashboardShell>
    );
  }

  if (isLocalMode()) {
    // Supabase-backed local demo: the acting person and role come from the database.
    const session = await getLocalSession();
    const isAdmin = session.role === "admin";
    const [classes, people] = await Promise.all([listLocalClasses(), listLocalPeople()]);
    return (
      <LocalAuthProvider
        session={{
          userId: session.userId,
          organizationId: session.organizationId,
          orgRole: isAdmin ? "org:admin" : "org:member",
        }}
      >
        <ResponsiveDashboardShell
          isAdmin={isAdmin}
          localMode
          localClasses={{ classes, activeId: session.organizationId }}
          localPeople={people.ok ? people : undefined}
        >
          <FinanceCacheLifecycle />
          {children}
        </ResponsiveDashboardShell>
      </LocalAuthProvider>
    );
  }

  const { isAuthenticated, orgId, orgRole } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  if (orgId) await syncCurrentOrganization();

  return (
    <ResponsiveDashboardShell isAdmin={orgRole === "org:admin"} demoClasses={await demoClassSwitch()}>
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
