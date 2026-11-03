import dialogStyles from "@/components/dashboard/dialog.module.css";

type DirectAmountPanelProps = {
  amountInput: string;
  hasError: boolean;
  onAmountChange: (value: string) => void;
};

export default function DirectAmountPanel({ amountInput, hasError, onAmountChange }: DirectAmountPanelProps) {
  return (
    <div id="count-direct-panel" role="tabpanel" aria-label="Total amount">
      <label className={dialogStyles.field}>
        <span>Counted amount</span>
        <div className={dialogStyles.amountField}>
          <input
            name="countedAmount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            aria-invalid={hasError}
            aria-describedby="count-form-error"
            value={amountInput}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.00"
          />
          <span>$</span>
        </div>
      </label>
    </div>
  );
}
