import { LoadingText } from "@/components/ui/loading-state";
import ledger from "../ledger.module.css";
import styles from "./reports.module.css";
import { Kpis } from "./report-helpers";

export function ReceiptsSection({ loading, kpis }: { loading: boolean; kpis: Kpis }) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Receipts and counts</h2>
      </header>
      <dl className={`${ledger.definitions} ${styles.counts}`}>
        <div>
          <dt>Approved receipts</dt>
          <dd><LoadingText loading={loading}>{kpis.reviewed}</LoadingText></dd>
        </div>
        <div>
          <dt>Waiting for review</dt>
          <dd><LoadingText loading={loading}>{kpis.review}</LoadingText></dd>
        </div>
        <div>
          <dt>Without a transaction</dt>
          <dd><LoadingText loading={loading}>{kpis.unassigned}</LoadingText></dd>
        </div>
        <div>
          <dt>Cash counts that matched</dt>
          <dd><LoadingText loading={loading}>{kpis.reconciliation}</LoadingText></dd>
        </div>
      </dl>
    </section>
  );
}
