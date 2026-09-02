"use client";

import { CalendarClock, Check, Info, Lock, Unlock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingStatus } from "@/components/ui/loading-state";
import { listAccountingPeriodsForCurrentOrganization, type AccountingPeriodListItem } from "@/features/finance/actions/queries";
import { lockAccountingPeriod, unlockAccountingPeriod } from "@/features/finance/actions/wallets";
import styles from "./periods.module.css";

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

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
  const activePeriod = periods.find((period) => period.status === "open") ?? null;
  const openCount = periods.filter((period) => period.status === "open").length;
  const lockedCount = periods.filter((period) => period.status === "locked").length;

  useEffect(() => {
    let active = true;
    listAccountingPeriodsForCurrentOrganization()
      .then((result) => {
        if (!active) return;
        if (!result.ok) { setError("Die Accounting periods konnten nicht geladen werden."); return; }
        setPeriods(result.items);
      })
      .catch(() => { if (active) setError("Die Accounting periods konnten nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function openPeriodAction(period: AccountingPeriodListItem) {
    setTarget(period);
    setReason("");
    setMessage("");
  }

  async function confirmPeriodAction() {
    if (!target || saving || !reason.trim()) return;
    setSaving(true);
    const action = target.status === "open" ? lockAccountingPeriod : unlockAccountingPeriod;
    const result = await action({ periodId: target.id, reason: reason.trim() });
    if (!result.success) setMessage(result.error.message);
    else {
      setPeriods((current) => current.map((period) => period.id === target.id ? { ...period, status: target.status === "open" ? "locked" : "open" } : period));
      setTarget(null);
      setMessage(`${periodLabel(target)} was ${target.status === "open" ? "locked" : "unlocked"}.`);
    }
    setSaving(false);
  }

  return (
    <section className={styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Accounting periods werden geladen…" />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <article className={styles.summaryPanel}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Workspace</span>
            <h2>Accounting periods</h2>
            <p>Close reviewed months so posted transactions remain traceable.</p>
          </div>
          <span className={styles.adminBadge}><Lock aria-hidden="true" /> Admins only</span>
        </header>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}><span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}><CalendarClock aria-hidden="true" /></span><span><small>Activeer Zeitraum</small><strong>{activePeriod ? periodLabel(activePeriod) : "Nor"}</strong></span></div>
          <div className={styles.summaryStat}><span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}><Check aria-hidden="true" /></span><span><small>Opene Periods</small><strong>{openCount}</strong></span></div>
          <div className={styles.summaryStat}><span className={styles.summaryIcon}><Lock aria-hidden="true" /></span><span><small>Lockede Periods</small><strong>{lockedCount}</strong></span></div>
        </div>
      </article>
      <article className={styles.listPanel}>
        <header className={styles.listHeader}><h2>2026</h2></header>
        <div className={styles.tableHeader}><span>Period</span><span>Status</span><span>Action</span></div>
        <div className={styles.rows}>
          {!loading && !periods.length ? <p className={styles.empty}>No Accounting periods gefunden.</p> : null}
          {periods.map((period) => (
            <div className={styles.row} key={period.id}>
              <strong>{periodLabel(period)}</strong>
              <span className={`${styles.status} ${period.status === "open" ? styles.open : styles.locked}`}>
                {period.status === "open" ? <Check aria-hidden="true" /> : <Lock aria-hidden="true" />}
                <span>{period.status === "open" ? "Open" : "Locked"}</span>
                {period.lockedByName ? <small>von {period.lockedByName}</small> : null}
              </span>
              <button type="button" className={styles.actionButton} onClick={() => openPeriodAction(period)}>
                {period.status === "open" ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}
                {period.status === "open" ? "Lock" : "Unlock"}
              </button>
            </div>
          ))}
        </div>
        <div className={styles.infoNote}><Info aria-hidden="true" /><span>Locked periods protect completed bookings from accidental changes.</span></div>
      </article>
      <p className={styles.message} role="status" aria-live="polite">{message}</p>
      {target ? (
        <Dialog label={target.status === "open" ? "Accounting period sperren" : "Accounting period entsperren"} onClose={() => { if (!saving) setTarget(null); }} overlayClassName={styles.overlay} dialogClassName={styles.dialog}>
          <header className={styles.dialogHeader}>
            <div><h2>{target.status === "open" ? "Accounting period sperren?" : "Accounting period entsperren?"}</h2><p>{periodLabel(target)}</p></div>
            <button type="button" className={styles.closeButton} onClick={() => setTarget(null)} disabled={saving} aria-label="Close dialog"><X /></button>
          </header>
          <div className={styles.dialogBody}>
            <span className={styles.dialogIcon}>{target.status === "open" ? <Lock /> : <Unlock />}</span>
            <p>{target.status === "open" ? "Posted transactions cannot be changed after locking." : "The period will be reopened for authorized changes."}</p>
            <label><span>Reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. month-end close checked …" rows={3} autoFocus /></label>
            {message ? <p className={styles.dialogError} role="alert">{message}</p> : null}
          </div>
          <footer className={styles.dialogFooter}><button type="button" className={styles.cancelButton} onClick={() => setTarget(null)} disabled={saving}>Cancel</button><button type="button" className={styles.confirmButton} onClick={confirmPeriodAction} disabled={saving || !reason.trim()} aria-busy={saving}>{saving ? "Saving …" : target.status === "open" ? "Zeitraum sperren" : "Zeitraum entsperren"}</button></footer>
        </Dialog>
      ) : null}
    </section>
  );
}
