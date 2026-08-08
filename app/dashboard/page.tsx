import Klassenkasse from "@/components/dashboard/Klassenkasse";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <section className={styles.page}>
      <div className={styles.grid}>
        <div className={`${styles.column} ${styles.leftColumn}`}>
          <Klassenkasse />

          <div
            className={styles.placeholder}
            aria-label="Transaktionsverlauf wird später ergänzt"
          />
        </div>

        <div className={`${styles.column} ${styles.rightColumn}`}>
          <div
            className={styles.placeholder}
            aria-label="Ziele werden später ergänzt"
          />

          <div
            className={styles.placeholder}
            aria-label="Ausgaben nach Kategorie werden später ergänzt"
          />

          <div
            className={styles.placeholder}
            aria-label="Prüfhinweise werden später ergänzt"
          />
        </div>
      </div>
    </section>
  );
}
