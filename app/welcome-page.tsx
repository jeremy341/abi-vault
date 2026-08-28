import Link from "next/link";
import { Show } from "@clerk/nextjs";
import AbiLogo from "@/components/AbiLogo";

export default function StartPage() {
  return (
    <main className="soft-grid flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Header: the logo links back to the welcome screen. */}
      <header className="px-6 py-8 sm:px-8 sm:py-10">
        <AbiLogo />
      </header>

      {/* Main content: this is the centered welcome area. */}
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl">
          <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
            Klassenfinanzen, klar im Blick.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Einnahmen, Ausgaben, Belege und Spendenziele an einem Ort.
          </p>

          <div className="mt-9 flex justify-center gap-3">
            <Show when="signed-out">
              <Link href="/sign-in" className="action-link">
                Anmelden
              </Link>
              <Link href="/sign-up" className="action-link">
                Registrieren
              </Link>
            </Show>

            <Show when="signed-in">
              <Link href="/dashboard" className="action-link">
                Übersicht
              </Link>
            </Show>
          </div>
        </div>
      </section>
    </main>
  );
}
