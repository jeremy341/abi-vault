"use client";

import { useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { X } from "lucide-react";
import styles from "./transactions.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { Dialog } from "@/components/ui/dialog";
import {
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import { getDashboardSnapshot, type DashboardResult } from "@/features/finance/actions/queries";
import { archiveTransaction as archiveTransactionAction } from "@/features/finance/actions/corrections";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { ReceiptReviewDialog } from "@/components/receipts/ReceiptReviewDialog";
import { useReceiptReview } from "@/features/receipts/use-receipt-review";

import {
  categoryFilterOptions,
  formatAmount,
  formatLongDate,
  formatTotal,
  toTransaction,
  type Transaction,
} from "@/features/finance/transactions/view-model";
import { StyledDropdown } from "./TransactionControls";
import { DateRangeDialog, TransactionFiltersDialog } from "./TransactionFilterDialogs";
import { TransactionEditorDialog } from "./TransactionEditorDialog";
import { TransactionsTable } from "./TransactionsTable";
import { useTransactionEditor } from "./use-transaction-editor";
import { useTransactionFilters } from "./use-transaction-filters";

type DashboardData = Extract<DashboardResult, { ok: true }>;

const emptyTransactions: Transaction[] = [];

function transactionsFromDashboard(data: DashboardData) {
  return data.transactions.map(toTransaction);
}

function cashRegistersFromDashboard(data: DashboardData) {
  return data.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }));
}

function receiptTypeLabel(receiptType: string | null): "PDF" | "PNG" | "JPG" {
  if (receiptType === "application/pdf") {
    return "PDF";
  }

  if (receiptType === "image/png") {
    return "PNG";
  }

  return "JPG";
}

function sumIncomeAndExpense(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.amount >= 0) {
      income += transaction.amount;
    } else {
      expense += Math.abs(transaction.amount);
    }
  }

  return { totalIncome: income, totalExpense: expense };
}

