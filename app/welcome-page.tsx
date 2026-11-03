import Link from "next/link";
import AbiLogo from "@/components/AbiLogo";
import { isLocalMode } from "@/lib/auth/local";
import styles from "./welcome-page.module.css";

export default function StartPage() {
  const localMode = isLocalMode();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <AbiLogo size="large" />
        <a
          className={styles.codeLink}
          href="https://github.com/jeremy341/abi-vault"
          target="_blank"
          rel="noreferrer"
        >
          read the code
        </a>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>for the graduating class</p>
        <h1>
          <span>class finances,</span> <span>kept in one notebook.</span>
        </h1>
        <div className={styles.actions}>
          <Link href={localMode ? "/dashboard" : "/sign-in"} className={styles.button}>
            {localMode ? "open the demo" : "sign in"}
          </Link>
        </div>
      </section>
    </main>
  );
}
