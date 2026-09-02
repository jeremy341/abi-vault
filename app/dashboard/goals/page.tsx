"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import styles from "./goals.module.css";
import phoneStyles from "./goals-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { createGoal } from "@/features/goals/actions/goals";
import { archiveGoal, updateGoal } from "@/features/goals/actions/goal-mutations";
import { cachedFinanceQuery, getFinanceCacheState, invalidateFinanceQuery } from "@/lib/finance/client-cache";

type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  progress: number;
  date: string;
};

const euro = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const euroPrecise = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function PhoneGoalsView({
  loading,
  goals,
  totalSaved,
  totalTarget,
  progress,
  onAdd,
  onEdit,
}: {
  loading: boolean;
  goals: Goal[];
  totalSaved: number;
  totalTarget: number;
  progress: number;
  onAdd: () => void;
  onEdit: (goal: Goal, index: number) => void;
}) {
  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section className={phoneStyles.hero} aria-label="Gesamtfortschritt" data-ui-slot="summary">
        <span>Gesamt gespart</span>
        <strong><LoadingText loading={loading}>{euro.format(totalSaved)}</LoadingText></strong>
        <p>by <LoadingText loading={loading}>{euro.format(totalTarget)}</LoadingText></p>
        <div className={phoneStyles.heroProgress}>
          <b><LoadingText loading={loading}>{progress}%</LoadingText></b>
          <span>erreicht</span>
        </div>
      </section>

      <header className={phoneStyles.sectionHeader} data-ui-slot="list-header">
        <h2>Sparziele</h2>
        <span><LoadingText loading={loading}>{goals.length} aktiv</LoadingText></span>
      </header>
      <div className={phoneStyles.goals} data-ui-slot="list-body">
        <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="12rem" label="Goals are loading…">
          {goals.length ? goals.map((goal, index) => (
            <button
              type="button"
              className={phoneStyles.goal}
              key={`${goal.title}-${index}`}
              onClick={() => onEdit(goal, index)}
            >
              <strong>{goal.title}</strong>
              <b>{euro.format(goal.target)}</b>
              <span className={phoneStyles.goalMeta}>
                {euroPrecise.format(goal.saved)} gespart
              </span>
              <span className={phoneStyles.goalMeta}>{goal.progress}%</span>
              <div className={phoneStyles.goalTrack} aria-hidden="true">
                <i style={{ width: `${goal.progress}%` }} />
              </div>
              <span className={phoneStyles.goalFooter}>
                <span>Goal: {goal.date}</span>
                <span>{euroPrecise.format(goal.target - goal.saved)} pending</span>
              </span>
            </button>
          )) : <div className={phoneStyles.empty}>Noch keine Sparziele vorhanden.</div>}
        </LoadingCollection>
      </div>
      <button type="button" className={phoneStyles.addButton} onClick={onAdd} disabled={loading} data-ui-slot="primary-action">
        <Plus aria-hidden="true" /> Add goal
      </button>
    </div>
  );
}

