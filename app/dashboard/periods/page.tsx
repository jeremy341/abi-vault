"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import {
  listAccountingPeriodsForCurrentOrganization,
  type AccountingPeriodListItem,
} from "@/features/finance/actions/queries";
import {
  lockAccountingPeriod,
  unlockAccountingPeriod,
} from "@/features/finance/actions/wallets";
import styles from "./periods.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

const loadErrorMessage = "The accounting periods could not be loaded.";

function periodLabel(period: AccountingPeriodListItem) {
  return monthFormatter.format(new Date(period.year, period.month - 1, 1));
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriodListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AccountingPeriodListItem | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const activePeriod = periods.find((period) => period.status === "open");
  const openCount = periods.filter((period) => period.status === "open").length;
  const lockedCount = periods.filter((period) => period.status === "locked").length;

  const isLocking = target !== null && target.status === "open";

  let dialogTitle = "Unlock accounting period";
  let dialogQuestion = "Unlock accounting period?";
  let dialogExplanation = "The period will be reopened for authorized changes. The reason is recorded.";

  if (isLocking) {
    dialogTitle = "Lock accounting period";
    dialogQuestion = "Lock accounting period?";
    dialogExplanation = "Posted transactions cannot be changed after locking. The reason is recorded.";
  }

  let confirmLabel = "Unlock period";

  if (isLocking) {
    confirmLabel = "Lock period";
  }

  if (saving) {
    confirmLabel = "Saving";
  }

  useEffect(() => {
    let active = true;

    async function loadPeriods() {
      try {
        const periodList = await listAccountingPeriodsForCurrentOrganization();

        if (!active) return;

        if (!periodList.ok) {
          setError(loadErrorMessage);

          return;
        }

        setPeriods(periodList.items);
      } catch {
        if (active) setError(loadErrorMessage);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPeriods();

    return () => {
      active = false;
    };
  }, []);

  function openPeriodAction(period: AccountingPeriodListItem) {
    setTarget(period);
    setReason("");
    setMessage("");
  }

  async function confirmPeriodAction() {
    if (!target || saving || !reason.trim()) return;

    setSaving(true);

    const targetWasOpen = target.status === "open";
    const action = targetWasOpen ? lockAccountingPeriod : unlockAccountingPeriod;

    try {
      const result = await action({ periodId: target.id, reason: reason.trim() });

      if (!result.success) {
        setMessage(result.error.message);
      } else {
        const newStatus = targetWasOpen ? "locked" : "open";

        setPeriods((current) =>
          current.map((period) =>
            period.id === target.id ? { ...period, status: newStatus } : period,
          ),
        );
        setTarget(null);

        const newStateWord = targetWasOpen ? "locked" : "unlocked";

        setMessage(`${periodLabel(target)} was ${newStateWord}.`);
      }
    } catch {
      setMessage("The accounting period could not be updated. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function renderPeriodTable() {
    if (!loading && !error && periods.length === 0) {
      return <p className={ledger.empty}>No accounting periods found.</p>;
    }

    if (error && periods.length === 0) {
      return null;
    }

    return (
      <table className={ledger.table}>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Status</th>
            <th scope="col" className={ledger.hideOnPhone}>Reason</th>
            <th scope="col" className={ledger.actions}><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const isOpen = period.status === "open";
            const statusClassName = isOpen ? ledger.attention : ledger.muted;
            const actionLabel = isOpen ? "Lock" : "Unlock";

            return (
              <tr key={period.id}>
                <td>{periodLabel(period)}</td>
                <td className={statusClassName}>
                  {isOpen ? "Open" : "Locked"}
                  {period.lockedByName ? <span className={ledger.rowMeta}> by {period.lockedByName}</span> : null}
                </td>
                <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{period.lockReason ?? ""}</td>
                <td className={ledger.actions}>
                  <button type="button" className={ledger.secondaryButton} onClick={() => openPeriodAction(period)}>
                    {actionLabel}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <section className={`${ledger.page} ${ledger.narrow}`} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading periods" />
      {error ? <LoadError message={error} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Current period</dt>
            <dd>
              <LoadingText loading={loading}>{activePeriod ? periodLabel(activePeriod) : "None"}</LoadingText>
            </dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd><LoadingText loading={loading}>{openCount}</LoadingText></dd>
          </div>
          <div>
            <dt>Locked</dt>
            <dd><LoadingText loading={loading}>{lockedCount}</LoadingText></dd>
          </div>
        </dl>
      </div>

      <section className={ledger.section}>
        <header className={ledger.sectionHeader}>
          <h2>Accounting periods</h2>
          <p>Locked periods cannot be changed. Admins only.</p>
        </header>
        <LoadingCollection loading={loading} knownItemCount={periods.length} rows={4} label="Loading periods">
          {renderPeriodTable()}
        </LoadingCollection>
      </section>

      <p className={ledger.notice} role="status" aria-live="polite">{message}</p>
      {target ? (
        <Dialog
          label={dialogTitle}
          onClose={() => {
            if (!saving) setTarget(null);
          }}
          overlayClassName={styles.overlay}
          dialogClassName={styles.dialog}
        >
          <header className={styles.dialogHeader}>
            <div>
              <h2>{dialogQuestion}</h2>
              <p>{periodLabel(target)}</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setTarget(null)}
              disabled={saving}
              aria-label="Close dialog"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={styles.dialogBody}>
            <p>{dialogExplanation}</p>
            <label>
              <span>Reason</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="For example: month-end checks complete"
                rows={3}
                autoFocus
              />
            </label>
            {message ? (
              <p className={styles.dialogError} role="alert">
                {message}
              </p>
            ) : null}
          </div>
          <footer className={styles.dialogFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setTarget(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={confirmPeriodAction}
              disabled={saving || !reason.trim()}
              aria-busy={saving}
            >
              {confirmLabel}
            </button>
          </footer>
        </Dialog>
      ) : null}
    </section>
  );
}
