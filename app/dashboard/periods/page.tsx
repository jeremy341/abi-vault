"use client";

import { CalendarClock, Check, Info, Lock, Unlock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingStatus } from "@/components/ui/loading-state";
import { listAccountingPeriodsForCurrentOrganization, type AccountingPeriodListItem } from "@/features/finance/actions/queries";
import { lockAccountingPeriod, unlockAccountingPeriod } from "@/features/finance/actions/wallets";
import styles from "./periods.module.css";

const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

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
        if (!result.ok) { setError("Die Buchungszeiträume konnten nicht geladen werden."); return; }
        setPeriods(result.items);
      })
      .catch(() => { if (active) setError("Die Buchungszeiträume konnten nicht geladen werden."); })
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
      setMessage(`${periodLabel(target)} wurde ${target.status === "open" ? "gesperrt" : "entsperrt"}.`);
    }
    setSaving(false);
  }

  return (
    <section className={styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Buchungszeiträume werden geladen…" />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <article className={styles.summaryPanel}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Arbeitsbereich</span>
            <h2>Buchungszeiträume</h2>
            <p>Schließe geprüfte Monate ab, damit gebuchte Transaktionen nachvollziehbar bleiben.</p>
          </div>
          <span className={styles.adminBadge}><Lock aria-hidden="true" /> Nur für Administratoren</span>
        </header>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}><span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}><CalendarClock aria-hidden="true" /></span><span><small>Aktiver Zeitraum</small><strong>{activePeriod ? periodLabel(activePeriod) : "Keiner"}</strong></span></div>
          <div className={styles.summaryStat}><span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}><Check aria-hidden="true" /></span><span><small>Offene Zeiträume</small><strong>{openCount}</strong></span></div>
          <div className={styles.summaryStat}><span className={styles.summaryIcon}><Lock aria-hidden="true" /></span><span><small>Gesperrte Zeiträume</small><strong>{lockedCount}</strong></span></div>
        </div>
      </article>
      <article className={styles.listPanel}>
        <header className={styles.listHeader}><h2>2026</h2></header>
        <div className={styles.tableHeader}><span>Zeitraum</span><span>Status</span><span>Aktion</span></div>
        <div className={styles.rows}>
          {!loading && !periods.length ? <p className={styles.empty}>Keine Buchungszeiträume gefunden.</p> : null}
          {periods.map((period) => (
            <div className={styles.row} key={period.id}>
              <strong>{periodLabel(period)}</strong>
              <span className={`${styles.status} ${period.status === "open" ? styles.open : styles.locked}`}>
                {period.status === "open" ? <Check aria-hidden="true" /> : <Lock aria-hidden="true" />}
                <span>{period.status === "open" ? "Offen" : "Gesperrt"}</span>
                {period.lockedByName ? <small>von {period.lockedByName}</small> : null}
              </span>
              <button type="button" className={styles.actionButton} onClick={() => openPeriodAction(period)}>
                {period.status === "open" ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}
                {period.status === "open" ? "Sperren" : "Entsperren"}
              </button>
            </div>
          ))}
        </div>
        <div className={styles.infoNote}><Info aria-hidden="true" /><span>Gesperrte Zeiträume schützen abgeschlossene Buchungen vor unbeabsichtigten Änderungen.</span></div>
      </article>
      <p className={styles.message} role="status" aria-live="polite">{message}</p>
      {target ? (
        <Dialog label={target.status === "open" ? "Buchungszeitraum sperren" : "Buchungszeitraum entsperren"} onClose={() => { if (!saving) setTarget(null); }} overlayClassName={styles.overlay} dialogClassName={styles.dialog}>
          <header className={styles.dialogHeader}>
            <div><h2>{target.status === "open" ? "Buchungszeitraum sperren?" : "Buchungszeitraum entsperren?"}</h2><p>{periodLabel(target)}</p></div>
            <button type="button" className={styles.closeButton} onClick={() => setTarget(null)} disabled={saving} aria-label="Dialog schließen"><X /></button>
          </header>
          <div className={styles.dialogBody}>
            <span className={styles.dialogIcon}>{target.status === "open" ? <Lock /> : <Unlock />}</span>
            <p>{target.status === "open" ? "Gebuchte Transaktionen können nach dem Sperren nicht mehr geändert werden." : "Der Zeitraum wird wieder für berechtigte Änderungen geöffnet."}</p>
            <label><span>Grund</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="z. B. Monatsabschluss geprüft …" rows={3} autoFocus /></label>
            {message ? <p className={styles.dialogError} role="alert">{message}</p> : null}
          </div>
          <footer className={styles.dialogFooter}><button type="button" className={styles.cancelButton} onClick={() => setTarget(null)} disabled={saving}>Abbrechen</button><button type="button" className={styles.confirmButton} onClick={confirmPeriodAction} disabled={saving || !reason.trim()} aria-busy={saving}>{saving ? "Wird gespeichert …" : target.status === "open" ? "Zeitraum sperren" : "Zeitraum entsperren"}</button></footer>
        </Dialog>
      ) : null}
    </section>
  );
}
