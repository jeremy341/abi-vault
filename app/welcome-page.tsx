import Link from "next/link";
import AbiLogo from "@/components/AbiLogo";
import { isLocalMode } from "@/lib/auth/local";
import styles from "./welcome-page.module.css";

export default function StartPage() {
  const localMode = isLocalMode();
  return (
    <main className={`${styles.page} soft-grid flex min-h-[100dvh] flex-col overflow-hidden`}>
      {/* Keep the brand anchored in the same top-left position as the app shell. */}
      <header className={`${styles.header} px-6 py-6 sm:px-8 sm:py-8`}>
        <AbiLogo />
      </header>

      {/* Main content: this is the centered welcome area. */}
      <section className={`${styles.hero} flex min-h-[75vh] items-center justify-center px-6 py-20 text-center`}>
        <div className="max-w-2xl">
          <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
            Class finances, clearly organized.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Income, expenses, receipts, and savings goals in one place.
          </p>

          <div className={styles.actions}>
            {localMode ? <Link href="/dashboard" className="action-link">Overview</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
