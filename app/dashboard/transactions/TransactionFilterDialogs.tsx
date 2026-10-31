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
import styles from "./transactions.module.css";

type DateRangeDialogProps = {
  open: boolean;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
};

export function DateRangeDialog({
  open,
  start,
  end,
  onStartChange,
  onEndChange,
  onReset,
  onClose,
  onApply,
}: DateRangeDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      overlayClassName={styles.overlay}
      dialogClassName={styles.modal}
      label="Select period"
      onClose={onClose}
    >
      <div className={styles.modalHeader}>
        <div>
          <h2>Select period</h2>
          <p>Set the period for the transaction list.</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>
      <div className={styles.modalBody}>
        <div className={styles.dateFields}>
          <label className={styles.formField}>
            <span>From</span>
            <input
              type="date"
              value={start}
              onChange={(event) => onStartChange(event.target.value)}
            />
          </label>
          <label className={styles.formField}>
            <span>To</span>
            <input
              type="date"
              min={start}
              value={end}
              onChange={(event) => onEndChange(event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onReset}
        >
          Reset
        </button>
        <div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function receiptFilterLabel(value: ReceiptFilter) {
  if (value === "Vorhanden") {
    return "Present";
  }

  if (value === "Fehlt") {
    return "Missing";
  }

  return value;
}

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
      overlayClassName={styles.overlay}
      dialogClassName={`${styles.modal} ${styles.filterModal}`}
      label="Filter transactions"
      onClose={onClose}
    >
      <div className={styles.modalHeader}>
        <div>
          <h2>Filter transactions</h2>
          <p>Filter the list.</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Close filters"
        >
          <X />
        </button>
      </div>
      <div className={`${styles.modalBody} ${styles.filterModalBody}`}>
        <div className={styles.filterColumns}>
          <fieldset className={styles.filterGroup}>
            <legend>Category</legend>
            {categoryOptions.map((value) => (
              <label className={styles.checkRow} key={value}>
                <input
                  type="checkbox"
                  checked={categories.includes(value)}
                  onChange={() => onToggleCategory(value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.filterGroup}>
            <legend>Type</legend>
            {transactionTypeFilterOptions.map((value) => (
              <label className={styles.checkRow} key={value}>
                <input
                  type="checkbox"
                  checked={types.includes(value)}
                  onChange={() => onToggleType(value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className={styles.modalSection}>
          <span className={styles.modalSectionLabel}>Amount</span>
          <div className={styles.dateFields}>
            <label className={styles.inlineField}>
              <span>From</span>
              <input
                aria-label="Amount from"
                inputMode="decimal"
                value={minAmount}
                onChange={(event) => onMinAmountChange(event.target.value)}
                placeholder="$0.00"
              />
            </label>
            <label className={styles.inlineField}>
              <span>To</span>
              <input
                aria-label="Amount to"
                inputMode="decimal"
                value={maxAmount}
                onChange={(event) => onMaxAmountChange(event.target.value)}
                placeholder="$0.00"
              />
            </label>
          </div>
        </div>
        <div className={styles.filterColumns}>
          <fieldset className={styles.filterGroup}>
            <legend>Receipt status</legend>
            <div className={styles.segmented}>
              {receiptFilterOptions.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={receiptFilter === value ? styles.segmentActive : ""}
                  onClick={() => onReceiptFilterChange(value)}
                >
                  {receiptFilterLabel(value)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.filterGroup}>
            <legend>Review status</legend>
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
          </fieldset>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onReset}
        >
          Reset
        </button>
        <div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onApply}
          >
            Apply filters
          </button>
        </div>
      </div>
    </Dialog>
  );
}
