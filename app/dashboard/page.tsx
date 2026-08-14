import Klassenkasse from "@/components/dashboard/Klassenkasse";
import { GoalsPanel, ReviewPanel, SpendingByCategory, TransactionHistory } from "@/components/dashboard/DashboardPanels";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <section className={styles.page}>
      <div className={styles.mobileIntro}>
        <h1>Finanzübersicht</h1>
        <p>Klassenfinanzen auf einen Blick.</p>
      </div>
      <div className={styles.grid}>
        <div className={`${styles.column} ${styles.leftColumn}`}>
          <Klassenkasse />

          <TransactionHistory />
        </div>

        <div className={`${styles.column} ${styles.rightColumn}`}>
          <GoalsPanel />

          <SpendingByCategory />

          <ReviewPanel />
        </div>
      </div>
    </section>
  );
}
