import { currency, Goal, Snapshot } from "./report-helpers";
import ledger from "../ledger.module.css";
import styles from "./reports.module.css";

function goalProgress(goal: Goal) {
  if (!goal.target) {
    return 0;
  }

  return Math.min(100, Math.round((goal.saved / goal.target) * 100));
}

export function GoalsSection({ goals }: { goals: Snapshot["goals"] }) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Goals</h2>
      </header>
      {goals.length ? (
        <ul className={ledger.list}>
          {goals.map((goal) => {
            const progress = goalProgress(goal);

            return (
              <li key={goal.name} className={styles.category}>
                <span>{goal.name}</span>
                <span className={ledger.line} role="presentation"><i style={{ width: `${progress}%` }} /></span>
                <span className={styles.figure}>{currency.format(goal.saved)} of {currency.format(goal.target)}</span>
                <span className={`${styles.figure} ${ledger.muted}`}>{progress}%</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={ledger.empty}>No goals yet.</p>
      )}
    </section>
  );
}
