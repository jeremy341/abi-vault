"use client";

import { useEffect, useRef, useState } from "react";
import {
  createReceiptDownloadUrl,
  reviewReceipt,
} from "@/features/receipts/actions/receipts";
import { invalidateFinanceQuery } from "@/lib/finance/client-cache";
import type {
  ReceiptReviewDecision,
  ReceiptReviewTarget,
  ReceiptStatus,
} from "./view-model";

type UseReceiptReviewOptions = {
  onStatusChange: (receiptId: string, status: ReceiptStatus) => void;
};

function statusForDecision(decision: ReceiptReviewDecision): ReceiptStatus {
  if (decision === "approved") return "Approved";

  if (decision === "rejected") return "Invalid";

  return "Pending review";
}

export function useReceiptReview({ onStatusChange }: UseReceiptReviewOptions) {
  const [target, setTarget] = useState<ReceiptReviewTarget | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewAsImage, setPreviewAsImage] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const previewRequestId = useRef(0);

  useEffect(() => {
    return () => {
      previewRequestId.current += 1;
    };
  }, []);

  async function open(receipt: ReceiptReviewTarget) {
    const requestId = previewRequestId.current + 1;
    previewRequestId.current = requestId;
    setTarget(receipt);
    setPreviewUrl(null);
    setDownloadUrl(null);
    setPreviewAsImage(false);
    setPreviewLoading(true);
    setPreviewError("");
    setError("");

    try {
      const result = await createReceiptDownloadUrl(receipt.id);

      // Ignore an older request if another receipt was opened first.
      if (previewRequestId.current !== requestId) return;

      if (result.success) {
        setPreviewUrl(result.data.previewUrl ?? result.data.url);
        setDownloadUrl(result.data.url);
        setPreviewAsImage(result.data.previewAsImage ?? false);
      } else {
        setPreviewError(result.error.message);
      }
    } catch {
      if (previewRequestId.current === requestId) {
        setPreviewError("The preview could not be loaded.");
      }
    } finally {
      if (previewRequestId.current === requestId) setPreviewLoading(false);
    }
  }

  function close() {
    previewRequestId.current += 1;
    setTarget(null);
    setPreviewUrl(null);
    setDownloadUrl(null);
    setPreviewAsImage(false);
    setPreviewLoading(false);
    setPreviewError("");
    setError("");
  }

  async function decide(decision: ReceiptReviewDecision) {
    if (!target || saving) return;

    setSaving(true);
    setError("");

    try {
      const result = await reviewReceipt({
        receiptId: target.id,
        status: decision,
      });

      if (!result.success) {
        setError(result.error.message);

        return;
      }

      onStatusChange(target.id, statusForDecision(decision));
      invalidateFinanceQuery(
        "receipts",
        "transactions",
        "dashboard-snapshot",
        "report-snapshot",
        "report-kpis",
      );
      close();
    } catch {
      setError("The receipt review could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return {
    target,
    previewUrl,
    downloadUrl,
    previewAsImage,
    previewLoading,
    previewError,
    error,
    saving,
    open,
    close,
    decide,
  };
}
