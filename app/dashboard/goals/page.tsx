"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./goals.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { getDashboardSnapshot, type DashboardResult } from "@/features/finance/actions/queries";
import { createGoal } from "@/features/goals/actions/goals";
import { archiveGoal, updateGoal } from "@/features/goals/actions/goal-mutations";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";

type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  progress: number;
  date: string;
  deadline: string;
};

type DashboardGoal = Extract<DashboardResult, { ok: true }>["goals"][number];

type DashboardData = Extract<DashboardResult, { ok: true }>;

const emptyGoals: Goal[] = [];

const displayGoalDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const dollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dollarPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function toGoal(goal: DashboardGoal): Goal {
  const target = Number(goal.target_amount_minor) / 100;
  const saved = Number(goal.saved_amount_minor) / 100;

  return {
    id: goal.id,
    title: goal.title,
    target,
    saved,
    progress: target ? Math.round((saved / target) * 100) : 0,
    date: displayGoalDate(goal.deadline),
    deadline: goal.deadline,
  };
}

function goalsFromDashboard(data: DashboardData) {
  return data.goals.map(toGoal);
}

type GoalSummaryProps = {
  loading: boolean;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  onAddGoal: () => void;
};

function GoalSummary({ loading, totalSaved, totalTarget, overallProgress, onAddGoal }: GoalSummaryProps) {
  return (
    <div className={ledger.summary}>
      <dl className={ledger.figures}>
        <div>
          <dt>Saved</dt>
          <dd><LoadingText loading={loading}>{dollar.format(totalSaved)}</LoadingText></dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd><LoadingText loading={loading}>{dollar.format(totalTarget)}</LoadingText></dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd><LoadingText loading={loading}>{overallProgress}%</LoadingText></dd>
        </div>
      </dl>
      <button type="button" className={ledger.primaryButton} onClick={onAddGoal} disabled={loading}>
        Add goal
      </button>
    </div>
  );
}

type GoalListProps = {
  goals: Goal[];
  loading: boolean;
  onAddGoal: () => void;
  onEditGoal: (goal: Goal, index: number) => void;
};

