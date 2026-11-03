"use client";

import Link from "next/link";
import { ArrowRight, FileText, Plus, ReceiptText } from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import { InlineLoading, LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import type { DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import DashboardEmpty from "./DashboardEmpty";
import {
  displayDashboardCategories,
  displayDashboardGoals,
  displayDashboardReviews,
  displayDashboardTransactions,
  displayMinor,
  formatLastTransaction,
  primaryCashWallet,
} from "./dashboard-model";
import styles from "@/app/dashboard/dashboard-adaptive.module.css";

function TabletDashboard({
  snapshot,
  loading,
  error,
}: {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
}) {
  const transactionItems = displayDashboardTransactions(snapshot);
  const goalItems = displayDashboardGoals(snapshot);
  const categoryItems = displayDashboardCategories(snapshot);
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallet = primaryCashWallet(snapshot);
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;

  const lastTransaction = formatLastTransaction(
    snapshot?.transactions[0]?.date,
  );

  const incomeTotal = snapshot
    ? snapshot.transactions
        .filter((item) => Number(item.amountMinor) >= 0)
        .reduce((sum, item) => sum + Number(item.amountMinor), 0)
    : 0;

  const expenseTotal = snapshot
    ? snapshot.transactions
        .filter((item) => Number(item.amountMinor) < 0)
        .reduce((sum, item) => sum + Math.abs(Number(item.amountMinor)), 0)
    : 0;

  return (
    <section className={styles.tabletPage} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Financial overview is loading…" />
      {error ? (
        <p
          className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div
        className={styles.tabletMetricStrip}
        aria-label="Financial metrics"
        data-ui-slot="summary"
      >
        <div className={styles.tabletMetric}>
          <span>cash balance</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(cashBalance))}
            </LoadingText>
          </strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Income</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(incomeTotal))}
            </LoadingText>
          </strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Expenses</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(expenseTotal))}
            </LoadingText>
          </strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Pending review</span>
          <strong>
            <LoadingText loading={loading}>
              {reviewItems.length} items
            </LoadingText>
          </strong>
        </div>
      </div>

      <div className={styles.tabletWorkspace} data-ui-slot="content">
        <div className={styles.tabletPrimary}>
          <article className={styles.tabletAccount}>
            <div className={styles.tabletCardSlot}>
              {cashWallet ? (
                <AccountCard
                  details={{
                    accountName: cashWallet.name,
                    cardNumber: cashWallet.cardNumberVisual ?? undefined,
                    holder: cashWallet.cardHolderVisual ?? undefined,
                    expiry: cashWallet.cardExpiryVisual ?? undefined,
                  }}
                  cardColor={cashWallet.cardColorVisual ?? undefined}
                />
              ) : loading ? (
                <InlineLoading label="Cash register is loading…" />
              ) : error ? null : (
                <Link href="/dashboard/funds" aria-label="Create cash register">
                  <AccountCard variant="add" />
                </Link>
              )}
            </div>
            <div className={styles.tabletBalance}>
              <span>
                {loading
                  ? "Cash register is loading…"
                  : (cashWallet?.name ?? "No cash register created")}
              </span>
              <strong>
                <LoadingText loading={loading}>
                  {displayMinor(String(cashBalance))}
                </LoadingText>
              </strong>
              <Link
                className={styles.tabletActivity}
                href="/dashboard/transactions"
              >
                {loading ? (
                  "Cash register data is loading…"
                ) : (
                  <>
                    Latest transaction:{" "}
                    <LoadingText loading={loading}>
                      {lastTransaction}
                    </LoadingText>
                  </>
                )}
              </Link>
              <div className={styles.tabletActions}>
                <Link
                  href="/dashboard/transactions"
                  className={styles.tabletAction}
                >
                  <Plus aria-hidden="true" /> Transaction
                </Link>
                <Link
                  href="/dashboard/receipts"
                  className={styles.tabletAction}
                >
                  <ReceiptText aria-hidden="true" /> Receipt
                </Link>
              </div>
            </div>
          </article>

          <article className={styles.tabletTransactions}>
            <header className={styles.tabletPanelHeader}>
              <h2>Latest transactions</h2>
              <Link href="/dashboard/transactions">
                View all <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div
              className={styles.tabletTransactionList}
              data-ui-slot="list-body"
            >
              {!loading && transactionItems.length === 0 ? (
                <DashboardEmpty
                  title="No transactions yet"
                  description="Record a transaction to see activity here."
                  href="/dashboard/transactions"
                  action="Open transactions"
                />
              ) : (
                <LoadingCollection
                  loading={loading}
                  knownItemCount={transactionItems.length}
                  emptyHeight="100%"
                  label="Transactions are loading…"
                >
                  {transactionItems.slice(0, 6).map((item) => (
                    <div className={styles.tabletTransaction} key={item.title}>
                      <span>{item.title}</span>
                      <small>{item.category}</small>
                      <b
                        className={
                          item.amount.startsWith("+")
                            ? styles.positive
                            : styles.negative
                        }
                      >
                        {item.amount}
                      </b>
                    </div>
                  ))}
                </LoadingCollection>
              )}
            </div>
          </article>
        </div>

        <aside
          className={styles.tabletSecondary}
          data-ui-slot="secondary-panel"
        >
          <article className={styles.tabletGoals}>
            <header className={styles.tabletSectionHeader}>
              <h2>Goals</h2>
              <Link href="/dashboard/goals">
                Open <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div className={styles.tabletGoalList}>
              {goalItems.length === 0 ? (
                <DashboardEmpty
                  title="No savings goals yet"
                  description="Create a goal to track shared plans."
                  href="/dashboard/goals"
                  action="Open goals"
                />
              ) : (
                goalItems.map((goal) => (
                  <div className={styles.tabletGoal} key={goal.title}>
                    <strong>{goal.title}</strong>
                    <span>{goal.progress}%</span>
                    <div className={styles.tabletGoalTrack} aria-hidden="true">
                      <i style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className={styles.tabletSpending}>
            <header className={styles.tabletSectionHeader}>
              <h2>Expenses</h2>
              <span className={styles.sectionMeta}>By category</span>
            </header>
            <div className={styles.tabletSpendingList}>
              {categoryItems.length === 0 ? (
                <DashboardEmpty
                  title="No expenses recorded"
                  description="Recorded spending will appear by category."
                  href="/dashboard/transactions"
                  action="Open transactions"
                />
              ) : (
                categoryItems.map((item) => (
                  <div className={styles.tabletSpendingRow} key={item.title}>
                    <strong>{item.title}</strong>
                    <div
                      className={styles.tabletSpendingTrack}
                      aria-hidden="true"
                    >
                      <i style={{ width: `${item.progress}%` }} />
                    </div>
                    <span>{item.progress}%</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className={styles.tabletAttention}>
            <header className={styles.tabletSectionHeader}>
              <h2>Needs attention</h2>
              <span className={styles.sectionMeta}>
                {reviewItems.length} pending
              </span>
            </header>
            <div className={styles.tabletAttentionList}>
              {reviewItems.length === 0 ? (
                <DashboardEmpty
                  title="No items need review"
                  description="Review tasks will appear here when needed."
                  href="/dashboard/receipts"
                  action="Open receipts"
                />
              ) : (
                reviewItems.map((item) => (
                  <Link
                    href={item.href}
                    className={styles.tabletAttentionRow}
                    key={item.title}
                  >
                    <FileText aria-hidden="true" />
                    <span>
                      <strong>{item.title}</strong>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}


export default TabletDashboard;
