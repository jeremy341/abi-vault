"use client";

import Link from "next/link";
import { LoadError } from "@/components/ui/load-error";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { useDashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import {
  cashRegisters,
  categoryRows,
  displayDashboardReviews,
  formatMoney,
  goalRows,
  transactionRows,
} from "./dashboard-model";
import styles from "./overview.module.css";

const RECENT_LIMIT = 8;

function EmptyLink({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <p className={styles.empty}>
      {text} <Link href={href}>{action}</Link>
    </p>
  );
}

function Section({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <header className={styles.sectionHeader}>
      <h2>{title}</h2>
      {href && action ? <Link href={href}>{action}</Link> : null}
    </header>
  );
}

export default function Overview() {
  const { snapshot, loading, error } = useDashboardSnapshot();
  const registers = cashRegisters(snapshot);
  const transactions = transactionRows(snapshot).slice(0, RECENT_LIMIT);
  const goals = goalRows(snapshot);
  const categories = categoryRows(snapshot);
  const reviews = displayDashboardReviews(snapshot);
  let balance = 0;

  for (const wallet of registers) {
    balance += Number(wallet.balanceMinor);
  }

  let income = 0;
  let expenses = 0;

  for (const transaction of snapshot?.transactions ?? []) {
    const amount = Number(transaction.amountMinor);

    if (amount >= 0) {
      income += amount;
    } else {
      expenses += Math.abs(amount);
    }
  }

  return (
    <section className={styles.page} aria-label="Financial overview" aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading overview" />

      {error ? <LoadError message={error} /> : null}

      <div className={styles.summary}>
        <div className={styles.balance}>
          <span className={styles.label}>Balance</span>
          <strong className={`${styles.figure} total-rule`}>
            <LoadingText loading={loading}>{formatMoney(String(balance))}</LoadingText>
          </strong>
        </div>
        <dl className={styles.figures}>
          <div>
            <dt>Income</dt>
            <dd><LoadingText loading={loading}>{formatMoney(String(income))}</LoadingText></dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd><LoadingText loading={loading}>{formatMoney(String(expenses))}</LoadingText></dd>
          </div>
          <div>
            <dt>Needs review</dt>
            <dd><LoadingText loading={loading}>{reviews.length}</LoadingText></dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Link href="/dashboard/transactions" className={styles.primary}>
            Add transaction
          </Link>
          <Link href="/dashboard/receipts" className={styles.secondary}>
            Upload receipt
          </Link>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section>
            <Section title="Recent transactions" href="/dashboard/transactions" action="All transactions" />
            {!loading && transactions.length === 0 ? (
              <EmptyLink text="No transactions yet." href="/dashboard/transactions" action="Add one" />
            ) : (
              <LoadingCollection loading={loading} knownItemCount={transactions.length} emptyHeight="12rem" label="Loading transactions">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Description</th>
                      <th scope="col" className={styles.hideOnPhone}>Category</th>
                      <th scope="col" className={styles.hideOnPhone}>Date</th>
                      <th scope="col" className={styles.amount}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {transaction.title}
                          <span className={styles.phoneMeta}>{transaction.category}, {transaction.date}</span>
                        </td>
                        <td className={`${styles.muted} ${styles.hideOnPhone}`}>{transaction.category}</td>
                        <td className={`${styles.muted} ${styles.hideOnPhone}`}>{transaction.date}</td>
                        <td className={styles.amount}>{transaction.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LoadingCollection>
            )}
          </section>

          <section>
            <Section title="Cash registers" href="/dashboard/funds" action="Open" />
            {!loading && registers.length === 0 ? (
              <EmptyLink text="No cash register yet." href="/dashboard/funds" action="Add one" />
            ) : (
              <LoadingCollection loading={loading} knownItemCount={registers.length} emptyHeight="5rem" label="Loading cash registers">
                <table className={styles.table}>
                  <tbody>
                    {registers.map((wallet) => (
                      <tr key={wallet.id}>
                        <td>{wallet.name}</td>
                        <td className={styles.amount}>{formatMoney(wallet.balanceMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LoadingCollection>
            )}
          </section>
        </div>

        <aside className={styles.side}>
          <section>
            <Section title="Needs attention" href="/dashboard/receipts" action="Receipts" />
            {!loading && reviews.length === 0 ? (
              <p className={styles.empty}>Nothing needs review.</p>
            ) : (
              <LoadingCollection loading={loading} knownItemCount={reviews.length} emptyHeight="5rem" label="Loading reviews">
                <ul className={styles.list}>
                  {reviews.map((review) => (
                    <li key={review.title}>
                      <Link href={review.href}>
                        <span>{review.title}</span>
                        <small>{review.detail}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </LoadingCollection>
            )}
          </section>

          <section>
            <Section title="Goals" href="/dashboard/goals" action="All goals" />
            {!loading && goals.length === 0 ? (
              <EmptyLink text="No goals yet." href="/dashboard/goals" action="Create a goal" />
            ) : (
              <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="6rem" label="Loading goals">
                <ul className={styles.list}>
                  {goals.map((goal) => (
                    <li key={goal.id} className={styles.goal}>
                      <div>
                        <span>{goal.title}</span>
                        <b>{goal.progress}%</b>
                      </div>
                      <div className={styles.line} role="presentation">
                        <i style={{ width: `${goal.progress}%` }} />
                      </div>
                      <small>{goal.detail}, by {goal.deadline}</small>
                    </li>
                  ))}
                </ul>
              </LoadingCollection>
            )}
          </section>

          <section>
            <Section title="Expenses by category" />
            {!loading && categories.length === 0 ? (
              <p className={styles.empty}>No expenses recorded.</p>
            ) : (
              <LoadingCollection loading={loading} knownItemCount={categories.length} emptyHeight="5rem" label="Loading expenses">
                <ul className={styles.list}>
                  {categories.map((category) => (
                    <li key={category.title} className={styles.goal}>
                      <div>
                        <span>{category.title}</span>
                        <b>{category.amount}</b>
                      </div>
                      <div className={styles.line} role="presentation">
                        <i style={{ width: `${category.progress}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </LoadingCollection>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
