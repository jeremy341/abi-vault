"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import type { Category, Transaction } from "@/features/finance/transactions/view-model";
import { CashRegisterCombobox, StyledDropdown } from "./TransactionControls";

type CashRegisterOption = { id: string; name: string };

type TransactionType = "Income" | "Expense";

type CategoryOption = { value: string; label: string };

type TransactionEditorDialogProps = {
  open: boolean;
  editing: Transaction | null;
  saving: boolean;
  error: string;
  title: string;
  amount: string;
  category: Category;
  type: TransactionType;
  correctionReason: string;
  selectedCashRegisterId: string;
  cashRegisters: CashRegisterOption[];
  categoryOptions: CategoryOption[];
  onTitleChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: Category) => void;
  onTypeChange: (value: TransactionType) => void;
  onCorrectionReasonChange: (value: string) => void;
  onCashRegisterChange: (walletId: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function TransactionEditorDialog({
  open,
  editing,
  saving,
  error,
  title,
  amount,
  category,
  type,
  correctionReason,
  selectedCashRegisterId,
  cashRegisters,
  categoryOptions,
  onTitleChange,
  onAmountChange,
  onCategoryChange,
  onTypeChange,
  onCorrectionReasonChange,
  onCashRegisterChange,
  onClose,
  onSave,
}: TransactionEditorDialogProps) {
  if (!open) return null;
  const heading = editing ? "Edit transaction" : "Add transaction";

  return (
    <Dialog
      overlayClassName={dlg.overlay}
      dialogClassName={dlg.modal}
      label={heading}
      onClose={onClose}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>{heading}</h2>
          <p>
            {editing
              ? "The change will be recorded as a correction in the cash book."
              : "Record a new income or expense."}
          </p>
        </div>
        <button type="button" className={dlg.closeButton} onClick={onClose} disabled={saving} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
      </header>

      <fieldset className={dlg.body} disabled={saving}>
        <legend className="sr-only">Transaction details</legend>
        <label className={dlg.field}>
          <span>Description</span>
          <input
            autoFocus={typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="e.g. Sponsorship"
          />
        </label>

        <div className={dlg.cell}>
          <CashRegisterCombobox
            value={editing?.walletId ?? selectedCashRegisterId}
            options={cashRegisters}
            onChange={onCashRegisterChange}
          />
          {editing ? <small className={dlg.hint}>The cash register of a posted transaction cannot be changed.</small> : null}
        </div>

        <div className={dlg.formGrid}>
          <StyledDropdown
            ariaLabel="Select type"
            label="Type"
            value={type}
            onChange={(value) => {
              if (value === "Income" || value === "Expense") {
                onTypeChange(value);
              }
            }}
            className={dlg.cell}
            options={[
              { value: "Income", label: "Income" },
              { value: "Expense", label: "Expense" },
            ]}
          />
          <StyledDropdown
            ariaLabel="Select category"
            label="Category"
            value={category}
            onChange={onCategoryChange}
            className={dlg.cell}
            options={categoryOptions}
          />
        </div>

        <label className={dlg.field}>
          <span>Amount</span>
          <div className={dlg.amountField}>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
            />
            <span>$</span>
          </div>
        </label>

        {editing ? (
          <label className={dlg.field}>
            <span>Correction reason</span>
            <textarea
              value={correctionReason}
              onChange={(event) => onCorrectionReasonChange(event.target.value)}
              placeholder="e.g. the amount on the receipt was incorrect"
              rows={3}
            />
          </label>
        ) : null}

        {error ? <p className={dlg.error} role="alert">{error}</p> : null}
      </fieldset>

      <footer className={dlg.footer}>
        <button type="button" className={dlg.secondaryButton} onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="button" className={dlg.primaryButton} onClick={onSave} disabled={saving} aria-busy={saving}>
          {saving ? "Saving" : editing ? "Save correction" : "Add"}
        </button>
      </footer>
    </Dialog>
  );
}
