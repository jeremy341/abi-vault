"use client";

import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import type { Category, Transaction } from "@/features/finance/transactions/view-model";
import { CashRegisterCombobox, StyledDropdown } from "./TransactionControls";
import styles from "./transactions.module.css";

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
      overlayClassName={styles.overlay}
      dialogClassName={styles.modal}
      label={heading}
      onClose={onClose}
    >
      <div className={styles.modalHeader}>
        <div>
          <h2>{heading}</h2>
          <p>
            {editing
              ? "The change will be recorded as a correction in the cash book."
              : "Record a new income or expense."}
          </p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          disabled={saving}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>

      <fieldset className={styles.modalBody} disabled={saving}>
        <legend className="sr-only">Transaction details</legend>
        <label className={styles.formField}>
          <span>Description</span>
          <input
            autoFocus={typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="e.g. Sponsorship"
          />
        </label>

        <div className={editing ? styles.editWalletNote : undefined}>
          <CashRegisterCombobox
            value={editing?.walletId ?? selectedCashRegisterId}
            options={cashRegisters}
            onChange={onCashRegisterChange}
          />
          {editing ? <small>The cash register of a posted transaction cannot be changed.</small> : null}
        </div>

        <div className={styles.dateFields}>
          <StyledDropdown
            ariaLabel="Select type"
            label="Type"
            value={type}
            onChange={(value) => {
              if (value === "Income" || value === "Expense") {
                onTypeChange(value);
              }
            }}
            className={styles.formDropdown}
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
            className={styles.formDropdown}
            options={categoryOptions}
          />
        </div>

        <label className={styles.formField}>
          <span>Amount</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0,00"
          />
        </label>

        {editing ? (
          <label className={styles.formField}>
            <span>Correction reason</span>
            <textarea
              value={correctionReason}
              onChange={(event) => onCorrectionReasonChange(event.target.value)}
              placeholder="e.g. the amount on the receipt was incorrect"
              rows={3}
            />
          </label>
        ) : null}
      </fieldset>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.modalFooter}>
        <span />
        <div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Saving" : editing ? "Save correction" : "Add"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
