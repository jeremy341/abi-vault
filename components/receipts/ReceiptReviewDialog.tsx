"use client";

import { CircleAlert, Download, X } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import type {
  ReceiptReviewDecision,
  ReceiptReviewDialogReceipt,
} from "@/features/receipts/view-model";
import styles from "./ReceiptReviewDialog.module.css";

export type { ReceiptReviewDecision } from "@/features/receipts/view-model";

export type { ReceiptReviewDialogReceipt } from "@/features/receipts/view-model";

type ReceiptReviewDialogProps = {
  receipt: ReceiptReviewDialogReceipt;
  previewUrl: string | null;
  downloadUrl?: string | null;
  previewAsImage?: boolean;
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

  if (Number.isNaN(date.getTime())) return dateText;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return "";
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function renderActivityRow(
  label: string,
  name: string | null | undefined,
  timestamp: string | null | undefined,
) {
  if (!name) return null;

  return (
    <div>
      <dt>{label}</dt>
      <dd>{name}</dd>
      {timestamp ? <dd className={styles.when}>{formatTimestamp(timestamp)}</dd> : null}
    </div>
  );
}

export function ReceiptReviewDialog({
  receipt,
  previewUrl,
  downloadUrl = null,
  previewAsImage = false,
  previewLoading,
  previewError,
  saving,
  error,
  onClose,
  onDecision,
}: ReceiptReviewDialogProps) {
  const showImagePreview = previewAsImage || receipt.type !== "PDF";
  const [pendingDecision, setPendingDecision] = useState<ReceiptReviewDecision | null>(null);

  function decide(decision: ReceiptReviewDecision) {
    setPendingDecision(decision);
    onDecision(decision);
  }

  function renderPreview() {
    if (previewLoading) {
      return <div className={styles.previewState} role="status">Loading receipt</div>;
    }

    if (!previewUrl) {
      return (
        <div className={styles.previewState}>
          <CircleAlert aria-hidden="true" />
          <span>{previewError || "The preview could not be loaded."}</span>
        </div>
      );
    }

    if (!showImagePreview) {
      return <iframe title={`Preview of ${receipt.file}`} src={previewUrl} />;
    }

    return (
      <>
        {/* Signed storage URLs are runtime-specific, so this preview remains a native image. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs are not known to next/image at build time. */}
        <img width="1200" height="900" src={previewUrl} alt={`Receipt preview ${receipt.file}`} />
      </>
    );
  }

  return (
    <Dialog
      label="Review receipt"
      onClose={() => {
        if (!saving) onClose();
      }}
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
          {renderPreview()}
        </div>

        <dl className={styles.meta}>
          <div><dt>Transaction</dt><dd>{receipt.transaction}</dd></div>
          <div><dt>Date</dt><dd>{formatReceiptDate(receipt.date)}</dd></div>
          <div><dt>Amount</dt><dd className={styles.amount}>{receipt.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</dd></div>
          <div><dt>Status</dt><dd className={receipt.status === "Approved" ? undefined : styles.attention}>{receipt.status}</dd></div>
          {renderActivityRow("Created by", receipt.createdByName, receipt.createdAt)}
          {renderActivityRow("Uploaded by", receipt.uploadedByName, receipt.uploadedAt)}
          {renderActivityRow("Reviewed by", receipt.reviewedByName, receipt.reviewedAt)}
          {previewUrl ? (
            <div>
              <dt className="sr-only">File</dt>
              <dd>
                <a className={styles.downloadLink} href={downloadUrl ?? previewUrl} target="_blank" rel="noreferrer" download={receipt.file}>
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
