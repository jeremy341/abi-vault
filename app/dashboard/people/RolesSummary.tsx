import ledger from "../ledger.module.css";
import styles from "./people.module.css";
import type { RoleCounts } from "./people-types";

type RolesSummaryProps = {
  counts: RoleCounts;
};

export function RolesSummary({ counts }: RolesSummaryProps) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Roles</h2>
      </header>
      <dl className={`${ledger.definitions} ${styles.roles}`}>
        <div>
          <dt>Administrator ({counts.administrators})</dt>
          <dd>Full access to everything</dd>
        </div>
        <div>
          <dt>Supervisor ({counts.supervisors})</dt>
          <dd>Manages finances and reviews receipts</dd>
        </div>
        <div>
          <dt>Member ({counts.members})</dt>
          <dd>Read-only view of totals and goals</dd>
        </div>
      </dl>
    </section>
  );
}