export default function TransactionsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const { data, loading: queryLoading, refreshing, failed, refetch } = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);

  const [items, setItems] = useQueryBackedState(
    data?.ok ? data : null,
    transactionsFromDashboard,
    emptyTransactions,
  );

  const receiptReview = useReceiptReview({
    onStatusChange: (receiptId, status) => {
      setItems((current) =>
        current.map((transaction) =>
          transaction.receiptId === receiptId
            ? { ...transaction, reviewStatus: status }
            : transaction,
        ),
      );
    },
  });

  const transactionCategoryOptions = [...new Set([...categoryFilterOptions, ...items.map((item) => item.category)])];

  const cashRegisters = data?.ok ? cashRegistersFromDashboard(data) : [];

  const [saving, setSaving] = useState(false);
  const archiveIdempotencyKey = useRef<string | null>(null);
  const loadError = failed ? "Transactions could not be loaded." : "";
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Transaction | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [actionError, setActionError] = useState("");

  const pageSize = useResponsivePageSize({
    defaultSize: 10,
    landscapeSize: 6,
    wideSize: 10,
  });

  const filters = useTransactionFilters(items, pageSize);

  const transactionEditor = useTransactionEditor({
    cashRegisters,
    userId,
    setItems,
    refetch,
    onCreated: () => filters.setPage(1),
  });

  const { totalIncome, totalExpense } = sumIncomeAndExpense(items);

  const netBalance = totalIncome - totalExpense;

  const loading = queryLoading || !data;

  function openAddTransaction() {
    setSelected(null);
    transactionEditor.openAdd();
  }

  function openEdit(transaction: Transaction) {
    setSelected(null);
    transactionEditor.openEdit(transaction);
  }

  function closeTransactionModal() {
    transactionEditor.close();
  }

  function openArchive(transaction: Transaction) {
    setSelected(null);
    setArchiveTarget(transaction);
    setArchiveReason("");
    setActionError("");
    archiveIdempotencyKey.current = `archive-${transaction.id}-${crypto.randomUUID()}`;
  }

  function openReceiptReview(transaction: Transaction) {
    if (!transaction.receiptId) return;

    void receiptReview.open({
      id: transaction.receiptId,
      receipt: {
        file: transaction.receipt ?? "Receipt",
        type: receiptTypeLabel(transaction.receiptType),
        transaction: transaction.title,
        date: transaction.date,
        amount: transaction.amount,
        status: transaction.reviewStatus,
        createdByName: transaction.createdByName,
        createdAt: transaction.createdAt,
      },
    });
  }

  async function confirmArchiveTransaction() {
    if (!archiveTarget || saving || !archiveReason.trim()) return;
    setSaving(true);
    setActionError("");

    try {
      const archived = await archiveTransactionAction({
        transactionId: archiveTarget.id.toString(),
        reason: archiveReason,
        idempotencyKey: archiveIdempotencyKey.current ?? `archive-${archiveTarget.id}`,
      });

      if (!archived.success) {
        setActionError(archived.error.message);

        return;
      }

      setItems((current) => current.filter((transaction) => transaction.id !== archiveTarget.id));
      setArchiveTarget(null);
      setArchiveReason("");
      archiveIdempotencyKey.current = null;
      invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");
    } catch {
      setActionError("The transaction could not be archived.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading transactions" />
      {refreshing && !loading ? <span className="sr-only" role="status">Updating transactions</span> : null}
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Income</dt>
            <dd><LoadingText loading={loading}>{formatTotal(totalIncome)}</LoadingText></dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd><LoadingText loading={loading}>{formatTotal(totalExpense)}</LoadingText></dd>
          </div>
          <div>
            <dt>Net</dt>
            <dd className={`${ledger.net} total-rule`}><LoadingText loading={loading}>{formatAmount(netBalance)}</LoadingText></dd>
          </div>
        </dl>
        <button
          type="button"
          className={ledger.primaryButton}
          onClick={openAddTransaction}
          disabled={loading || !transactionEditor.activeCashRegisterId || Boolean(loadError)}
        >
          Add transaction
        </button>
      </div>

      <div className={`${ledger.toolbar} ${ledger.toolbarWide}`}>
        <label className={ledger.searchField}>
          <span className="sr-only">Search transactions</span>
          <input
            value={filters.filters.query}
            disabled={loading}
            onChange={(event) => filters.setQuery(event.target.value)}
            placeholder="Search transactions"
          />
        </label>
        <StyledDropdown
          ariaLabel="Select category"
          value={filters.filters.category}
          onChange={filters.setCategory}
          className={styles.filterDropdown}
          options={[
            { value: "All", label: "All categories" },
            ...transactionCategoryOptions.map((value) => ({ value, label: value })),
          ]}
        />
        <StyledDropdown
          ariaLabel="Select type"
          value={filters.filters.type}
          onChange={(value) => {
            if (value === "All" || value === "Income" || value === "Expenses") {
              filters.setType(value);
            }
          }}
          className={styles.filterDropdown}
          options={[
            { value: "All", label: "All types" },
            { value: "Income", label: "Income" },
            { value: "Expenses", label: "Expenses" },
          ]}
        />
        <button
          type="button"
          className={ledger.secondaryButton}
          onClick={filters.openDateDialog}
        >
          {filters.dateLabel}
        </button>
        <button type="button" className={ledger.secondaryButton} onClick={filters.openFilterDialog}>
          {filters.activeFilterCount ? `Filters (${filters.activeFilterCount})` : "Filters"}
        </button>
      </div>

      <TransactionsTable
        loading={loading}
        loadError={loadError}
        itemCount={items.length}
        visible={filters.visibleTransactions}
        resultCount={filters.filteredCount}
        rangeStart={filters.rangeStart}
        rangeEnd={filters.rangeEnd}
        page={filters.page}
        pageCount={filters.pageCount}
        onPageChange={filters.setPage}
        onResetFilters={filters.resetFilters}
        onSelect={setSelected}
        onEdit={openEdit}
        onDelete={openArchive}
        onReviewReceipt={(transaction) => { void openReceiptReview(transaction); }}
      />

      <DateRangeDialog
        open={filters.dateDialogOpen}
        start={filters.draft.start}
        end={filters.draft.end}
        onStartChange={filters.setDraftStart}
        onEndChange={filters.setDraftEnd}
        onReset={filters.resetDraftDateRange}
        onClose={() => filters.setDateDialogOpen(false)}
        onApply={filters.applyDraftFilters}
      />

      <TransactionFiltersDialog
        open={filters.filterDialogOpen}
        categoryOptions={transactionCategoryOptions}
        categories={filters.draft.categories}
        types={filters.draft.types}
        minAmount={filters.draft.minimumAmount}
        maxAmount={filters.draft.maximumAmount}
        receiptFilter={filters.draft.receipt}
        reviewFilter={filters.draft.review}
        onToggleCategory={filters.toggleDraftCategory}
        onToggleType={filters.toggleDraftType}
        onMinAmountChange={filters.setDraftMinimumAmount}
        onMaxAmountChange={filters.setDraftMaximumAmount}
        onReceiptFilterChange={filters.setDraftReceiptFilter}
        onReviewFilterChange={filters.setDraftReviewFilter}
        onReset={filters.resetFilters}
        onClose={() => filters.setFilterDialogOpen(false)}
        onApply={filters.applyDraftFilters}
      />
      <TransactionEditorDialog
        open={transactionEditor.open}
        editing={transactionEditor.editing}
        saving={transactionEditor.saving}
        error={transactionEditor.error}
        title={transactionEditor.title}
        amount={transactionEditor.amount}
        category={transactionEditor.category}
        type={transactionEditor.type}
        correctionReason={transactionEditor.correctionReason}
        selectedCashRegisterId={transactionEditor.selectedCashRegisterId}
        cashRegisters={cashRegisters}
        categoryOptions={transactionEditor.categoryOptions}
        onTitleChange={transactionEditor.changeTitle}
        onAmountChange={transactionEditor.changeAmount}
        onCategoryChange={transactionEditor.changeCategory}
        onTypeChange={transactionEditor.changeType}
        onCorrectionReasonChange={transactionEditor.changeCorrectionReason}
        onCashRegisterChange={transactionEditor.changeCashRegister}
        onClose={closeTransactionModal}
        onSave={transactionEditor.save}
      />

      {selected ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label="Transaction details"
          onClose={() => setSelected(null)}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>{selected.title}</h2>
              <p>Transaction details</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              <X />
            </button>
          </div>
          <div className={styles.detailGrid}>
            <span>Category</span>
            <strong>{selected.category}</strong>
            <span>Date</span>
            <strong>{formatLongDate(selected.date)}</strong>
            <span>Amount</span>
            <strong>{formatAmount(selected.amount)}</strong>
            <span>Receipt</span>
            <strong>{selected.receipt ?? "No receipt"}</strong>
          </div>
        </Dialog>
      ) : null}

      {receiptReview.target ? (
        <ReceiptReviewDialog
          receipt={receiptReview.target.receipt}
          previewUrl={receiptReview.previewUrl}
          downloadUrl={receiptReview.downloadUrl}
          previewAsImage={receiptReview.previewAsImage}
          previewLoading={receiptReview.previewLoading}
          previewError={receiptReview.previewError}
          saving={receiptReview.saving}
          error={receiptReview.error}
          onClose={receiptReview.close}
          onDecision={(decision) => { void receiptReview.decide(decision); }}
        />
      ) : null}

      {archiveTarget ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label="Archive transaction"
          onClose={() => { if (!saving) setArchiveTarget(null); }}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Archive transaction?</h2>
              <p>It stays in the review log but no longer counts in totals.</p>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => setArchiveTarget(null)} disabled={saving} aria-label="Close dialog"><X /></button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Reason</span>
              <textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why should the transaction be archived?" rows={3} autoFocus />
            </label>
            {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
          </div>
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button type="button" className={styles.secondaryButton} onClick={() => setArchiveTarget(null)} disabled={saving}>Cancel</button>
              <button type="button" className={styles.primaryButton} onClick={confirmArchiveTransaction} disabled={saving || !archiveReason.trim()} aria-busy={saving}>{saving ? "Archiving" : "Archive"}</button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
