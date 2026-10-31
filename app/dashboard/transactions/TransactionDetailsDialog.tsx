"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { formatAmount, formatLongDate, type Transaction } from "@/features/finance/transactions/view-model";
import styles from "./transactions.module.css";

type TransactionDetailsDialogProps = {
  transaction: Transaction;
  onClose: () => void;
};

export function TransactionDetailsDialog({ transaction, onClose }: TransactionDetailsDialogProps) {
  return (
    <Dialog
      overlayClassName={styles.overlay}
      dialogClassName={styles.modal}
      label="Transaction details"
      onClose={onClose}
    >
      <div className={styles.modalHeader}>
        <div>
          <h2>{transaction.title}</h2>
          <p>Transaction details</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Close details"
        >
          <X />
        </button>
      </div>
      <div className={styles.detailGrid}>
        <span>Category</span>
        <strong>{transaction.category}</strong>
        <span>Date</span>
        <strong>{formatLongDate(transaction.date)}</strong>
        <span>Amount</span>
        <strong>{formatAmount(transaction.amount)}</strong>
        <span>Receipt</span>
        <strong>{transaction.receipt ?? "No receipt"}</strong>
      </div>
    </Dialog>
  );
}
