"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
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
