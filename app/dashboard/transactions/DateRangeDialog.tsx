"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";

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
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
      label="Select period"
      onClose={onClose}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>Select period</h2>
          <p>Set the period for the transaction list.</p>
        </div>
        <button type="button" className={dlg.closeButton} onClick={onClose} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
        <div className={dlg.formGrid}>
          <label className={dlg.field}>
            <span>From</span>
            <input type="date" value={start} onChange={(event) => onStartChange(event.target.value)} />
          </label>
          <label className={dlg.field}>
            <span>To</span>
            <input type="date" min={start} value={end} onChange={(event) => onEndChange(event.target.value)} />
          </label>
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
            Apply
          </button>
        </div>
      </footer>
    </Dialog>
  );
}
