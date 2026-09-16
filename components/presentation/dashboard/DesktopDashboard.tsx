"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, FileText, Plus, X } from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import type { DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import { mapWalletToCashRegisterCard } from "@/lib/finance/cash-register-card";
import DashboardCashCarousel from "./DashboardCashCarousel";
import DashboardEmpty from "./DashboardEmpty";
import {
  displayDashboardCategories,
  displayDashboardGoals,
  displayDashboardReviews,
  displayDashboardTransactions,
  displayMinor,
  formatLastTransaction,
} from "./dashboard-model";
import desktopStyles from "@/app/dashboard/dashboard-desktop.module.css";

function DesktopDashboard({
  snapshot,
  loading,
  error,
}: {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
}) {
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [selectedCashWalletId, setSelectedCashWalletId] = useState<
    string | null
  >(null);
  const transactionItems = displayDashboardTransactions(snapshot);
  const goalItems = displayDashboardGoals(snapshot);
  const categoryItems = displayDashboardCategories(snapshot);
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallets =
    snapshot?.wallets.filter((wallet) => wallet.type === "cash") ?? [];
  const cashWallet =
    cashWallets.find((wallet) => wallet.id === selectedCashWalletId) ??
    cashWallets[0] ??
    null;
  const cashCard = cashWallet ? mapWalletToCashRegisterCard(cashWallet) : null;
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;
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
  const lastTransaction = formatLastTransaction(
    snapshot?.transactions[0]?.date,
  );

  return (
    <section
      className={desktopStyles.page}
      aria-label="Financial overview"
      aria-busy={loading}
    >
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
        className={desktopStyles.metrics}
        aria-label="Financial metrics"
        data-ui-slot="summary"
      >
        <div>
          <span>Total available</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(cashBalance))}
            </LoadingText>
          </strong>
          <small>
            {loading
              ? "Cash registers are loading…"
              : (cashWallet?.name ?? "No cash register created")}
          </small>
        </div>
        <div>
          <span>Income</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(incomeTotal))}
            </LoadingText>
          </strong>
          <small>
            {loading
              ? "Cash registers are loading…"
              : cashWallet
                ? `From ${cashWallet.name}`
                : "No data available"}
          </small>
        </div>
        <div>
          <span>Expenses</span>
          <strong>
            <LoadingText loading={loading}>
              {displayMinor(String(expenseTotal))}
            </LoadingText>
          </strong>
          <small>
            {loading
              ? "Cash registers are loading…"
              : cashWallet
                ? `From ${cashWallet.name}`
                : "No data available"}
          </small>
        </div>
        <div>
          <span>Open reviews</span>
          <strong>
            <LoadingText loading={loading}>
              {reviewItems.length} items
            </LoadingText>
          </strong>
          <small>
            {reviewItems.length ? "Needs review" : "No items need review"}
          </small>
        </div>
      </div>

      <div className={desktopStyles.workspace} data-ui-slot="content">
        <div className={desktopStyles.primaryColumn}>
          <article
            className={desktopStyles.accountPanel}
            data-ui-slot="primary-panel"
          >
            <DashboardCashCarousel
              snapshot={snapshot}
              loading={loading}
              error={error}
              selectedWalletId={cashWallet?.id ?? null}
              onSelectWallet={setSelectedCashWalletId}
              onPreview={() => setCardPreviewOpen(true)}
            />
            <div className={desktopStyles.accountSummary}>
              <div>
                <span className={desktopStyles.eyebrow}>
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
                  className={desktopStyles.accountActivity}
                  href="/dashboard/transactions"
                >
                  {loading ? (
                    "Cash register data is loading…"
                  ) : cashWallet ? (
                    <>
                      Latest transaction:{" "}
                      <LoadingText loading={loading}>
                        {lastTransaction}
                      </LoadingText>
                    </>
                  ) : (
                    "Create a cash register to manage transactions."
                  )}
                </Link>
              </div>
              <div className={desktopStyles.accountActions}>
                <Link href="/dashboard/transactions">
                  <Plus aria-hidden="true" /> Transaction
                </Link>
                <Link href="/dashboard/funds">
                  Open cash register <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>

          <article className={desktopStyles.transactionsPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Latest transactions</h2>
                <p>Recent activity across all cash registers</p>
              </div>
              <Link href="/dashboard/transactions">
                View all <ArrowRight aria-hidden="true" />
              </Link>
            </header>
            <div className={desktopStyles.transactionHeader}>
              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
            </div>
            <div
              className={desktopStyles.transactionRows}
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
                  {transactionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        className={desktopStyles.transactionRow}
                        key={item.title}
                      >
                        <span className={desktopStyles.transactionName}>
                          <Icon aria-hidden="true" />
                          <strong>{item.title}</strong>
                        </span>
                        <span>{item.category}</span>
                        <span>{item.date}</span>
                        <b
                          className={
                            item.amount.startsWith("+")
                              ? desktopStyles.positive
                              : desktopStyles.negative
                          }
                        >
                          {item.amount}
                        </b>
                      </div>
                    );
                  })}
                </LoadingCollection>
              )}
            </div>
          </article>
        </div>

        <aside
          className={desktopStyles.secondaryColumn}
          data-ui-slot="secondary-panel"
        >
          <article className={desktopStyles.goalsPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Goals</h2>
                <p>Progress of key goals</p>
              </div>
              <Link href="/dashboard/goals">
                Open <ArrowRight aria-hidden="true" />
              </Link>
            </header>
            <div className={desktopStyles.goalRows}>
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
                  emptyHeight="8rem"
                  label="Goals are loading…"
                >
                  {goalItems.map((goal) => (
                    <div className={desktopStyles.goalRow} key={goal.title}>
                      <span>
                        <strong>{goal.title}</strong>
                        <small>{goal.saved}</small>
                      </span>
                      <div>
                        <i style={{ width: `${goal.progress}%` }} />
                      </div>
                      <b>{goal.progress}%</b>
                    </div>
                  ))}
                </LoadingCollection>
              )}
            </div>
          </article>

          <article className={desktopStyles.spendingPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Expenses</h2>
                <p>By category</p>
              </div>
              <span className={desktopStyles.panelValue}>
                {displayMinor(String(expenseTotal))}
              </span>
            </header>
            <div className={desktopStyles.spendingRows}>
              {!loading && categoryItems.length === 0 ? (
                <DashboardEmpty
                  title="No expenses recorded"
                  description="Recorded spending will appear by category."
                  href="/dashboard/transactions"
                  action="Open transactions"
                />
              ) : (
                <LoadingCollection
                  loading={loading}
                  knownItemCount={categoryItems.length}
                  emptyHeight="7rem"
                  label="Expenses are loading…"
                >
                  {categoryItems.map((item) => (
                    <div className={desktopStyles.spendingRow} key={item.title}>
                      <span>{item.title}</span>
                      <div>
                        <i style={{ width: `${item.progress}%` }} />
                      </div>
                      <b>{item.progress}%</b>
                    </div>
                  ))}
                </LoadingCollection>
              )}
            </div>
          </article>

          <article className={desktopStyles.reviewPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Pending review</h2>
                <p>Tasks needing attention</p>
              </div>
              <span className={desktopStyles.reviewCount}>
                {reviewItems.length}
              </span>
            </header>
            <div className={desktopStyles.reviewRows}>
              {reviewItems.length === 0 ? (
                <DashboardEmpty
                  title="No items need review"
                  description="Review tasks will appear here when needed."
                  href="/dashboard/receipts"
                  action="Open receipts"
                />
              ) : (
                reviewItems.map((item) => (
                  <Link href={item.href} key={item.title}>
                    <FileText aria-hidden="true" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </article>
        </aside>
      </div>

      {cardPreviewOpen ? (
        <Dialog
          label={`View ${cashWallet?.name ?? "Cash register"}`}
          onClose={() => setCardPreviewOpen(false)}
          overlayClassName={desktopStyles.accountOverlay}
          dialogClassName={desktopStyles.accountDialog}
        >
          <header className={desktopStyles.accountDialogHeader}>
            <div>
              <h2>{cashWallet?.name ?? "Cash register"}</h2>
              <p>Kartenvorschau</p>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setCardPreviewOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={desktopStyles.accountDialogCard}>
            <AccountCard
              details={
                cashCard?.details ?? {
                  accountName: cashWallet?.name ?? "Cash register",
                }
              }
              cardColor={cashCard?.details.color}
            />
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}


export default DesktopDashboard;
