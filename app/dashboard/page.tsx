import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return (
      <section className="p-8">
        <p className="text-sm text-muted">Abi 2026</p>

        <h1 className="mt-2 text-3xl font-semibold">
          Übersicht
        </h1>
      </section>
  );
}
