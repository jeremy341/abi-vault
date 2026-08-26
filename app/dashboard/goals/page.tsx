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
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import styles from "./goals.module.css";
import phoneStyles from "./goals-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { listGoalsForCurrentOrganization } from "@/features/finance/actions/queries";
import { createGoal } from "@/features/goals/actions/goals";
import { archiveGoal, updateGoal } from "@/features/goals/actions/goal-mutations";

type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  progress: number;
  date: string;
};

const initialGoals: Goal[] = [
  {
    id: "demo-goal-1",
    title: "Abiball",
    target: 3000,
    saved: 2100,
    progress: 70,
    date: "15.05.2026",
  },
  {
    id: "demo-goal-2",
    title: "Abizeitung",
    target: 1200,
    saved: 540,
    progress: 45,
    date: "30.04.2026",
  },
  {
    id: "demo-goal-3",
    title: "Reserve",
    target: 1000,
    saved: 800,
    progress: 80,
    date: "01.07.2026",
  },
];

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const euroPrecise = new Intl.NumberFormat("de-DE", {
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
        <p>von <LoadingText loading={loading}>{euro.format(totalTarget)}</LoadingText></p>
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
        <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="12rem" label="Ziele werden geladen…">
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
              <span>Ziel: {goal.date}</span>
              <span>{euroPrecise.format(goal.target - goal.saved)} offen</span>
            </span>
          </button>
          )) : <div className={phoneStyles.empty}>Noch keine Sparziele vorhanden.</div>}
        </LoadingCollection>
      </div>
      <button type="button" className={phoneStyles.addButton} onClick={onAdd} disabled={loading} data-ui-slot="primary-action">
        <Plus aria-hidden="true" /> Ziel hinzufügen
      </button>
    </div>
  );
}

export default function GoalsPage() {
  const mode = usePresentationMode();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState("");
  useEffect(() => {
    let active = true;
    listGoalsForCurrentOrganization()
      .then((result) => {
        if (!active || !result.ok) return;
        setGoals(result.items.map((goal) => {
          const target = Number(goal.target_amount_minor) / 100;
          const saved = Number(goal.saved_amount_minor) / 100;
          return {
            id: goal.id,
            title: goal.title,
            target,
            saved,
            progress: target ? Math.round((saved / target) * 100) : 0,
            date: new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("de-DE"),
          };
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
    const target = Number(targetAmount.replace(",", "."));
    const saved = Number(savedAmount.replace(",", ".")) || 0;

    if (!goalName.trim() || !target || target <= 0 || !deadline) {
      setFormError(
        "Bitte Name, Zielbetrag und Zieldatum vollständig ausfüllen.",
      );
      return;
    }
    if (saved < 0 || saved > target) {
      setFormError(
        "Der bereits gesparte Betrag muss zwischen 0 € und dem Zielbetrag liegen.",
      );
      return;
    }

    const [year, month, day] = deadline.split("-");
    const formattedDate = `${day}.${month}.${year}`;
    const progress = Math.round((saved / target) * 100);

    if (editingGoalIndex !== null) {
      const currentGoal = goals[editingGoalIndex];
      if (currentGoal && /^[0-9a-f-]{36}$/i.test(currentGoal.id)) {
        const result = await updateGoal({
          goalId: currentGoal.id,
          title: goalName.trim(),
          description: null,
          targetAmount: targetAmount,
          deadline,
          reason: "Ziel im Ziel-Dialog aktualisiert",
        });
        if (!result.ok) {
          setFormError("Das Ziel konnte nicht gespeichert werden.");
          return;
        }
      }
      // Update existing goal
      setGoals((current) =>
        current.map((g, idx) =>
          idx === editingGoalIndex
            ? {
                id: g.id,
                title: goalName.trim(),
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
        title: goalName.trim(),
        description: null,
        targetAmount: targetAmount,
        deadline,
        visibility: "private",
        idempotencyKey: `goal-${crypto.randomUUID()}`,
      });
      if (!result.success) {
        setFormError("Das Ziel konnte nicht gespeichert werden.");
        return;
      }
      // Add new goal
      setGoals((current) => [
        ...current,
        {
          id: result.data.id,
          title: goalName.trim(),
          target,
          saved,
          progress,
          date: formattedDate,
        },
      ]);
    }
    closeModal();
  }

  async function handleDeleteGoal() {
    if (editingGoalIndex === null) return;
    const currentGoal = goals[editingGoalIndex];
    if (/^[0-9a-f-]{36}$/i.test(currentGoal.id)) {
      const result = await archiveGoal({
        goalId: currentGoal.id,
        reason: "Ziel im Ziel-Dialog archiviert",
      });
      if (!result.ok) {
        setFormError("Das Ziel konnte nicht archiviert werden.");
        return;
      }
    }
    setGoals((current) => current.filter((_, idx) => idx !== editingGoalIndex));
    closeModal();
  }

  return (
    <section className={mode === "phone" ? phoneStyles.root : styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Ziele werden geladen…" />
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
                  <span>Aktive Ziele</span>
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
                  <h2>Meine Ziele</h2>
                  <p>
                    Klicke auf ein Ziel, um Beträge oder Fristen anzupassen.
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
                  Ziel hinzufügen
                </button>
              </header>
              <div className={styles.goalGrid} data-ui-slot="list-body">
                <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="14rem" label="Ziele werden geladen…">
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
                    title="Klicken zum Anpassen"
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
                        Ziel: {goal.date}
                      </span>
                      <span>
                        {euroPrecise.format(goal.target - goal.saved)} offen
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
                    <p>Über alle aktiven Ziele</p>
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
                  <span>von <LoadingText loading={loading}>{euro.format(totalTarget)}</LoadingText></span>
                </div>
              </article>

              <article className={styles.upcomingPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Nächste Ziele</h2>
                    <p>Bevorstehende Fristen</p>
                  </div>
                  <CalendarDays aria-hidden="true" />
                </header>
                <div className={styles.upcomingList}>
                  <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="10rem" label="Fristen werden geladen…">
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
            editingGoalIndex !== null ? "Ziel anpassen" : "Ziel hinzufügen"
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
                      ? "Ziel anpassen"
                      : "Ziel hinzufügen"}
                  </h2>
                  <p>
                    {editingGoalIndex !== null
                      ? "Details, Beträge und Fortschritt dieses Sparziels bearbeiten."
                      : "Lege ein neues gemeinsames Sparziel fest."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Dialog schließen"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.modalBody}>
              <section
                className={styles.goalPreview}
                aria-label="Vorschau des Ziels"
              >
                <div className={styles.goalCardHeader}>
                  <h3>
                    {goalName.trim() ||
                      (editingGoalIndex !== null ? "Zielname" : "Neues Ziel")}
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
                  <span>Zielname</span>
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
                  <span>Zieldatum</span>
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
                  <span>Zielbetrag</span>
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
                >
                  <Trash2 className="inline-block size-4 mr-1.5" />
                  Ziel löschen
                </button>
              ) : (
                <div />
              )}

              <div className={styles.modalFooterRight}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeModal}
                >
                  Abbrechen
                </button>
                <button type="submit" className={styles.primaryButton}>
                  {editingGoalIndex !== null
                    ? "Änderungen speichern"
                    : "Ziel hinzufügen"}
                </button>
              </div>
            </footer>
          </form>
        </Dialog>
      )}
    </section>
  );
}
