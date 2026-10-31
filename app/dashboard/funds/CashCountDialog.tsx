"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import { calculateCashDenominationMinor } from "@/lib/finance/cash-count";
import { parseDollarToMinor } from "@/lib/finance/money";
import styles from "./funds.module.css";

export type CashBox = {
  id: string;
  name: string;
  balance: number;
  responsible: string;
  lastCountDate: string;
  countStatus: "matched" | "discrepancy";
  difference: number;
};

export type CashCountInput = {
  countedAmount: number;
  countedBy: string;
  note: string;
  idempotencyKey: string;
};

export type SaveCashCountResult =
  | { success: true }
  | { success: false; message: string };

type CashCountDialogProps = {
  cashBox: CashBox;
  formatMoney: (value: number) => string;
  onClose: () => void;
  onSave: (input: CashCountInput) => Promise<SaveCashCountResult>;
};

type CountMode = "direct" | "calculator";

const denominations = [
  ["50", "$50 bills"],
  ["20", "$20 bills"],
  ["10", "$10 bills"],
  ["5", "$5 bills"],
  ["2", "$2 coins"],
  ["1", "$1 coins"],
  ["0.5", "$0.50 coins"],
  ["0.2", "$0.20 coins"],
  ["0.1", "$0.10 coins"],
] as const;

function parseDirectAmountMinor(input: string) {
  try {
    return parseDollarToMinor(input);
  } catch {
    return null;
  }
}

export default function CashCountDialog({
  cashBox,
  formatMoney,
  onClose,
  onSave,
}: CashCountDialogProps) {
  const [countMode, setCountMode] = useState<CountMode>("direct");

  const [countedAmountInput, setCountedAmountInput] = useState(() =>
    cashBox.balance.toFixed(2).replace(".", ","),
  );

  const [countedBy, setCountedBy] = useState(cashBox.responsible);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  const [denominationCounts, setDenominationCounts] = useState<Record<string, number>>({
    "50": 0,
    "20": 0,
    "10": 0,
    "5": 0,
    "2": 0,
    "1": 0,
    "0.5": 0,
    "0.2": 0,
    "0.1": 0,
  });

  const denominationTotalMinor = calculateCashDenominationMinor(denominationCounts);
  const directAmountMinor = parseDirectAmountMinor(countedAmountInput);

  let countedAmount = 0;

  if (countMode === "calculator") {
    countedAmount = Number(denominationTotalMinor) / 100;
  } else if (directAmountMinor !== null) {
    countedAmount = Number(directAmountMinor) / 100;
  }

  const difference = countedAmount - cashBox.balance;

  function handleModeKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, currentMode: CountMode) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();

    const nextMode = currentMode === "direct" ? "calculator" : "direct";
    const nextTabIndex = nextMode === "direct" ? 0 : 1;

    setCountMode(nextMode);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [nextTabIndex]?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const isInvalidDirectAmount = directAmountMinor === null && countMode === "direct";

    if (isInvalidDirectAmount || countedAmount < 0) {
      setError("Enter a valid counted amount.");

      const form = event.currentTarget;

      window.requestAnimationFrame(() => {
        const field = form.elements.namedItem("countedAmount");

        if (field instanceof HTMLInputElement) field.focus();
      });

      return;
    }

    setSaving(true);

    try {
      if (idempotencyKey.current === null) {
        idempotencyKey.current = `count-${cashBox.id}-${crypto.randomUUID()}`;
      }

      const result = await onSave({
        countedAmount,
        countedBy: countedBy.trim(),
        note: note.trim(),
        idempotencyKey: idempotencyKey.current,
      });

      if (!result.success) {
        setError(result.message);

        return;
      }

      idempotencyKey.current = null;
      onClose();
    } catch {
      setError("The cash count could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function handleDialogClose() {
    if (!saving) onClose();
  }

  return (
    <Dialog
      label="Record cash count"
      onClose={handleDialogClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalWide}`}
    >
      <form onSubmit={handleSubmit} noValidate>
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2>Record cash count</h2>
            <p>Count the cash and compare it with the book balance.</p>
          </div>
          <button
            type="button"
            className={dlg.closeButton}
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={dlg.body}>
          <div className={styles.modeTabs} role="tablist" aria-label="Counting method">
            <button
              type="button"
              role="tab"
              aria-selected={countMode === "direct"}
              aria-controls="count-direct-panel"
              tabIndex={countMode === "direct" ? 0 : -1}
              onKeyDown={(event) => handleModeKeyDown(event, "direct")}
              onClick={() => setCountMode("direct")}
            >
              Total amount
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={countMode === "calculator"}
              aria-controls="count-calculator-panel"
              tabIndex={countMode === "calculator" ? 0 : -1}
              onKeyDown={(event) => handleModeKeyDown(event, "calculator")}
              onClick={() => setCountMode("calculator")}
            >
              Denominations
            </button>
          </div>

          {countMode === "direct" ? (
            <div id="count-direct-panel" role="tabpanel" aria-label="Total amount">
              <label className={dlg.field}>
                <span>Counted amount</span>
                <div className={dlg.amountField}>
                  <input
                    name="countedAmount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby="count-form-error"
                    value={countedAmountInput}
                    onChange={(event) => setCountedAmountInput(event.target.value)}
                    placeholder="0.00"
                  />
                  <span>$</span>
                </div>
              </label>
            </div>
          ) : (
            <div
              id="count-calculator-panel"
              className={styles.denominationGrid}
              role="tabpanel"
              aria-label="Denominations"
            >
              {denominations.map(([value, label]) => (
                <label className={styles.denominationItem} key={value}>
                  <span>{label}</span>
                  <input
                    name={`denomination-${value}`}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    autoComplete="off"
                    value={denominationCounts[value] || ""}
                    onChange={(event) =>
                      setDenominationCounts((current) => ({
                        ...current,
                        [value]: Number.parseInt(event.target.value, 10) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                  <output className={styles.denominationTotal}>
                    {formatMoney((denominationCounts[value] || 0) * Number(value))}
                  </output>
                </label>
              ))}
            </div>
          )}

          <div className={dlg.formGrid}>
            <label className={dlg.field}>
              <span>Counted by</span>
              <input
                name="auditor"
                type="text"
                autoComplete="off"
                required
                value={countedBy}
                onChange={(event) => setCountedBy(event.target.value)}
                placeholder="Name of the person checking"
              />
            </label>
            <label className={dlg.field}>
              <span>Note or reason</span>
              <input
                name="countNote"
                type="text"
                autoComplete="off"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="For example, cake sale"
              />
            </label>
          </div>

          <dl className={styles.countPreview} aria-label="Count preview">
            <div>
              <dt>Book balance</dt>
              <dd>{formatMoney(cashBox.balance)}</dd>
            </div>
            <div>
              <dt>Counted</dt>
              <dd className="total-rule">{formatMoney(countedAmount)}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd className={Math.abs(difference) < 0.01 ? styles.positive : styles.negative}>
                {difference > 0 ? "+" : ""}{formatMoney(difference)}
              </dd>
            </div>
          </dl>

          {error ? <p id="count-form-error" className={dlg.error} role="alert">{error}</p> : null}
        </div>

        <footer className={dlg.footer}>
          <button type="button" className={dlg.secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
            {saving ? "Saving" : "Save cash count"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
