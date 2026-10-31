"use client";

import { useEffect, useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { LoadingStatus } from "@/components/ui/loading-state";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { archiveTransaction as archiveTransactionAction } from "@/features/finance/actions/corrections";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { ReceiptReviewDialog } from "@/components/receipts/ReceiptReviewDialog";
import { useReceiptReview } from "@/features/receipts/use-receipt-review";

import {
  categoryFilterOptions,
  type Transaction,
} from "@/features/finance/transactions/view-model";
import { DateRangeDialog } from "./DateRangeDialog";
import { TransactionFiltersDialog } from "./TransactionFiltersDialog";
import { TransactionEditorDialog } from "./TransactionEditorDialog";
import { TransactionsTable } from "./TransactionsTable";
import { useTransactionEditor } from "./use-transaction-editor";
import { useTransactionFilters } from "./use-transaction-filters";
import { TransactionsSummary } from "./TransactionsSummary";
import { TransactionsToolbar } from "./TransactionsToolbar";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { ArchiveTransactionDialog } from "./ArchiveTransactionDialog";
import { transactionsFromDashboard } from "./transactions-from-dashboard";
import { cashRegistersFromDashboard } from "./cash-registers-from-dashboard";
import { receiptTypeLabel } from "./receipt-type-label";
import { sumIncomeAndExpense } from "./sum-income-and-expense";

const emptyTransactions: Transaction[] = [];

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

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId || loading) return;

    const transaction = items.find((item) => String(item.id) === editId);
    if (!transaction) return;

    window.history.replaceState(null, "", window.location.pathname);
    if (transaction.canEdit) openEdit(transaction);
  }, [items, loading]);

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

      <TransactionsSummary
        loading={loading}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        addDisabled={loading || !transactionEditor.activeCashRegisterId || Boolean(loadError)}
        onAddTransaction={openAddTransaction}
      />

      <TransactionsToolbar
        loading={loading}
        query={filters.filters.query}
        onQueryChange={filters.setQuery}
        category={filters.filters.category}
        categoryOptions={transactionCategoryOptions}
        onCategoryChange={filters.setCategory}
        type={filters.filters.type}
        onTypeChange={filters.setType}
        dateLabel={filters.dateLabel}
        onOpenDateDialog={filters.openDateDialog}
        activeFilterCount={filters.activeFilterCount}
        onOpenFilterDialog={filters.openFilterDialog}
      />

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
        <TransactionDetailsDialog
          transaction={selected}
          onClose={() => setSelected(null)}
        />
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
        <ArchiveTransactionDialog
          reason={archiveReason}
          actionError={actionError}
          saving={saving}
          onReasonChange={setArchiveReason}
          onDismiss={() => { if (!saving) setArchiveTarget(null); }}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={confirmArchiveTransaction}
        />
      ) : null}
    </section>
  );
}
