"use client";

import { CircleAlert, Download, X } from "lucide-react";
import { useState } from "react";
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

function formatReceiptDate(dateText: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateText);

  if (!match) return dateText;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  return Number.isNaN(date.getTime())
    ? dateText
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return "";
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? timestamp
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
  const [pendingDecision, setPendingDecision] = useState<ReceiptReviewDecision | null>(null);

  function decide(decision: ReceiptReviewDecision) {
    setPendingDecision(decision);
    onDecision(decision);
  }

  return (
    <Dialog
      label="Review receipt"
      onClose={() => { if (!saving) onClose(); }}
      overlayClassName={styles.overlay}
      dialogClassName={styles.dialog}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2>Review receipt</h2>
          <p>{receipt.file}</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} disabled={saving} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.previewFrame}>
          {previewLoading ? (
            <div className={styles.previewState} role="status">Loading receipt</div>
          ) : previewUrl ? (
            isPdf ? (
              <iframe title={`Preview of ${receipt.file}`} src={previewUrl} />
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

        <dl className={styles.meta}>
          <div><dt>Transaction</dt><dd>{receipt.transaction}</dd></div>
          <div><dt>Date</dt><dd>{formatReceiptDate(receipt.date)}</dd></div>
          <div><dt>Amount</dt><dd className={styles.amount}>{receipt.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</dd></div>
          <div><dt>Status</dt><dd className={receipt.status === "Approved" ? undefined : styles.attention}>{receipt.status}</dd></div>
          {receipt.createdByName ? <div><dt>Created by</dt><dd>{receipt.createdByName}</dd>{receipt.createdAt ? <dd className={styles.when}>{formatTimestamp(receipt.createdAt)}</dd> : null}</div> : null}
          {receipt.uploadedByName ? <div><dt>Uploaded by</dt><dd>{receipt.uploadedByName}</dd>{receipt.uploadedAt ? <dd className={styles.when}>{formatTimestamp(receipt.uploadedAt)}</dd> : null}</div> : null}
          {receipt.reviewedByName ? <div><dt>Reviewed by</dt><dd>{receipt.reviewedByName}</dd>{receipt.reviewedAt ? <dd className={styles.when}>{formatTimestamp(receipt.reviewedAt)}</dd> : null}</div> : null}
          {previewUrl ? (
            <div>
              <dt className="sr-only">File</dt>
              <dd>
                <a className={styles.downloadLink} href={previewUrl} target="_blank" rel="noreferrer" download={receipt.file}>
                  <Download aria-hidden="true" />
                  Download receipt
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <footer className={styles.footer}>
        <button
            type="button"
            className={styles.textButton}
            onClick={() => decide("pending")}
            disabled={saving}
          >
            {saving && pendingDecision === "pending" ? "Saving" : "Mark as pending"}
          </button>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            Close
          </button>
          <button
            type="button"
            className={styles.rejectButton}
            onClick={() => decide("rejected")}
            disabled={saving}
            aria-busy={saving && pendingDecision === "rejected"}
          >
            {saving && pendingDecision === "rejected" ? "Saving" : "Reject"}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => decide("approved")}
            disabled={saving}
            aria-busy={saving && pendingDecision === "approved"}
          >
            {saving && pendingDecision === "approved" ? "Saving" : "Approve"}
          </button>
        </div>
      </footer>
    </Dialog>
  );
}
