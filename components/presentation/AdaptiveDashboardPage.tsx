"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  HandCoins,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Target,
  X,
} from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import { Dialog } from "@/components/ui/dialog";
import {
  dashboardCategories,
} from "@/components/dashboard/DashboardPanels";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import styles from "@/app/dashboard/dashboard-adaptive.module.css";
import desktopStyles from "@/app/dashboard/dashboard-desktop.module.css";
import { useDashboardSnapshot, type DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import { InlineLoading, LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { mapWalletToCashRegisterCard, type CashRegisterWallet } from "@/lib/finance/cash-register-card";

function displayMinor(value: string) {
  return (Number(value) / 100).toLocaleString("en-GB", { style: "currency", currency: "EUR" });
}

function formatLastTransaction(date: string | undefined) {
  if (!date) return "No transactions yet";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No transactions yet";

  const days = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86_400_000));
  const time = parsed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `${time}, today`;
  if (days === 1) return `${time}, vor 1 Tag`;
  return `${time}, vor ${days} Tagen`;
}

function displayDashboardTransactions(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.transactions.map((item) => ({
    title: item.title,
    category: item.category,
    date: item.date,
    amount: `${Number(item.amountMinor) >= 0 ? "+" : ""}${displayMinor(item.amountMinor)}`,
    tone: Number(item.amountMinor) >= 0 ? "green" : "violet",
    icon: Number(item.amountMinor) >= 0 ? HandCoins : FileText,
  }));
}

