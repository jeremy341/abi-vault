"use client";

import { Check, CircleAlert, Download, Eye, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import styles from "./ReceiptReviewDialog.module.css";

export type ReceiptReviewDecision = "approved" | "rejected" | "pending";

export type ReceiptReviewDialogReceipt = {
  file: string;
  type: string;
  transaction: string;
  date: string;
  amount: number;
  status: string;
  createdByName?: string | null;
  createdAt?: string | null;
  uploadedByName?: string | null;
  uploadedAt?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
};

type ReceiptReviewDialogProps = {
  receipt: ReceiptReviewDialogReceipt;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onDecision: (decision: ReceiptReviewDecision) => void;
};

function decisionLabel(decision: ReceiptReviewDecision) {
  if (decision === "approved") return "Geprüft";
  if (decision === "rejected") return "Ungültig";
  return "Zu prüfen";
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export function ReceiptReviewDialog({
  receipt,
  previewUrl,
  previewLoading,
  previewError,
  saving,
  error,
  onClose,
  onDecision,
}: ReceiptReviewDialogProps) {
  const isPdf = receipt.type === "PDF";
  return (
    <Dialog
      label="Beleg prüfen"
      onClose={() => { if (!saving) onClose(); }}
      overlayClassName={styles.overlay}
      dialogClassName={styles.dialog}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Belegprüfung</span>
          <h2>Beleg prüfen</h2>
          <p>{receipt.file}</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} disabled={saving} aria-label="Dialog schließen">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={styles.previewFrame}>
        {previewLoading ? (
          <div className={styles.previewState} role="status">Beleg wird geladen…</div>
        ) : previewUrl ? (
          isPdf ? (
            <iframe title={`Vorschau von ${receipt.file}`} src={previewUrl} />
          ) : (
            <>
              {/* Signed storage URLs are runtime-specific, so this preview remains a native image. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs are not known to next/image at build time. */}
              <img width="1200" height="900" src={previewUrl} alt={`Vorschau des Belegs ${receipt.file}`} />
            </>
          )
        ) : (
          <div className={styles.previewState}>
            <CircleAlert aria-hidden="true" />
            <span>{previewError || "Die Vorschau konnte nicht geladen werden."}</span>
          </div>
        )}
      </div>

      <div className={styles.meta}>
        <div><span>Transaktion</span><strong>{receipt.transaction}</strong></div>
        <div><span>Datum</span><strong>{receipt.date}</strong></div>
        <div><span>Betrag</span><strong>{receipt.amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong></div>
        <div><span>Aktueller Status</span><strong>{receipt.status}</strong></div>
        {receipt.createdByName ? <div><span>Erstellt von</span><strong>{receipt.createdByName}</strong><small>{formatTimestamp(receipt.createdAt)}</small></div> : null}
        {receipt.uploadedByName ? <div><span>Hochgeladen von</span><strong>{receipt.uploadedByName}</strong><small>{formatTimestamp(receipt.uploadedAt)}</small></div> : null}
        {receipt.reviewedByName ? <div><span>Geprüft von</span><strong>{receipt.reviewedByName}</strong><small>{formatTimestamp(receipt.reviewedAt)}</small></div> : null}
      </div>

      {previewUrl ? (
        <a className={styles.downloadLink} href={previewUrl} target="_blank" rel="noreferrer" download={receipt.file}>
          <Download aria-hidden="true" />
          Beleg herunterladen
        </a>
      ) : null}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <footer className={styles.footer}>
        <span className={styles.footerHint}>Entscheidung speichern</span>
        <div className={styles.actions}>
          {(["pending", "rejected", "approved"] as const).map((decision) => (
            <button
              type="button"
              key={decision}
              className={`${styles.decisionButton} ${styles[decision]} ${receipt.status === decisionLabel(decision) ? styles.current : ""}`}
              onClick={() => onDecision(decision)}
              disabled={saving}
              aria-busy={saving}
            >
              {decision === "approved" ? <Check aria-hidden="true" /> : decision === "rejected" ? <X aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {saving ? "Speichern …" : decisionLabel(decision)}
            </button>
          ))}
        </div>
      </footer>
    </Dialog>
  );
}
