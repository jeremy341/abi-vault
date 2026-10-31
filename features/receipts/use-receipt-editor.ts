"use client";

import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { cachedFinanceQuery, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { formatAmount, formatShortDate, type Receipt, type TransactionOption } from "./view-model";
import { uploadReceipt, updateReceiptMetadata } from "./actions/receipts";

type UseReceiptEditorOptions = {
  cacheScope: string;
  setReceipts: Dispatch<SetStateAction<Receipt[]>>;
};

type DashboardSnapshot = Extract<Awaited<ReturnType<typeof getDashboardSnapshot>>, { ok: true }>;
type SnapshotTransaction = DashboardSnapshot["transactions"][number];

function transactionIdOrNull(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function refreshReceiptData() {
  invalidateFinanceQuery("receipts", "transactions", "dashboard-snapshot", "report-snapshot", "report-kpis");
}

function transactionOptionFor(item: SnapshotTransaction): TransactionOption {
  return {
    value: item.id,
    label: item.title,
    date: item.date ? formatShortDate(item.date) : "",
    amount: formatAmount(Number(item.amountMinor) / 100),
  };
}

function transactionOptionsFor(snapshot: DashboardSnapshot): TransactionOption[] {
  const unassigned: TransactionOption = { value: "", label: "Unassigned", date: "", amount: "" };

  return [unassigned, ...snapshot.transactions.map(transactionOptionFor)];
}

function receiptWithMetadata(
  item: Receipt,
  fileName: string,
  transactionId: string | null,
  transactionLabel: string,
): Receipt {
  return {
    ...item,
    file: fileName,
    transactionId,
    transaction: transactionLabel,
    status: transactionId ? item.status : "Unassigned",
  };
}

function buildUploadForm(file: File, fileName: string, transactionId: string | null) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("fileName", fileName);

  if (transactionId) formData.append("transactionId", transactionId);

  return formData;
}

function focusedElementOrNull() {
  const focusedElement = document.activeElement;

  return focusedElement instanceof HTMLElement ? focusedElement : null;
}

function handleImagePreviewKey(event: KeyboardEvent, closePreview: () => void) {
  if (event.key === "Escape") {
    event.stopPropagation();
    closePreview();
  }

  if (event.key === "Tab") event.preventDefault();
}

export function useReceiptEditor({ cacheScope, setReceipts }: UseReceiptEditorOptions) {
  const [open, setOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [transaction, setTransaction] = useState("");
  const [availableTransactions, setAvailableTransactions] = useState<readonly TransactionOption[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactionLoadError, setTransactionLoadError] = useState("");
  const [editorError, setEditorError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, {
      scope: cacheScope,
    })
      .then((snapshot) => {
        if (!active) return;

        if (!snapshot.ok) {
          setTransactionLoadError("Transactions could not be loaded.");

          return;
        }

        setTransactionLoadError("");
        setAvailableTransactions(transactionOptionsFor(snapshot));
      })
      .catch(() => {
        if (active) setTransactionLoadError("Transactions could not be loaded.");
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheScope]);

  useEffect(() => {
    return () => {
      if (filePreviewUrlRef.current) URL.revokeObjectURL(filePreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!imagePreviewOpen) return;
    const trigger = focusedElementOrNull();

    function onKeyDown(event: KeyboardEvent) {
      handleImagePreviewKey(event, () => setImagePreviewOpen(false));
    }

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      trigger?.focus();
    };
  }, [imagePreviewOpen]);

  function releaseFilePreview() {
    if (filePreviewUrlRef.current) URL.revokeObjectURL(filePreviewUrlRef.current);
    filePreviewUrlRef.current = null;
    setFilePreviewUrl(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;
    releaseFilePreview();

    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      filePreviewUrlRef.current = previewUrl;
      setFilePreviewUrl(previewUrl);
    }

    setSelectedFile(file);
    setFileName(file.name);
  }

  function clearSelectedFile() {
    releaseFilePreview();
    setSelectedFile(null);
    setImagePreviewOpen(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openAdd() {
    clearSelectedFile();
    setEditingReceipt(null);
    setFileName("");
    setTransaction("");
    setEditorError("");
    setOpen(true);
  }

  function openEdit(receipt: Receipt) {
    clearSelectedFile();
    setEditingReceipt(receipt);
    setFileName(receipt.file);
    setTransaction(receipt.transactionId ?? "");
    setEditorError("");
    setOpen(true);
  }

  function removeSelectedFile() {
    clearSelectedFile();
    setFileName("");
  }

  function close() {
    clearSelectedFile();
    setOpen(false);
    setEditingReceipt(null);
    setFileName("");
    setTransaction("");
  }

  async function save() {
    if (saving) return;

    if (!fileName.trim()) {
      setEditorError("Enter a filename.");

      return;
    }

    setSaving(true);
    setEditorError("");

    try {
      if (editingReceipt) {
        await updateMetadata(editingReceipt);
      } else {
        await uploadNewFile();
      }
    } catch {
      setEditorError("The receipt could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function transactionLabelFor(transactionId: string | null) {
    const selectedTransaction = availableTransactions.find(
      (option) => option.value === transactionId,
    );

    return selectedTransaction?.label ?? "Unassigned";
  }

  async function updateMetadata(receipt: Receipt) {
    const transactionId = transactionIdOrNull(transaction);
    const newFileName = fileName.trim();
    const result = await updateReceiptMetadata({
      receiptId: receipt.id.toString(),
      fileName: newFileName,
      transactionId,
    });

    if (!result.success) {
      setEditorError(result.error.message);

      return;
    }

    const transactionLabel = transactionLabelFor(transactionId);
    setReceipts((current) => current.map((item) => {
      if (item.id !== receipt.id) return item;

      return receiptWithMetadata(item, newFileName, transactionId, transactionLabel);
    }));
    refreshReceiptData();
    close();
  }

  async function uploadNewFile() {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setEditorError("Choose a file to upload.");

      return;
    }

    const transactionId = transactionIdOrNull(transaction);
    const formData = buildUploadForm(file, fileName.trim(), transactionId);
    const result = await uploadReceipt(formData);

    if (!result.success) {
      setEditorError(result.error.message);

      return;
    }

    refreshReceiptData();
    close();
  }

  function openImagePreview() {
    setImagePreviewOpen(true);
  }

  function closeImagePreview() {
    setImagePreviewOpen(false);
  }

  return {
    open,
    editingReceipt,
    fileInputRef,
    selectedFile,
    filePreviewUrl,
    imagePreviewOpen,
    fileName,
    transaction,
    transactionsLoading,
    availableTransactions,
    error: editorError || transactionLoadError,
    saving,
    openAdd,
    openEdit,
    handleFileChange,
    setFileName,
    setTransaction,
    openImagePreview,
    closeImagePreview,
    removeSelectedFile,
    close,
    save,
  };
}
