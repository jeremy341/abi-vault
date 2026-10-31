"use client";

import { EmptyState } from "@/components/ui/empty-state";
import {
  LoadingCollection,
  LoadingText,
} from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { RowActionMenu } from "@/components/ui/row-actions";
import {
  formatAmount,
  formatLongDate,
  type Transaction,
} from "@/features/finance/transactions/view-model";
import ledger from "../ledger.module.css";

type TransactionsTableProps = {
  loading: boolean;
  loadError: string;
  itemCount: number;
  visible: Transaction[];
  resultCount: number;
  rangeStart: number;
  rangeEnd: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSelect: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onReviewReceipt: (transaction: Transaction) => void;
};

function reviewStatusClassName(reviewStatus: string) {
  if (reviewStatus === "Approved") {
    return ledger.muted;
  }

  if (reviewStatus === "Invalid") {
    return ledger.invalid;
  }

  return ledger.attention;
}

function receiptActionLabel(transaction: Transaction) {
  if (!transaction.receiptId) {
    return undefined;
  }

  if (transaction.reviewStatus === "Pending review") {
    return "Review receipt";
  }

  return "View receipt";
}

export function TransactionsTable({
  loading,
  loadError,
  itemCount,
  visible,
  resultCount,
  rangeStart,
  rangeEnd,
  page,
  pageCount,
  onPageChange,
  onResetFilters,
  onSelect,
  onEdit,
  onDelete,
  onReviewReceipt,
}: TransactionsTableProps) {
  function renderTableContent() {
    if (loading) {
      return (
        <LoadingCollection
          loading
          knownItemCount={itemCount}
          emptyHeight="14rem"
          label="Loading transactions"
        >
          <div />
        </LoadingCollection>
      );
    }

    if (loadError) {
      return null;
    }

    if (!visible.length) {
      return (
        <EmptyState
          title="No transactions found"
          description="Change the search or reset the filters."
          action={<button type="button" onClick={onResetFilters}>Reset filters</button>}
        />
      );
    }

    return (
      <table className={`${ledger.table} ${ledger.clickable}`}>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col" className={ledger.hideOnPhone}>Category</th>
            <th scope="col" className={ledger.hideOnPhone}>Date</th>
            <th scope="col" className={ledger.hideOnPhone}>Receipt</th>
            <th scope="col" className={ledger.hideOnPhone}>Status</th>
            <th scope="col" className={ledger.amount}>Amount</th>
            <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((transaction) => {
            const missingReceipt = !transaction.receipt && transaction.type === "expense";
            const needsReview = Boolean(transaction.receipt) && transaction.reviewStatus !== "Approved";

            return (
              <tr
                key={transaction.id}
                tabIndex={0}
                onClick={() => onSelect(transaction)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(transaction);
                  }
                }}
              >
                <td>
                  <span className={ledger.title}>{transaction.title}</span>
                  <span className={ledger.phoneMeta}>
                    {transaction.category}, {formatLongDate(transaction.date)}
                    {missingReceipt ? <b>, receipt missing</b> : null}
                    {!missingReceipt && needsReview ? <b>, {transaction.reviewStatus.toLowerCase()}</b> : null}
                  </span>
                </td>
                <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{transaction.category}</td>
                <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{formatLongDate(transaction.date)}</td>
                <td className={ledger.hideOnPhone}>
                  {transaction.receipt ? <span className={ledger.muted}>Attached</span> : null}
                  {missingReceipt ? <b>Missing</b> : null}
                </td>
                <td className={ledger.hideOnPhone}>
                  {transaction.receipt ? (
                    <span className={reviewStatusClassName(transaction.reviewStatus)}>
                      {transaction.reviewStatus}
                    </span>
                  ) : null}
                </td>
                <td className={ledger.amount}>{formatAmount(transaction.amount)}</td>
                <td className={ledger.actions} onClick={(event) => event.stopPropagation()}>
                  <RowActionMenu
                    label={transaction.title}
                    canEdit={transaction.canEdit}
                    canDelete={transaction.canDelete}
                    onEdit={() => onEdit(transaction)}
                    onDelete={() => onDelete(transaction)}
                    onReceipt={transaction.receiptId ? () => onReviewReceipt(transaction) : undefined}
                    receiptLabel={receiptActionLabel(transaction)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className={ledger.tableWrap}>
        {renderTableContent()}
      </div>

      <footer className={ledger.pagination}>
        <span>
          <LoadingText loading={loading}>{rangeStart} to {rangeEnd} of {resultCount}</LoadingText>
        </span>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={loading ? () => undefined : onPageChange}
          className={ledger.pageButtons}
        />
      </footer>
    </>
  );
}
