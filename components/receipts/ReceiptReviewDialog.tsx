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
  if (decision === "approved") return "Approved";
  if (decision === "rejected") return "Invalid";
  return "Pending review";
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
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
      label="Review receipt"
      onClose={() => { if (!saving) onClose(); }}
      overlayClassName={styles.overlay}
      dialogClassName={styles.dialog}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Receipt review</span>
          <h2>Review receipt</h2>
          <p>{receipt.file}</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} disabled={saving} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={styles.previewFrame}>
        {previewLoading ? (
          <div className={styles.previewState} role="status">Loading receipt…</div>
        ) : previewUrl ? (
          isPdf ? (
            <iframe title={`Vorschau by ${receipt.file}`} src={previewUrl} />
          ) : (
            <>
              {/* Signed storage URLs are runtime-specific, so this preview remains a native image. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs are not known to next/image at build time. */}
              <img width="1200" height="900" src={previewUrl} alt={`Receipt preview ${receipt.file}`} />
            </>
          )
        ) : (
          <div className={styles.previewState}>
            <CircleAlert aria-hidden="true" />
            <span>{previewError || "The preview could not be loaded."}</span>
          </div>
        )}
      </div>

      <div className={styles.meta}>
        <div><span>Transaction</span><strong>{receipt.transaction}</strong></div>
        <div><span>Date</span><strong>{receipt.date}</strong></div>
        <div><span>Amount</span><strong>{receipt.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong></div>
        <div><span>Current status</span><strong>{receipt.status}</strong></div>
        {receipt.createdByName ? <div><span>Created by</span><strong>{receipt.createdByName}</strong><small>{formatTimestamp(receipt.createdAt)}</small></div> : null}
        {receipt.uploadedByName ? <div><span>Uploaded by</span><strong>{receipt.uploadedByName}</strong><small>{formatTimestamp(receipt.uploadedAt)}</small></div> : null}
        {receipt.reviewedByName ? <div><span>Reviewed by</span><strong>{receipt.reviewedByName}</strong><small>{formatTimestamp(receipt.reviewedAt)}</small></div> : null}
      </div>

      {previewUrl ? (
        <a className={styles.downloadLink} href={previewUrl} target="_blank" rel="noreferrer" download={receipt.file}>
          <Download aria-hidden="true" />
          Receipt herunterladen
        </a>
      ) : null}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <footer className={styles.footer}>
        <span className={styles.footerHint}>Save decision</span>
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
              {saving ? "Save …" : decisionLabel(decision)}
            </button>
          ))}
        </div>
      </footer>
    </Dialog>
  );
}