function displayDashboardGoals(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.goals.map((goal) => {
    const target = Number(goal.target_amount_minor) / 100;
    const saved = Number(goal.saved_amount_minor) / 100;
    return {
      title: goal.title,
      target: target.toLocaleString("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
      saved: `${saved.toLocaleString("en-GB", { style: "currency", currency: "EUR" })} gesammelt`,
      progress: target ? Math.round((saved / target) * 100) : 0,
      date: new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("en-GB"),
    };
  });
}

function displayDashboardCategories(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.categories.map((item, index) => ({
    title: item.name,
    amount: displayMinor(item.amountMinor),
    progress: item.progress,
    color: dashboardCategories[index % dashboardCategories.length]?.color ?? "bg-black",
    bubble: dashboardCategories[index % dashboardCategories.length]?.bubble ?? "bg-black/[0.04] text-ink",
    icon: dashboardCategories[index % dashboardCategories.length]?.icon ?? MoreHorizontal,
  }));
}

function primaryCashWallet(snapshot: DashboardSnapshot | null) {
  return snapshot?.wallets.find((wallet) => wallet.type === "cash") ?? null;
}

function DashboardCashCarousel({
  snapshot,
  loading,
  error,
  selectedWalletId,
  onSelectWallet,
  onPreview,
}: {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
  onPreview: (wallet: CashRegisterWallet) => void;
}) {
  const wallets = snapshot?.wallets.filter((wallet) => wallet.type === "cash") ?? [];
  if (loading) {
    return (
      <div className={desktopStyles.cashCardCarousel} aria-busy="true">
        <div className={desktopStyles.cashCardCarouselCard}>
          <InlineLoading label="Cash register is loading…" />
        </div>
      </div>
    );
  }
  if (error) return <div className={desktopStyles.cashCardCarousel} aria-hidden="true" />;
  if (!wallets.length) return <Link href="/dashboard/funds" className={desktopStyles.accountCard} aria-label="Create cash register"><AccountCard variant="add" /></Link>;
  const selectedIndex = wallets.findIndex((wallet) => wallet.id === selectedWalletId);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const wallet = wallets[safeIndex];
  const card = mapWalletToCashRegisterCard(wallet);
  return (
    <div className={desktopStyles.cashCardCarousel}>
      {wallets.length > 1 ? <button type="button" aria-label="Previous cash register" onClick={() => onSelectWallet(wallets[(safeIndex - 1 + wallets.length) % wallets.length].id)}><ChevronLeft aria-hidden="true" /></button> : null}
      <button type="button" className={desktopStyles.cashCardCarouselCard} aria-label={`${wallet.name} anzeigen`} onClick={() => onPreview(wallet)}><AccountCard cardColor={card.details.color} details={card.details} /></button>
      {wallets.length > 1 ? <button type="button" aria-label="Next cash register" onClick={() => onSelectWallet(wallets[(safeIndex + 1) % wallets.length].id)}><ChevronRight aria-hidden="true" /></button> : null}
    </div>
  );
}

function displayDashboardReviews(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.transactions
    .filter((item) => item.reviewStatus !== "Approved")
    .map((item) => ({
      title: item.title,
      detail: item.receipt ? "Receipt status pending" : "Cash payment without receipt",
      href: "/dashboard/transactions",
    }));
}

function DesktopDashboard({ snapshot, loading, error }: { snapshot: DashboardSnapshot | null; loading: boolean; error: string | null }) {
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [selectedCashWalletId, setSelectedCashWalletId] = useState<string | null>(null);
  const transactionItems = displayDashboardTransactions(snapshot);
  const goalItems = displayDashboardGoals(snapshot);
  const categoryItems = displayDashboardCategories(snapshot);
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallets = snapshot?.wallets.filter((wallet) => wallet.type === "cash") ?? [];
  const cashWallet = cashWallets.find((wallet) => wallet.id === selectedCashWalletId) ?? cashWallets[0] ?? null;
  const cashCard = cashWallet ? mapWalletToCashRegisterCard(cashWallet) : null;
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;
  const incomeTotal = snapshot ? snapshot.transactions.filter((item) => Number(item.amountMinor) >= 0).reduce((sum, item) => sum + Number(item.amountMinor), 0) : 0;
  const expenseTotal = snapshot ? snapshot.transactions.filter((item) => Number(item.amountMinor) < 0).reduce((sum, item) => sum + Math.abs(Number(item.amountMinor)), 0) : 0;
  const lastTransaction = formatLastTransaction(snapshot?.transactions[0]?.date);

  return (
    <section className={desktopStyles.page} aria-label="Financial overview" aria-busy={loading}>
      <LoadingStatus loading={loading} label="Financial overview is loading…" />
      {error ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
      <div className={desktopStyles.metrics} aria-label="Financial metrics" data-ui-slot="summary">
        <div>
          <span>Total available</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></strong>
          <small>{loading ? "Cash registers are loading…" : cashWallet?.name ?? "No Cash register angelegt"}</small>
        </div>
        <div>
          <span>Income</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(incomeTotal))}</LoadingText></strong>
          <small>{loading ? "Cash registers are loading…" : cashWallet ? `Aus ${cashWallet.name}` : "No Daten"}</small>
        </div>
        <div>
          <span>Expenses</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(expenseTotal))}</LoadingText></strong>
          <small>{loading ? "Cash registers are loading…" : cashWallet ? `Aus ${cashWallet.name}` : "No Daten"}</small>
        </div>
        <div>
          <span>Open reviews</span>
          <strong><LoadingText loading={loading}>{reviewItems.length} items</LoadingText></strong>
          <small>{reviewItems.length ? "Activee Reviewen" : "No pendingen Reviewen"}</small>
        </div>
      </div>

      <div className={desktopStyles.workspace} data-ui-slot="content">
        <div className={desktopStyles.primaryColumn}>
          <article className={desktopStyles.accountPanel} data-ui-slot="primary-panel">
            <DashboardCashCarousel snapshot={snapshot} loading={loading} error={error} selectedWalletId={cashWallet?.id ?? null} onSelectWallet={setSelectedCashWalletId} onPreview={() => setCardPreviewOpen(true)} />
            <div className={desktopStyles.accountSummary}>
              <div>
                <span className={desktopStyles.eyebrow}>{loading ? "Cash register is loading…" : cashWallet?.name ?? "No Cash register angelegt"}</span>
                <strong><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></strong>
                <Link className={desktopStyles.accountActivity} href="/dashboard/transactions">
                  {loading ? "Cash register data is loading…" : cashWallet ? <>Letzte Transaction: <LoadingText loading={loading}>{lastTransaction}</LoadingText></> : "Create a cash register to manage transactions."}
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
                <h2>Letzte Transactions</h2>
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
            <div className={desktopStyles.transactionRows} data-ui-slot="list-body">
              <LoadingCollection loading={loading} knownItemCount={transactionItems.length} emptyHeight="100%" label="Transactions are loading…">
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
            </div>
          </article>
        </div>

        <aside className={desktopStyles.secondaryColumn} data-ui-slot="secondary-panel">
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
              <LoadingCollection loading={loading} knownItemCount={goalItems.length} emptyHeight="8rem" label="Goals are loading…">
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
            </div>
          </article>

          <article className={desktopStyles.spendingPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Expenses</h2>
                <p>By category</p>
              </div>
              <span className={desktopStyles.panelValue}>{displayMinor(String(expenseTotal))}</span>
            </header>
            <div className={desktopStyles.spendingRows}>
              <LoadingCollection loading={loading} knownItemCount={categoryItems.length} emptyHeight="7rem" label="Expenses are loading…">
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
            </div>
          </article>

          <article className={desktopStyles.reviewPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Pending review</h2>
                <p>Tasks needing attention</p>
              </div>
              <span className={desktopStyles.reviewCount}>{reviewItems.length}</span>
            </header>
            <div className={desktopStyles.reviewRows}>
              {reviewItems.map((item) => (
                <Link href={item.href} key={item.title}>
                  <FileText aria-hidden="true" />
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </article>
        </aside>
      </div>

      {cardPreviewOpen ? (
        <Dialog
          label={`${cashWallet?.name ?? "Cash register"} anzeigen`}
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
              details={cashCard?.details ?? { accountName: cashWallet?.name ?? "Cash register" }}
              cardColor={cashCard?.details.color}
            />
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

function TabletDashboard({ snapshot, loading, error }: { snapshot: DashboardSnapshot | null; loading: boolean; error: string | null }) {
  const transactionItems = displayDashboardTransactions(snapshot);
  const goalItems = displayDashboardGoals(snapshot);
  const categoryItems = displayDashboardCategories(snapshot);
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallet = primaryCashWallet(snapshot);
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;
  const lastTransaction = formatLastTransaction(snapshot?.transactions[0]?.date);
  const incomeTotal = snapshot ? snapshot.transactions.filter((item) => Number(item.amountMinor) >= 0).reduce((sum, item) => sum + Number(item.amountMinor), 0) : 0;
  const expenseTotal = snapshot ? snapshot.transactions.filter((item) => Number(item.amountMinor) < 0).reduce((sum, item) => sum + Math.abs(Number(item.amountMinor)), 0) : 0;
  return (
    <section className={styles.tabletPage} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Financial overview is loading…" />
      {error ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
      <div className={styles.tabletMetricStrip} aria-label="Financial metrics" data-ui-slot="summary">
        <div className={styles.tabletMetric}>
          <span>cash balance</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Income</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(incomeTotal))}</LoadingText></strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Expenses</span>
          <strong><LoadingText loading={loading}>{displayMinor(String(expenseTotal))}</LoadingText></strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Pending review</span>
          <strong><LoadingText loading={loading}>{reviewItems.length} items</LoadingText></strong>
        </div>
      </div>

      <div className={styles.tabletWorkspace} data-ui-slot="content">
        <div className={styles.tabletPrimary}>
          <article className={styles.tabletAccount}>
            <div className={styles.tabletCardSlot}>
              {cashWallet ? <AccountCard details={{ accountName: cashWallet.name, cardNumber: cashWallet.cardNumberVisual ?? undefined, holder: cashWallet.cardHolderVisual ?? undefined, expiry: cashWallet.cardExpiryVisual ?? undefined }} cardColor={cashWallet.cardColorVisual ?? undefined} /> : loading ? <InlineLoading label="Cash register is loading…" /> : error ? null : <Link href="/dashboard/funds" aria-label="Create cash register"><AccountCard variant="add" /></Link>}
            </div>
            <div className={styles.tabletBalance}>
              <span>{loading ? "Cash register is loading…" : cashWallet?.name ?? "No Cash register angelegt"}</span>
              <strong><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></strong>
              <Link className={styles.tabletActivity} href="/dashboard/transactions">
                {loading ? "Cash register data is loading…" : <>Letzte Transaction: <LoadingText loading={loading}>{lastTransaction}</LoadingText></>}
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
              <h2>Letzte Transactions</h2>
              <Link href="/dashboard/transactions">
                View all{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div className={styles.tabletTransactionList} data-ui-slot="list-body">
              <LoadingCollection loading={loading} knownItemCount={transactionItems.length} emptyHeight="100%" label="Transactions are loading…">
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
            </div>
          </article>
        </div>

        <aside className={styles.tabletSecondary} data-ui-slot="secondary-panel">
          <article className={styles.tabletGoals}>
            <header className={styles.tabletSectionHeader}>
              <h2>Goals</h2>
              <Link href="/dashboard/goals">
                Open <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div className={styles.tabletGoalList}>
              {goalItems.map((goal) => (
                <div className={styles.tabletGoal} key={goal.title}>
                  <strong>{goal.title}</strong>
                  <span>{goal.progress}%</span>
                  <div className={styles.tabletGoalTrack} aria-hidden="true">
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.tabletSpending}>
            <header className={styles.tabletSectionHeader}>
              <h2>Expenses</h2>
              <span className={styles.sectionMeta}>By category</span>
            </header>
            <div className={styles.tabletSpendingList}>
              {categoryItems.map((item) => (
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
              ))}
            </div>
          </article>

          <article className={styles.tabletAttention}>
            <header className={styles.tabletSectionHeader}>
              <h2>Aufmerksamkeit</h2>
              <span className={styles.sectionMeta}>{reviewItems.length} pending</span>
            </header>
            <div className={styles.tabletAttentionList}>
              {reviewItems.map((item) => (
                <Link href={item.href} className={styles.tabletAttentionRow} key={item.title}>
                  <FileText aria-hidden="true" />
                  <span><strong>{item.title}</strong></span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function PhoneDashboard({ snapshot, loading, error }: { snapshot: DashboardSnapshot | null; loading: boolean; error: string | null }) {
  const transactionItems = displayDashboardTransactions(snapshot);
  const goalItems = displayDashboardGoals(snapshot);
  const reviewItems = displayDashboardReviews(snapshot);
  const cashWallet = primaryCashWallet(snapshot);
  const cashBalance = cashWallet ? Number(cashWallet.balanceMinor) : 0;
  const cashHasCount = Boolean(cashWallet?.lastCountAt);
  const cashCountMatches = cashHasCount && Math.abs(Number(cashWallet?.lastCountDifferenceMinor ?? 0)) < 0.01;
  const lastTransaction = formatLastTransaction(snapshot?.transactions[0]?.date);
  return (
    <section className={styles.phonePage} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Financial overview is loading…" />
      {error ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
      <div className={styles.phoneBalanceHero} data-ui-slot="summary">
        <span className={styles.phoneEyebrow}>Total available</span>
        <strong><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></strong>
        <div className={styles.phoneBalanceMeta}>
          <span>{loading ? "Cash register is loading…" : cashWallet?.name ?? "No Cash register angelegt"}</span>
          {cashWallet ? <b>{!cashHasCount ? "Not reviewed yet" : cashCountMatches ? "Reconciliation matches" : "Review discrepancy"}</b> : null}
        </div>
      </div>

      <nav className={styles.phoneQuickActions} aria-label="Schnellaktionen" data-ui-slot="toolbar">
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
            <strong>{loading ? "Cash register is loading…" : cashWallet?.name ?? "No Cash register angelegt"}</strong>
          </Link>
          <Link href="/dashboard/transactions">
            <span>{loading ? "Cash register data is loading…" : `Letzte Transaction: ${lastTransaction}`}</span>
          </Link>
        </div>
        <b><LoadingText loading={loading}>{displayMinor(String(cashBalance))}</LoadingText></b>
      </div>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Zuletzt</h2>
          <Link href="/dashboard/transactions">
            All <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneTransactionList} data-ui-slot="list-body">
          <LoadingCollection loading={loading} knownItemCount={transactionItems.length} emptyHeight="4rem" label="Transactions are loading…">
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
        </div>
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Savings goals</h2>
          <Link href="/dashboard/goals">
            Verwalten <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneGoalScroller}>
          <LoadingCollection loading={loading} knownItemCount={goalItems.length} emptyHeight="5rem" label="Goals are loading…">
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
        </div>
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Pending review</h2>
          <span className={styles.sectionMeta}>{reviewItems.length} items</span>
        </header>
        <div className={styles.phoneAttentionList}>
          {reviewItems.map((item) => (
            <Link href={item.href} className={styles.phoneAttentionRow} key={item.title}>
              <FileText aria-hidden="true" />
              <span>{item.title}</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

export default function AdaptiveDashboardPage() {
  const mode = usePresentationMode();
  const { snapshot, loading, error } = useDashboardSnapshot();
  if (mode === "tablet") return <TabletDashboard snapshot={snapshot} loading={loading} error={error} />;
  if (mode === "phone") return <PhoneDashboard snapshot={snapshot} loading={loading} error={error} />;
  return <DesktopDashboard snapshot={snapshot} loading={loading} error={error} />;
}
