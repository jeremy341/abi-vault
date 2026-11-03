"use client";

import { useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { Dialog } from "@/components/ui/dialog";
import { LoadingStatus } from "@/components/ui/loading-state";
import dlg from "@/components/dashboard/dialog.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { createGoal } from "@/features/goals/actions/goals";
import { archiveGoal, updateGoal } from "@/features/goals/actions/goal-mutations";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { GoalForm } from "./GoalForm";
import { GoalList } from "./GoalList";
import { GoalSummary } from "./GoalSummary";
import { displayGoalDate, goalsFromDashboard, type Goal } from "./goals-format";

const emptyGoals: Goal[] = [];

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
