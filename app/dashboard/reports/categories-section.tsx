import { currency, Snapshot } from "./report-helpers";
import ledger from "../ledger.module.css";
import styles from "./reports.module.css";

function sumOf(values: number[]) {
  let total = 0;

  for (const value of values) {
    total += value;
  }

  return total;
}

export function CategoriesSection({ categories }: { categories: Snapshot["categories"] }) {
  const categoryTotal = sumOf(categories.map((category) => category.amount));

  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Expenses by category</h2>
        <p>{categories.length ? currency.format(categoryTotal) : ""}</p>
      </header>
      {categories.length ? (
        <ul className={ledger.list}>
          {categories.map((category) => (
            <li key={category.name} className={styles.category}>
              <span>{category.name}</span>
              <span className={ledger.line} role="presentation"><i style={{ width: `${category.share}%` }} /></span>
              <span className={styles.figure}>{currency.format(category.amount)}</span>
              <span className={`${styles.figure} ${ledger.muted}`}>{category.share}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={ledger.empty}>No expenses for this period.</p>
      )}
    </section>
  );
}
