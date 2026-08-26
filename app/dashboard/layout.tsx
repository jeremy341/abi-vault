import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ResponsiveDashboardShell from "@/components/presentation/ResponsiveDashboardShell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, orgId } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return (
    <ResponsiveDashboardShell>
      {orgId ? children : (
        <main className="flex min-h-full items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-card">
            <h1 className="text-lg font-semibold tracking-tight">Kein Arbeitsbereich ausgewählt</h1>
            <p className="mt-2 text-sm text-muted-foreground">Bitte tritt dem Abi-Arbeitsbereich über einen Einladungslink bei oder wähle einen aktiven Arbeitsbereich aus.</p>
          </section>
        </main>
      )}
    </ResponsiveDashboardShell>
  );
}
