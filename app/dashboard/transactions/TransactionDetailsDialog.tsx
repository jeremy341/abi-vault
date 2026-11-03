"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import { formatAmount, formatLongDate, type Transaction } from "@/features/finance/transactions/view-model";
import styles from "./transactions.module.css";

type TransactionDetailsDialogProps = {
  transaction: Transaction;
  onClose: () => void;
};

export function TransactionDetailsDialog({ transaction, onClose }: TransactionDetailsDialogProps) {
  return (
    <Dialog
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
      label="Transaction details"
      onClose={onClose}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>{transaction.title}</h2>
          <p>Transaction details</p>
        </div>
        <button type="button" className={dlg.closeButton} onClick={onClose} aria-label="Close details">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
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
      </div>
    </Dialog>
  );
}
