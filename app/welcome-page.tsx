import Link from "next/link";
import AbiLogo from "@/components/AbiLogo";
import { isLocalMode } from "@/lib/auth/local";
import styles from "./welcome-page.module.css";

export default function StartPage() {
  const localMode = isLocalMode();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <AbiLogo />
      </header>

      <section className={styles.hero}>
        <h1>Class finances in one record.</h1>
        <p>Income, expenses, receipts and goals for your graduation class.</p>
        <div className={styles.actions}>
          <Link href={localMode ? "/dashboard" : "/sign-in"} className={styles.button}>
            {localMode ? "Open demo" : "Sign in"}
          </Link>
        </div>
      </section>
    </main>
  );
}
