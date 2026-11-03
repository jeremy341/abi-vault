"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";

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
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
      label="Archive transaction"
      onClose={onDismiss}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>Archive transaction?</h2>
          <p>It stays in the review log but no longer counts in totals.</p>
        </div>
        <button type="button" className={dlg.closeButton} onClick={onCancel} disabled={saving} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
        <label className={dlg.field}>
          <span>Reason</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Why should the transaction be archived?"
            rows={3}
            autoFocus
          />
        </label>
        {actionError ? <p className={dlg.error} role="alert">{actionError}</p> : null}
      </div>
      <footer className={dlg.footer}>
        <button type="button" className={dlg.secondaryButton} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className={dlg.destructiveButton}
          onClick={onConfirm}
          disabled={saving || !reason.trim()}
          aria-busy={saving}
        >
          {saving ? "Archiving" : "Archive"}
        </button>
      </footer>
    </Dialog>
  );
}
