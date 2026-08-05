import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function StartPage() {
  return (
    <main className="min-h-[100dvh] bg-canvas text-ink">
      {/* Header: the logo links back to the welcome screen. */}
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Abi Manager Startseite"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
            A
          </span>

          <span className="text-sm font-semibold tracking-tight">
            Abi Manager
          </span>
        </Link>
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
                Login
              </Link>
              <Link href="/sign-up" className="action-link">
                SignUp
              </Link>
            </Show>

            <Show when="signed-in">
              <Link href="/dashboard" className="action-link">
                Dashboard
              </Link>
            </Show>
          </div>

        </div>
      </section>
    </main>
  );
}
