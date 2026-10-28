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

  const activePeriod =
    periods.find((period) => period.status === "open") ?? null;

  const openCount = periods.filter((period) => period.status === "open").length;

  const lockedCount = periods.filter(
    (period) => period.status === "locked",
  ).length;

  useEffect(() => {
    let active = true;
    listAccountingPeriodsForCurrentOrganization()
      .then((periodList) => {
        if (!active) return;

        if (!periodList.ok) {
          setError("The accounting periods could not be loaded.");

          return;
        }

        setPeriods(periodList.items);
      })
      .catch(() => {
        if (active) setError("The accounting periods could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

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

    const action =
      target.status === "open" ? lockAccountingPeriod : unlockAccountingPeriod;

    const result = await action({ periodId: target.id, reason: reason.trim() });

    if (!result.success) setMessage(result.error.message);
    else {
      setPeriods((current) =>
        current.map((period) =>
          period.id === target.id
            ? {
                ...period,
                status: target.status === "open" ? "locked" : "open",
              }
            : period,
        ),
      );
      setTarget(null);
      setMessage(
        `${periodLabel(target)} was ${target.status === "open" ? "locked" : "unlocked"}.`,
      );
    }

    setSaving(false);
  }

  return (
    <section className={`${ledger.page} ${ledger.narrow}`} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading periods" />
      {error ? <LoadError message={error} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Current period</dt>
            <dd><LoadingText loading={loading}>{activePeriod ? periodLabel(activePeriod) : "None"}</LoadingText></dd>
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
        {!loading && !error && !periods.length ? (
          <p className={ledger.empty}>No accounting periods found.</p>
        ) : error && !periods.length ? null : (
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
              {periods.map((period) => (
                <tr key={period.id}>
                  <td>{periodLabel(period)}</td>
                  <td className={period.status === "open" ? ledger.attention : ledger.muted}>
                    {period.status === "open" ? "Open" : "Locked"}
                    {period.lockedByName ? <span className={ledger.rowMeta}> by {period.lockedByName}</span> : null}
                  </td>
                  <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{period.lockReason ?? ""}</td>
                  <td className={ledger.actions}>
                    <button type="button" className={ledger.secondaryButton} onClick={() => openPeriodAction(period)}>
                      {period.status === "open" ? "Lock" : "Unlock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </LoadingCollection>
      </section>

      <p className={ledger.notice} role="status" aria-live="polite">{message}</p>
      {target ? (
        <Dialog
          label={
            target.status === "open"
              ? "Lock accounting period"
              : "Unlock accounting period"
          }
          onClose={() => {
            if (!saving) setTarget(null);
          }}
          overlayClassName={styles.overlay}
          dialogClassName={styles.dialog}
        >
          <header className={styles.dialogHeader}>
            <div>
              <h2>
                {target.status === "open"
                  ? "Lock accounting period?"
                  : "Unlock accounting period?"}
              </h2>
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
            <p>
              {target.status === "open"
                ? "Posted transactions cannot be changed after locking. The reason is recorded."
                : "The period will be reopened for authorized changes. The reason is recorded."}
            </p>
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
              {saving
                ? "Saving"
                : target.status === "open"
                  ? "Lock period"
                  : "Unlock period"}
            </button>
          </footer>
        </Dialog>
      ) : null}
    </section>
  );
}
