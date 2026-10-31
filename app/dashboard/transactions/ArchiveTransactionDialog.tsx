"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import styles from "./transactions.module.css";

type ArchiveTransactionDialogProps = {
  reason: string;
  actionError: string;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onDismiss: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ArchiveTransactionDialog({
  reason,
  actionError,
  saving,
  onReasonChange,
  onDismiss,
  onCancel,
  onConfirm,
}: ArchiveTransactionDialogProps) {
  return (
    <Dialog
      overlayClassName={styles.overlay}
      dialogClassName={styles.modal}
      label="Archive transaction"
      onClose={onDismiss}
    >
      <div className={styles.modalHeader}>
        <div>
          <h2>Archive transaction?</h2>
          <p>It stays in the review log but no longer counts in totals.</p>
        </div>
        <button type="button" className={styles.iconButton} onClick={onCancel} disabled={saving} aria-label="Close dialog"><X /></button>
      </div>
      <div className={styles.modalBody}>
        <label className={styles.formField}>
          <span>Reason</span>
          <textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Why should the transaction be archived?" rows={3} autoFocus />
        </label>
        {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
      </div>
      <div className={styles.modalFooter}>
        <span />
        <div>
          <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className={styles.primaryButton} onClick={onConfirm} disabled={saving || !reason.trim()} aria-busy={saving}>{saving ? "Archiving" : "Archive"}</button>
        </div>
      </div>
    </Dialog>
  );
}
