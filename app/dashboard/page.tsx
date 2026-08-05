import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-8 text-ink sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-muted">Abi Manager</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-muted">
          Dein Finanzüberblick kommt als Nächstes.
        </p>
      </div>
    </main>
  );
}
