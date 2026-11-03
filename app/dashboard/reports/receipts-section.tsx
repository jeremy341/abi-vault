import { LoadingText } from "@/components/ui/loading-state";
import ledger from "../ledger.module.css";
import { Kpis } from "./report-helpers";

export function ReceiptsSection({ loading, kpis }: { loading: boolean; kpis: Kpis }) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Receipts</h2>
      </header>
      <dl className={ledger.definitions}>
        <div>
          <dt>Approved</dt>
          <dd><LoadingText loading={loading}>{kpis.reviewed}</LoadingText></dd>
        </div>
        <div>
          <dt>Pending review</dt>
          <dd><LoadingText loading={loading}>{kpis.review}</LoadingText></dd>
        </div>
        <div>
          <dt>Unassigned</dt>
          <dd><LoadingText loading={loading}>{kpis.unassigned}</LoadingText></dd>
        </div>
        <div>
          <dt>Cash counts matching</dt>
          <dd><LoadingText loading={loading}>{kpis.reconciliation}</LoadingText></dd>
        </div>
      </dl>
    </section>
  );
}