export default function GoalsPage() {
  const mode = usePresentationMode();
  const { userId, orgId } = useAppAuth();
  const cacheScope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  type DashboardResult = Awaited<ReturnType<typeof getDashboardSnapshot>>;
  const initialSnapshot = getFinanceCacheState<DashboardResult>("dashboard-snapshot", cacheScope);
  const initialGoals = initialSnapshot.data?.ok ? initialSnapshot.data.goals : [];
  const [goals, setGoals] = useState<Goal[]>(() => initialGoals.map((goal) => {
    const target = Number(goal.target_amount_minor) / 100;
    const saved = Number(goal.saved_amount_minor) / 100;
    return {
      id: goal.id,
      title: goal.title,
      target,
      saved,
      progress: target ? Math.round((saved / target) * 100) : 0,
      date: new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("en-GB"),
    };
  }));
  const [loading, setLoading] = useState(!initialSnapshot.data?.ok);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, { scope: cacheScope })
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setLoadError("The goals could not be loaded.");
          return;
        }
        setGoals(result.goals.map((goal) => {
          const target = Number(goal.target_amount_minor) / 100;
          const saved = Number(goal.saved_amount_minor) / 100;
          return {
            id: goal.id,
            title: goal.title,
            target,
            saved,
            progress: target ? Math.round((saved / target) * 100) : 0,
            date: new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("en-GB"),
          };
        }));
      })
      .catch(() => {
        if (active) setLoadError("The goals could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cacheScope]);

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

    // Convert DD.MM.YYYY to YYYY-MM-DD for date input
    const parts = goal.date.split(".");
    if (parts.length === 3) {
      setDeadline(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      setDeadline(goal.date);
    }
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
        "Please complete the name, target amount, and target date.",
      );
      return;
    }
    if (saved < 0 || saved > target) {
      setFormError(
        "The amount already saved must be between €0 and the target amount.",
      );
      return;
    }

    const [year, month, day] = submittedDeadline.split("-");
    const formattedDate = `${day}.${month}.${year}`;
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
      // Update existing goal
      setGoals((current) =>
        current.map((g, idx) =>
          idx === editingGoalIndex
            ? {
              id: g.id,
              title: submittedName,
              target,
              saved,
              progress,
              date: formattedDate,
            }
            : g,
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
      // Add new goal
      setGoals((current) => [
        ...current,
        {
          id: result.data.id,
          title: submittedName,
          target,
          saved,
          progress,
          date: formattedDate,
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
      setGoals((current) => current.filter((_, idx) => idx !== editingGoalIndex));
      invalidateFinanceQuery("goals", "dashboard-snapshot", "report-snapshot");
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={mode === "phone" ? phoneStyles.pageShell : styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Goals are loading…" />
      {loadError ? <p className={styles.formError} role="alert">{loadError}</p> : null}
      {mode === "phone" ? (
        <PhoneGoalsView
          loading={loading}
          goals={goals}
          totalSaved={totalSaved}
          totalTarget={totalTarget}
          progress={overallProgress}
          onAdd={openAddModal}
          onEdit={openEditModal}
        />
      ) : (
        <>
          <div className={styles.summaryGrid} data-ui-slot="summary">
            <div className={styles.summaryLeft}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryIcon}>
                  <Target aria-hidden="true" />
                </span>
                <div>
                  <span>Activee Goals</span>
                  <strong><LoadingText loading={loading}>{goals.length}</LoadingText></strong>
                </div>
              </article>
              <article className={styles.summaryCard}>
                <span className={`${styles.summaryIcon} ${styles.savedIcon}`}>
                  <CircleDollarSign aria-hidden="true" />
                </span>
                <div>
                  <span>Gesamt gespart</span>
                  <strong><LoadingText loading={loading}>{euro.format(totalSaved)}</LoadingText></strong>
                </div>
              </article>
            </div>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.progressIcon}`}>
                <CheckCircle2 aria-hidden="true" />
              </span>
              <div>
                <span>Gesamtfortschritt</span>
                <strong><LoadingText loading={loading}>{overallProgress}%</LoadingText></strong>
              </div>
            </article>
          </div>

          <div className={styles.contentGrid} data-ui-slot="content">
            <article className={styles.goalsPanel} data-ui-slot="primary-panel">
              <header className={styles.panelHeader}>
                <div>
                  <h2>Meine Goals</h2>
                  <p>
                    Select a goal to adjust amounts or deadlines.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={openAddModal}
                  disabled={loading}
                  data-ui-slot="primary-action"
                >
                  <Plus aria-hidden="true" />
                  Add goal
                </button>
              </header>
              <div className={styles.goalGrid} data-ui-slot="list-body">
                <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="14rem" label="Goals are loading…">
                  {goals.map((goal, idx) => (
                    <article
                      className={styles.goalCard}
                      key={`${goal.title}-${idx}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEditModal(goal, idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEditModal(goal, idx);
                        }
                      }}
                      title="Click to edit"
                    >
                      <div className={styles.goalCardHeader}>
                        <h3>{goal.title}</h3>
                        <Target aria-hidden="true" />
                      </div>
                      <strong className={styles.goalTarget}>
                        {euro.format(goal.target)}
                      </strong>
                      <p className={styles.goalSaved}>
                        {euroPrecise.format(goal.saved)} gesammelt
                      </p>
                      <div className={styles.progressLine}>
                        <div className={styles.progressTrack}>
                          <span style={{ width: `${goal.progress}%` }} />
                        </div>
                        <strong>{goal.progress}%</strong>
                      </div>
                      <div className={styles.goalFooter}>
                        <span>
                          <CalendarDays aria-hidden="true" />
                          Goal: {goal.date}
                        </span>
                        <span>
                          {euroPrecise.format(goal.target - goal.saved)} pending
                        </span>
                      </div>
                    </article>
                  ))}
                </LoadingCollection>
              </div>
            </article>

            <aside className={styles.sideColumn} data-ui-slot="secondary-panel">
              <article className={styles.progressPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Gesamtfortschritt</h2>
                    <p>Across all active goals</p>
                  </div>
                  <span className={styles.progressPercent}>
                    <LoadingText loading={loading}>{overallProgress}%</LoadingText>
                  </span>
                </header>
                <div className={styles.largeProgress}>
                  <span style={{ width: `${overallProgress}%` }} />
                </div>
                <div className={styles.progressStats}>
                  <span><LoadingText loading={loading}>{euroPrecise.format(totalSaved)} gespart</LoadingText></span>
                  <span>by <LoadingText loading={loading}>{euro.format(totalTarget)}</LoadingText></span>
                </div>
              </article>

              <article className={styles.upcomingPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Upcoming goals</h2>
                    <p>Bevorstehende Fristen</p>
                  </div>
                  <CalendarDays aria-hidden="true" />
                </header>
                <div className={styles.upcomingList}>
                  <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="10rem" label="Deadlines are loading…">
                    {goals
                      .slice()
                      .sort((a, b) =>
                        a.date
                          .split(".")
                          .reverse()
                          .join("")
                          .localeCompare(b.date.split(".").reverse().join("")),
                      )
                      .slice(0, 3)
                      .map((goal) => {
                        const originalIndex = goals.findIndex(
                          (g) => g.title === goal.title,
                        );
                        return (
                          <button
                            type="button"
                            className={styles.upcomingItem}
                            key={`upcoming-${goal.title}`}
                            onClick={() =>
                              openEditModal(
                                goal,
                                originalIndex >= 0 ? originalIndex : 0,
                              )
                            }
                          >
                            <div>
                              <strong>{goal.title}</strong>
                              <span>{goal.date}</span>
                            </div>
                            <ArrowRight aria-hidden="true" />
                          </button>
                        );
                      })}
                  </LoadingCollection>
                </div>
              </article>
            </aside>
          </div>
        </>
      )}

      {modalOpen && (
        <Dialog
          label={
            editingGoalIndex !== null ? "Edit goal" : "Add goal"
          }
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <form onSubmit={handleSaveGoal} noValidate>
            <header className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span>
                  {editingGoalIndex !== null ? (
                    <Pencil aria-hidden="true" />
                  ) : (
                    <Target aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h2>
                    {editingGoalIndex !== null
                      ? "Edit goal"
                      : "Add goal"}
                  </h2>
                  <p>
                    {editingGoalIndex !== null
                      ? "Edit the details, amounts, and progress of this savings goal."
                      : "Set a new shared savings goal."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.modalBody}>
              <section
                className={styles.goalPreview}
                aria-label="Goal preview"
              >
                <div className={styles.goalCardHeader}>
                  <h3>
                    {goalName.trim() ||
                      (editingGoalIndex !== null ? "Goalname" : "News Goal")}
                  </h3>
                  <Target aria-hidden="true" />
                </div>
                <strong>
                  {previewTarget ? euro.format(previewTarget) : "0 €"}
                </strong>
                <p>{euroPrecise.format(previewSaved)} gesammelt</p>
                <div className={styles.progressLine}>
                  <div className={styles.progressTrack}>
                    <span style={{ width: `${previewProgress}%` }} />
                  </div>
                  <b>{previewProgress}%</b>
                </div>
              </section>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Goalname</span>
                  <input
                    name="goalName"
                    autoComplete="off"
                    value={goalName}
                    maxLength={30}
                    onChange={(event) => {
                      setGoalName(event.target.value);
                      setFormError("");
                    }}
                    placeholder="z. B. Abiball, Klassenfahrt …"
                  />
                </label>

                <label className={styles.formField}>
                  <span>Goaldatum</span>
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

                <label className={styles.formField}>
                  <span>Target amount</span>
                  <div className={styles.amountField}>
                    <input
                      name="targetAmount"
                      inputMode="decimal"
                      autoComplete="off"
                      value={targetAmount}
                      onChange={(event) => {
                        setTargetAmount(event.target.value);
                        setFormError("");
                      }}
                      placeholder="0,00"
                    />
                    <span>€</span>
                  </div>
                </label>

                <label className={styles.formField}>
                  <span>Bereits gespart</span>
                  <div className={styles.amountField}>
                    <input
                      name="savedAmount"
                      inputMode="decimal"
                      autoComplete="off"
                      value={savedAmount}
                      onChange={(event) => {
                        setSavedAmount(event.target.value);
                        setFormError("");
                      }}
                      placeholder="0,00"
                    />
                    <span>€</span>
                  </div>
                </label>
              </div>

              <p className={styles.formError} aria-live="polite">
                {formError || "\u00a0"}
              </p>
            </div>

            <footer className={styles.modalFooter}>
              {editingGoalIndex !== null ? (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDeleteGoal}
                  disabled={saving}
                >
                  <Trash2 className="inline-block size-4 mr-1.5" />
                  Delete goal
                </button>
              ) : (
                <div />
              )}

              <div className={styles.modalFooterRight}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={saving} aria-busy={saving}>
                  {saving ? "Saving …" : editingGoalIndex !== null
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
