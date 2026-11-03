import { X } from "lucide-react";
import dlg from "@/components/dashboard/dialog.module.css";
import ledger from "../ledger.module.css";
import styles from "./goals.module.css";
import { dollarPrecise } from "./goals-format";

type GoalFormProps = {
  isEditing: boolean;
  goalName: string;
  targetAmount: string;
  deadline: string;
  previewSaved: number;
  previewTarget: number;
  previewProgress: number;
  formError: string;
  saving: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  onDelete: () => void;
  onGoalNameChange: (value: string) => void;
  onTargetAmountChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
};

export function GoalForm({
  isEditing,
  goalName,
  targetAmount,
  deadline,
  previewSaved,
  previewTarget,
  previewProgress,
  formError,
  saving,
  onSubmit,
  onClose,
  onDelete,
  onGoalNameChange,
  onTargetAmountChange,
  onDeadlineChange,
}: GoalFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>{isEditing ? "Edit goal" : "Add goal"}</h2>
          <p>
            {isEditing
              ? "Change the name, target amount, or target date of this goal."
              : "Set a shared savings goal for the class."}
          </p>
        </div>
        <button
          type="button"
          className={dlg.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={dlg.body}>
        <div className={dlg.formGrid}>
          <label className={`${dlg.field} ${dlg.formFull}`}>
            <span>Goal name</span>
            <input
              name="goalName"
              autoComplete="off"
              value={goalName}
              maxLength={30}
              onChange={(event) => onGoalNameChange(event.target.value)}
              placeholder="For example, class trip"
            />
          </label>

          <label className={dlg.field}>
            <span>Target amount</span>
            <div className={dlg.amountField}>
              <input
                name="targetAmount"
                inputMode="decimal"
                autoComplete="off"
                value={targetAmount}
                onChange={(event) => onTargetAmountChange(event.target.value)}
                placeholder="0.00"
              />
              <span>$</span>
            </div>
          </label>

          <div className={dlg.field}>
            <span>Already saved</span>
            <output className={dlg.input}>{dollarPrecise.format(previewSaved)}</output>
            <small>Read from recorded contributions.</small>
          </div>

          <label className={`${dlg.field} ${dlg.formFull}`}>
            <span>Target date</span>
            <input
              name="deadline"
              type="date"
              value={deadline}
              onChange={(event) => onDeadlineChange(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.progressPreview} role="group" aria-label="Progress">
          <span className={ledger.line} role="presentation">
            <i style={{ width: `${previewProgress}%` }} />
          </span>
          <p>
            {dollarPrecise.format(previewSaved)} of{" "}
            {dollarPrecise.format(previewTarget)}, {previewProgress}%
          </p>
        </div>

        {formError ? (
          <p className={dlg.error} role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <footer className={`${dlg.footer} ${isEditing ? dlg.footerSplit : ""}`}>
        {isEditing ? (
          <button
            type="button"
            className={dlg.destructiveButton}
            onClick={onDelete}
            disabled={saving}
          >
            Archive goal
          </button>
        ) : null}

        <div className={dlg.footerActions}>
          <button
            type="button"
            className={dlg.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
            {saving ? "Saving" : isEditing ? "Save changes" : "Add goal"}
          </button>
        </div>
      </footer>
    </form>
  );
}
