"use client";

import Link from "next/link";
import { LoadError } from "@/components/ui/load-error";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { useDashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import {
  cashRegisters,
  displayDashboardReviews,
  formatMoney,
  goalRows,
  transactionRows,
} from "./dashboard-model";
import styles from "./overview.module.css";

const RECENT_LIMIT = 5;
const GOAL_LIMIT = 3;

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
  const goals = goalRows(snapshot).slice(0, GOAL_LIMIT);
  const reviews = displayDashboardReviews(snapshot);
  const showAttention = !loading && reviews.length > 0;
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
          <strong className={styles.figure}>
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

      <div className={showAttention ? styles.columns : styles.columnsSingle}>
        <section className={styles.main}>
          <Section title="Latest entries" href="/dashboard/transactions" action="All transactions" />
          {!loading && transactions.length === 0 ? (
            <EmptyLink text="No transactions yet." href="/dashboard/transactions" action="Add one" />
          ) : (
            <LoadingCollection loading={loading} knownItemCount={transactions.length} emptyHeight="10rem" label="Loading transactions">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Description</th>
                    <th scope="col" className={styles.hideOnPhone}>Date</th>
                    <th scope="col" className={styles.amount}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        {transaction.title}
                        <span className={styles.phoneMeta}>{transaction.date}</span>
                      </td>
                      <td className={`${styles.muted} ${styles.hideOnPhone}`}>{transaction.date}</td>
                      <td className={styles.amount}>{transaction.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LoadingCollection>
          )}
        </section>

        {showAttention ? (
          <section className={styles.attention} aria-labelledby="overview-attention">
            <h2 id="overview-attention" className={`annotation ${styles.attentionTitle}`}>needs attention</h2>
            <ul className={styles.attentionList}>
              {reviews.map((review) => (
                <li key={review.title}>
                  <Link href={review.href}>
                    <span>{review.title}</span>
                    <small>{review.detail}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section className={styles.goalsRow}>
        <Section title="Goals" href="/dashboard/goals" action="All goals" />
        {!loading && goals.length === 0 ? (
          <EmptyLink text="No goals yet." href="/dashboard/goals" action="Create a goal" />
        ) : (
          <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="6rem" label="Loading goals">
            <ul className={styles.goalGrid}>
              {goals.map((goal) => (
                <li key={goal.id} className={styles.goalCard}>
                  <div>
                    <span>{goal.title}</span>
                    <b>{goal.progress}%</b>
                  </div>
                  <div className={styles.line} role="presentation">
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                  <small>{goal.detail}</small>
                </li>
              ))}
            </ul>
          </LoadingCollection>
        )}
      </section>
    </section>
  );
}
