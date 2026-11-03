"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  receiptFilterOptions,
  reviewFilterOptions,
  transactionTypeFilterOptions,
  type Category,
  type FilterType,
  type ReceiptFilter,
  type ReviewFilter,
} from "@/features/finance/transactions/view-model";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./transactions.module.css";

type TransactionFiltersDialogProps = {
  open: boolean;
  categoryOptions: readonly Category[];
  categories: Category[];
  types: FilterType[];
  minAmount: string;
  maxAmount: string;
  receiptFilter: ReceiptFilter;
  reviewFilter: ReviewFilter;
  onToggleCategory: (value: Category) => void;
  onToggleType: (value: FilterType) => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
  onReceiptFilterChange: (value: ReceiptFilter) => void;
  onReviewFilterChange: (value: ReviewFilter) => void;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
};

export function TransactionFiltersDialog({
  open,
  categoryOptions,
  categories,
  types,
  minAmount,
  maxAmount,
  receiptFilter,
  reviewFilter,
  onToggleCategory,
  onToggleType,
  onMinAmountChange,
  onMaxAmountChange,
  onReceiptFilterChange,
  onReviewFilterChange,
  onReset,
  onClose,
  onApply,
}: TransactionFiltersDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      overlayClassName={dlg.overlay}
      dialogClassName={dlg.modal}
      label="Filter transactions"
      onClose={onClose}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>Filter transactions</h2>
          <p>Filter the list.</p>
        </div>
        <button type="button" className={dlg.closeButton} onClick={onClose} aria-label="Close filters">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
        <div role="group" aria-label="Category" className={styles.filterRow}>
          <span>Category</span>
          <div className={styles.filterOptions}>
            {categoryOptions.map((value) => (
              <label className={styles.checkRow} key={value}>
                <input
                  type="checkbox"
                  checked={categories.includes(value)}
                  onChange={() => onToggleCategory(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Type" className={styles.filterRow}>
          <span>Type</span>
          <div className={styles.filterOptions}>
            {transactionTypeFilterOptions.map((value) => (
              <label className={styles.checkRow} key={value}>
                <input
                  type="checkbox"
                  checked={types.includes(value)}
                  onChange={() => onToggleType(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Amount" className={styles.filterRow}>
          <span>Amount</span>
          <div className={styles.filterOptions}>
            <input
              aria-label="Amount from"
              inputMode="decimal"
              value={minAmount}
              onChange={(event) => onMinAmountChange(event.target.value)}
              placeholder="From $0.00"
            />
            <input
              aria-label="Amount to"
              inputMode="decimal"
              value={maxAmount}
              onChange={(event) => onMaxAmountChange(event.target.value)}
              placeholder="To $0.00"
            />
          </div>
        </div>
        <div role="group" aria-label="Receipt status" className={styles.filterRow}>
          <span>Receipt</span>
          <div className={styles.segmented}>
            {receiptFilterOptions.map((value) => (
              <button
                type="button"
                key={value}
                className={receiptFilter === value ? styles.segmentActive : ""}
                onClick={() => onReceiptFilterChange(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Review status" className={styles.filterRow}>
          <span>Review</span>
          <div className={styles.segmented}>
            {reviewFilterOptions.map((value) => (
              <button
                type="button"
                key={value}
                className={reviewFilter === value ? styles.segmentActive : ""}
                onClick={() => onReviewFilterChange(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      <footer className={`${dlg.footer} ${dlg.footerSplit}`}>
        <button type="button" className={dlg.secondaryButton} onClick={onReset}>
          Reset
        </button>
        <div className={dlg.footerActions}>
          <button type="button" className={dlg.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={dlg.primaryButton} onClick={onApply}>
            Apply filters
          </button>
        </div>
      </footer>
    </Dialog>
  );
}
