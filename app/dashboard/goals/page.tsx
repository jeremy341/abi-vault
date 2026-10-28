"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function GoalsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const { data: dashboard, loading, failed } = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);
  const loadError = failed ? "The goals could not be loaded." : "";

  const [goals, setGoals] = useState<Goal[]>(() => (dashboard?.ok ? dashboard.goals.map(toGoal) : []));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (!dashboard?.ok) return;

    setGoals(dashboard.goals.map(toGoal));
  }, [dashboard]);

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.target, 0),
    [goals],
  );

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.saved, 0),
    [goals],
  );

  const overallProgress = totalTarget
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0;

  const previewTarget = Number(targetAmount.replace(",", ".")) || 0;
  const previewSaved = Number(savedAmount.replace(",", ".")) || 0;

  const previewProgress = previewTarget
    ? Math.min(100, Math.round((previewSaved / previewTarget) * 100))
    : 0;

  function closeModal() {
    setModalOpen(false);
    setEditingGoalIndex(null);
    setGoalName("");
    setTargetAmount("");
    setSavedAmount("");
    setDeadline("");
    setFormError("");
  }

  function openAddModal() {
    setEditingGoalIndex(null);
    setGoalName("");
    setTargetAmount("");
    setSavedAmount("");
    setDeadline("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(goal: Goal, index: number) {
    setEditingGoalIndex(index);
    setGoalName(goal.title);
    setTargetAmount(goal.target.toString());
    setSavedAmount(goal.saved.toString());

    setDeadline(goal.deadline);

    setFormError("");
    setModalOpen(true);
  }

  async function handleSaveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;
    setSaving(true);
    setFormError("");
    idempotencyKey.current ??= `goal-${crypto.randomUUID()}`;

    try {
      const formData = new FormData(event.currentTarget);
      const submittedName = String(formData.get("goalName") ?? "").trim();
      const submittedDeadline = String(formData.get("deadline") ?? "");
      const submittedTargetAmount = String(formData.get("targetAmount") ?? "");
      const submittedSavedAmount = String(formData.get("savedAmount") ?? "");
      const target = Number(submittedTargetAmount.replace(",", "."));
      const saved = Number(submittedSavedAmount.replace(",", ".")) || 0;

      if (!submittedName || !target || target <= 0 || !submittedDeadline) {
        setFormError(
          "Complete the name, target amount, and target date.",
        );

        return;
      }

      if (saved < 0 || saved > target) {
        setFormError(
          "The amount already saved must be between $0 and the target amount.",
        );

        return;
      }

      const [year, month, day] = submittedDeadline.split("-");
      const formattedDate = displayGoalDate(`${year}-${month}-${day}`);
      const progress = Math.round((saved / target) * 100);

      if (editingGoalIndex !== null) {
        const currentGoal = goals[editingGoalIndex];

        if (currentGoal && /^[0-9a-f-]{36}$/i.test(currentGoal.id)) {
          const result = await updateGoal({
            goalId: currentGoal.id,
            title: submittedName,
            description: null,
            targetAmount: submittedTargetAmount,
            deadline: submittedDeadline,
            reason: "Goal updated in the goal dialog",
          });

          if (!result.ok) {
            setFormError("The goal could not be saved.");

            return;
          }
        }

        setGoals((current) =>
          current.map((goal, index) =>
            index === editingGoalIndex
              ? {
                id: goal.id,
                title: submittedName,
                target,
                saved,
                progress,
                date: formattedDate,
                deadline: submittedDeadline,
              }
              : goal,
          ),
        );
      } else {
        const result = await createGoal({
          title: submittedName,
          description: null,
          targetAmount: submittedTargetAmount,
          deadline: submittedDeadline,
          visibility: "private",
          idempotencyKey: idempotencyKey.current,
        });

        if (!result.success) {
          setFormError("The goal could not be saved.");

          return;
        }

        setGoals((current) => [
          ...current,
          {
            id: result.data.id,
            title: submittedName,
            target,
            saved,
            progress,
            date: formattedDate,
            deadline: submittedDeadline,
          },
        ]);
      }

      invalidateFinanceQuery("goals", "dashboard-snapshot", "report-snapshot");
      idempotencyKey.current = null;
      closeModal();
    } catch {
      setFormError("The goal could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal() {
    if (editingGoalIndex === null || saving) return;
    setSaving(true);

    try {
      const currentGoal = goals[editingGoalIndex];

      if (/^[0-9a-f-]{36}$/i.test(currentGoal.id)) {
        const result = await archiveGoal({
          goalId: currentGoal.id,
          reason: "Goal archived in the goal dialog",
        });

        if (!result.ok) {
          setFormError("The goal could not be archived.");

          return;
        }
      }

      setGoals((current) => current.filter((_, index) => index !== editingGoalIndex));
      invalidateFinanceQuery("goals", "dashboard-snapshot", "report-snapshot");
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${ledger.page}`} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading goals" />
      {loadError ? <LoadError message={loadError} /> : null}

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
        <button type="button" className={ledger.primaryButton} onClick={openAddModal} disabled={loading}>
          Add goal
        </button>
      </div>

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
                    <button type="button" className={ledger.rowButton} onClick={() => openEditModal(goal, index)}>
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
                <button type="button" className={ledger.textButton} onClick={openAddModal}>Add one</button>
              </p>
            )}
          </LoadingCollection>
        </div>
      </section>

      {modalOpen && (
        <Dialog
          label={editingGoalIndex !== null ? "Edit goal" : "Add goal"}
          onClose={closeModal}
          overlayClassName={dlg.overlay}
          dialogClassName={dlg.modal}
        >
          <form onSubmit={handleSaveGoal} noValidate>
            <header className={dlg.header}>
              <div className={dlg.heading}>
                <h2>{editingGoalIndex !== null ? "Edit goal" : "Add goal"}</h2>
                <p>
                  {editingGoalIndex !== null
                    ? "Change the name, amounts or target date of this goal."
                    : "Set a shared savings goal for the class."}
                </p>
              </div>
              <button
                type="button"
                className={dlg.closeButton}
                onClick={closeModal}
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
                    onChange={(event) => {
                      setGoalName(event.target.value);
                      setFormError("");
                    }}
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
                      onChange={(event) => {
                        setTargetAmount(event.target.value);
                        setFormError("");
                      }}
                      placeholder="0.00"
                    />
                    <span>$</span>
                  </div>
                </label>

                <label className={dlg.field}>
                  <span>Already saved</span>
                  <div className={dlg.amountField}>
                    <input
                      name="savedAmount"
                      inputMode="decimal"
                      autoComplete="off"
                      value={savedAmount}
                      onChange={(event) => {
                        setSavedAmount(event.target.value);
                        setFormError("");
                      }}
                      placeholder="0.00"
                    />
                    <span>$</span>
                  </div>
                </label>

                <label className={`${dlg.field} ${dlg.formFull}`}>
                  <span>Target date</span>
                  <input
                    name="deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => {
                      setDeadline(event.target.value);
                      setFormError("");
                    }}
                  />
                </label>
              </div>

              <div className={styles.progressPreview} role="group" aria-label="Progress">
                <span className={ledger.line} role="presentation">
                  <i style={{ width: `${previewProgress}%` }} />
                </span>
                <p>
                  {dollarPrecise.format(previewSaved)} of{" "}
                  {previewTarget ? dollarPrecise.format(previewTarget) : dollarPrecise.format(0)}, {previewProgress}%
                </p>
              </div>

              {formError ? (
                <p className={dlg.error} role="alert">
                  {formError}
                </p>
              ) : null}
            </div>

            <footer className={`${dlg.footer} ${editingGoalIndex !== null ? dlg.footerSplit : ""}`}>
              {editingGoalIndex !== null ? (
                <button
                  type="button"
                  className={dlg.destructiveButton}
                  onClick={handleDeleteGoal}
                  disabled={saving}
                >
                  Archive goal
                </button>
              ) : null}

              <div className={dlg.footerActions}>
                <button
                  type="button"
                  className={dlg.secondaryButton}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
                  {saving ? "Saving" : editingGoalIndex !== null
                    ? "Save changes"
                    : "Add goal"}
                </button>
              </div>
            </footer>
          </form>
        </Dialog>
      )}
    </section>
  );
}