function GoalList({ goals, loading, onAddGoal, onEditGoal }: GoalListProps) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Goals</h2>
        <p><LoadingText loading={loading}>{goals.length} active</LoadingText></p>
      </header>
      <div>
        <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="10rem" label="Loading goals">
          {goals.length ? (
            <ul className={ledger.list}>
              {goals.map((goal, index) => (
                <li key={goal.id}>
                  <button type="button" className={ledger.rowButton} onClick={() => onEditGoal(goal, index)}>
                    <span className={ledger.rowTitle}>
                      <span>{goal.title}</span>
                      <span className={ledger.rowMeta}>By {goal.date}</span>
                    </span>
                    <span className={ledger.line} role="presentation">
                      <i style={{ width: `${Math.min(100, goal.progress)}%` }} />
                    </span>
                    <span className={ledger.rowEnd}>
                      <span>{dollarPrecise.format(goal.saved)} of {dollar.format(goal.target)}</span>
                      <span className={ledger.rowMeta}>{goal.progress}%, {dollarPrecise.format(Math.max(0, goal.target - goal.saved))} to go</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={ledger.empty}>
              No goals yet.{" "}
              <button type="button" className={ledger.textButton} onClick={onAddGoal}>Add one</button>
            </p>
          )}
        </LoadingCollection>
      </div>
    </section>
  );
}

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

function GoalForm({
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

export default function GoalsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const { data: dashboard, loading, failed } = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);
  const loadError = failed ? "The goals could not be loaded." : "";
  const [goals, setGoals] = useQueryBackedState(
    dashboard?.ok ? dashboard : null,
    goalsFromDashboard,
    emptyGoals,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const editingGoal = editingGoalIndex === null ? null : goals[editingGoalIndex] ?? null;
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const overallProgress = totalTarget ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const previewTarget = Number(targetAmount.replace(",", ".")) || 0;
  const previewSaved = editingGoal?.saved ?? 0;
  const previewProgress = previewTarget ? Math.min(100, Math.round((previewSaved / previewTarget) * 100)) : 0;

  function resetForm() {
    idempotencyKey.current = null;
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
    setFormError("");
  }

  function closeModal() {
    resetForm();
    setModalOpen(false);
    setEditingGoalIndex(null);
  }

  function openAddModal() {
    resetForm();
    setEditingGoalIndex(null);
    setModalOpen(true);
  }

  function openEditModal(goal: Goal, index: number) {
    idempotencyKey.current = null;
    setEditingGoalIndex(index);
    setGoalName(goal.title);
    setTargetAmount(goal.target.toString());
    setDeadline(goal.deadline);
    setFormError("");
    setModalOpen(true);
  }

  function changeField(update: () => void) {
    idempotencyKey.current = null;
    update();
    setFormError("");
  }

  async function handleSaveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;
    setSaving(true);
    setFormError("");

    try {
      const formData = new FormData(event.currentTarget);
      const submittedName = String(formData.get("goalName") ?? "").trim();
      const submittedDeadline = String(formData.get("deadline") ?? "");
      const submittedTargetAmount = String(formData.get("targetAmount") ?? "");
      const target = Number(submittedTargetAmount.replace(",", "."));

      if (!submittedName || !Number.isFinite(target) || target <= 0 || !submittedDeadline) {
        setFormError("Complete the name, target amount, and target date.");

        return;
      }

      const [year, month, day] = submittedDeadline.split("-");
      const formattedDate = displayGoalDate(`${year}-${month}-${day}`);
      const saved = editingGoal?.saved ?? 0;
      const progress = target ? Math.round((saved / target) * 100) : 0;

      if (editingGoalIndex !== null) {
        const currentGoal = goals[editingGoalIndex];

        if (!currentGoal) {
          setFormError("This goal is no longer available.");

          return;
        }

        const result = await updateGoal({
          goalId: currentGoal.id,
          title: submittedName,
          description: null,
          targetAmount: submittedTargetAmount,
          deadline: submittedDeadline,
          reason: "Goal updated in the goal dialog",
        });

        if (!result.ok) {
          setFormError(result.error.message);

          return;
        }

        setGoals((current) =>
          current.map((goal) =>
            goal.id === currentGoal.id
              ? {
                  ...goal,
                  title: submittedName,
                  target,
                  saved: currentGoal.saved,
                  progress,
                  date: formattedDate,
                  deadline: submittedDeadline,
                }
              : goal,
          ),
        );
      } else {
        const requestKey = idempotencyKey.current ?? `goal-${crypto.randomUUID()}`;
        idempotencyKey.current = requestKey;
        const result = await createGoal({
          title: submittedName,
          description: null,
          targetAmount: submittedTargetAmount,
          deadline: submittedDeadline,
          visibility: "private",
          idempotencyKey: requestKey,
        });

        if (!result.success) {
          setFormError(result.error.message);

          return;
        }

        setGoals((current) => [
          ...current,
          {
            id: result.data.id,
            title: submittedName,
            target,
            saved: 0,
            progress: 0,
            date: formattedDate,
            deadline: submittedDeadline,
          },
        ]);
      }

      invalidateFinanceQuery("goals", "dashboard-snapshot", "report-snapshot");
      closeModal();
    } catch {
      setFormError("The goal could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal() {
    if (editingGoalIndex === null || saving) return;
    const currentGoal = goals[editingGoalIndex];

    if (!currentGoal) {
      setFormError("This goal is no longer available.");

      return;
    }

    setSaving(true);

    try {
      const result = await archiveGoal({
        goalId: currentGoal.id,
        reason: "Goal archived in the goal dialog",
      });

      if (!result.ok) {
        setFormError(result.error.message);

        return;
      }

      setGoals((current) => current.filter((_, index) => index !== editingGoalIndex));
      invalidateFinanceQuery("goals", "dashboard-snapshot", "report-snapshot");
      closeModal();
    } catch {
      setFormError("The goal could not be archived.");
    } finally {
      setSaving(false);
    }
  }

  const isEditing = editingGoalIndex !== null;

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading goals" />
      {loadError ? <LoadError message={loadError} /> : null}

      <GoalSummary
        loading={loading}
        totalSaved={totalSaved}
        totalTarget={totalTarget}
        overallProgress={overallProgress}
        onAddGoal={openAddModal}
      />

      <GoalList
        goals={goals}
        loading={loading}
        onAddGoal={openAddModal}
        onEditGoal={openEditModal}
      />

      {modalOpen && (
        <Dialog
          label={isEditing ? "Edit goal" : "Add goal"}
          onClose={closeModal}
          overlayClassName={dlg.overlay}
          dialogClassName={dlg.modal}
        >
          <GoalForm
            isEditing={isEditing}
            goalName={goalName}
            targetAmount={targetAmount}
            deadline={deadline}
            previewSaved={previewSaved}
            previewTarget={previewTarget}
            previewProgress={previewProgress}
            formError={formError}
            saving={saving}
            onSubmit={handleSaveGoal}
            onClose={closeModal}
            onDelete={handleDeleteGoal}
            onGoalNameChange={(value) => changeField(() => setGoalName(value))}
            onTargetAmountChange={(value) => changeField(() => setTargetAmount(value))}
            onDeadlineChange={(value) => changeField(() => setDeadline(value))}
          />
        </Dialog>
      )}
    </section>
  );
}
