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
  longDate,
  type Receipt,
} from "@/features/receipts/view-model";
import ledger from "../ledger.module.css";

type ReceiptsTableProps = {
  loading: boolean;
  loadError: string;
  itemCount: number;
  visible: Receipt[];
  resultCount: number;
  rangeStart: number;
  rangeEnd: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onEdit: (receipt: Receipt) => void;
  onDelete: (receipt: Receipt) => void;
  onReview: (receipt: Receipt) => void;
};

function statusClassName(status: Receipt["status"]) {
  if (status === "Approved") return ledger.muted;

  if (status === "Invalid") return ledger.invalid;

  return ledger.attention;
}

export function ReceiptsTable({
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
  onEdit,
  onDelete,
  onReview,
}: ReceiptsTableProps) {
  function renderTableBody() {
    if (loading) {
      return (
        <LoadingCollection
          loading
          knownItemCount={itemCount}
          emptyHeight="14rem"
          label="Loading receipts"
        >
          <div />
        </LoadingCollection>
      );
    }

    if (loadError) return null;

    if (!visible.length) {
      return (
        <EmptyState
          title="No receipts found"
          description="Change the search or reset the filters."
          action={<button type="button" onClick={onResetFilters}>Reset filters</button>}
        />
      );
    }

    return (
      <table className={ledger.table}>
        <thead>
          <tr>
            <th scope="col">Receipt</th>
            <th scope="col" className={ledger.hideOnPhone}>Transaction</th>
            <th scope="col" className={ledger.hideOnPhone}>Date</th>
            <th scope="col" className={ledger.amount}>Amount</th>
            <th scope="col" className={ledger.hideOnPhone}>Status</th>
            <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((receipt) => (
            <tr key={receipt.id}>
              <td>
                <span className={ledger.title}>{receipt.file}</span>
                <span className={ledger.rowMeta}>Uploaded by {receipt.uploadedByName}</span>
                <span className={ledger.phoneMeta}>
                  {receipt.transaction}, {longDate(receipt.date)}
                  {receipt.status !== "Approved" ? <b>, {receipt.status.toLowerCase()}</b> : null}
                </span>
              </td>
              <td className={ledger.hideOnPhone}>{receipt.transaction}</td>
              <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{longDate(receipt.date)}</td>
              <td className={ledger.amount}>{receipt.status === "Unassigned" ? "" : formatAmount(receipt.amount)}</td>
              <td className={ledger.hideOnPhone}>
                <span className={statusClassName(receipt.status)}>
                  {receipt.status}
                </span>
              </td>
              <td className={ledger.actions}>
                <RowActionMenu
                  label={receipt.file}
                  canEdit={receipt.canEdit}
                  canDelete={receipt.canDelete}
                  onEdit={() => onEdit(receipt)}
                  onDelete={() => onDelete(receipt)}
                  onReceipt={() => onReview(receipt)}
                  receiptLabel={receipt.status === "Pending review" ? "Review receipt" : "View receipt"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className={ledger.tableWrap}>
        {renderTableBody()}
      </div>

      <footer className={ledger.pagination}>
        <span>
          <LoadingText loading={loading}>
            {resultCount ? `${rangeStart} to ${rangeEnd} of ${resultCount}` : "0 of 0"}
          </LoadingText>
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
