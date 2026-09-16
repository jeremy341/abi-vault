"use client";

import Link from "next/link";
import { ArrowRight, FileText, Plus, ReceiptText, Target } from "lucide-react";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import type { DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import DashboardEmpty from "./DashboardEmpty";
import {
  displayDashboardGoals,
  displayDashboardReviews,
  displayDashboardTransactions,
  displayMinor,
  formatLastTransaction,
  primaryCashWallet,
} from "./dashboard-model";
import styles from "@/app/dashboard/dashboard-adaptive.module.css";

function PhoneDashboard({
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
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallet = primaryCashWallet(snapshot);
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;
  const cashHasCount = Boolean(cashWallet?.lastCountAt);
  const cashCountMatches =
    cashHasCount &&
    Math.abs(Number(cashWallet?.lastCountDifferenceMinor ?? 0)) < 0.01;
  const lastTransaction = formatLastTransaction(
    snapshot?.transactions[0]?.date,
  );
  return (
    <section className={styles.phonePage} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Financial overview is loading…" />
      {error ? (
        <p
          className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className={styles.phoneBalanceHero} data-ui-slot="summary">
        <span className={styles.phoneEyebrow}>Total available</span>
        <strong>
          <LoadingText loading={loading}>
            {displayMinor(String(cashBalance))}
          </LoadingText>
        </strong>
        <div className={styles.phoneBalanceMeta}>
          <span>
            {loading
              ? "Cash register is loading…"
              : (cashWallet?.name ?? "No cash register created")}
          </span>
          {cashWallet ? (
            <b>
              {!cashHasCount
                ? "Not reviewed yet"
                : cashCountMatches
                  ? "Reconciliation matches"
                  : "Review discrepancy"}
            </b>
          ) : null}
        </div>
      </div>

      <nav
        className={styles.phoneQuickActions}
        aria-label="Quick actions"
        data-ui-slot="toolbar"
      >
        <Link
          href="/dashboard/transactions"
          className={styles.phoneQuickAction}
        >
          <Plus aria-hidden="true" /> Transaction
        </Link>
        <Link href="/dashboard/receipts" className={styles.phoneQuickAction}>
          <ReceiptText aria-hidden="true" /> Receipt
        </Link>
        <Link href="/dashboard/goals" className={styles.phoneQuickAction}>
          <Target aria-hidden="true" /> Goal
        </Link>
      </nav>

      <div className={styles.phoneAccountStrip}>
        <div>
          <Link href="/dashboard/funds">
            <strong>
              {loading
                ? "Cash register is loading…"
                : (cashWallet?.name ?? "No cash register created")}
            </strong>
          </Link>
          <Link href="/dashboard/transactions">
            <span>
              {loading
                ? "Cash register data is loading…"
                : `Latest transaction: ${lastTransaction}`}
            </span>
          </Link>
        </div>
        <b>
          <LoadingText loading={loading}>
            {displayMinor(String(cashBalance))}
          </LoadingText>
        </b>
      </div>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Latest transactions</h2>
          <Link href="/dashboard/transactions">
            All <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneTransactionList} data-ui-slot="list-body">
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
              emptyHeight="4rem"
              label="Transactions are loading…"
            >
              {transactionItems.slice(0, 4).map((item) => (
                <div className={styles.phoneTransaction} key={item.title}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.category}, {item.date}
                    </small>
                  </span>
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
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Savings goals</h2>
          <Link href="/dashboard/goals">
            Manage <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneGoalScroller}>
          {!loading && goalItems.length === 0 ? (
            <DashboardEmpty
              title="No savings goals yet"
              description="Create a goal to track shared plans."
              href="/dashboard/goals"
              action="Open goals"
            />
          ) : (
            <LoadingCollection
              loading={loading}
              knownItemCount={goalItems.length}
              emptyHeight="5rem"
              label="Goals are loading…"
            >
              {goalItems.map((goal) => (
                <article className={styles.phoneGoal} key={goal.title}>
                  <header>
                    <strong>{goal.title}</strong>
                    <span>{goal.progress}%</span>
                  </header>
                  <strong>{goal.target}</strong>
                  <p>{goal.saved}</p>
                  <div className={styles.phoneGoalTrack} aria-hidden="true">
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                </article>
              ))}
            </LoadingCollection>
          )}
        </div>
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Pending review</h2>
          <span className={styles.sectionMeta}>{reviewItems.length} items</span>
        </header>
        <div className={styles.phoneAttentionList}>
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
                className={styles.phoneAttentionRow}
                key={item.title}
              >
                <FileText aria-hidden="true" />
                <span>{item.title}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))
          )}
        </div>
      </section>
    </section>
  );
}


export default PhoneDashboard;

