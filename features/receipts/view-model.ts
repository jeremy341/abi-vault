import { financeDateKey } from "@/lib/finance/date-keys";

export type ReceiptStatus = "Approved" | "Pending review" | "Invalid" | "Unassigned";

export type ReceiptFileType = "PDF" | "JPG" | "PNG";

export type ReceiptReviewDecision = "approved" | "rejected" | "pending";

export type Receipt = {
  id: number | string;
  file: string;
  type: ReceiptFileType;
  size: string;
  transaction: string;
  date: string;
  dateKey: string;
  amount: number;
  status: ReceiptStatus;
  transactionId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  uploadedByName: string;
  uploadedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
};

export type ReceiptReviewDialogReceipt = {
  file: string;
  type: ReceiptFileType;
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

export type ReceiptReviewTarget = {
  id: string;
  receipt: ReceiptReviewDialogReceipt;
};

export type TransactionOption = {
  value: string;
  label: string;
  date: string;
  amount: string;
};

type ServerReceipt = {
  id: string;
  file: string;
  type: ReceiptFileType;
  sizeBytes: number;
  transaction: string;
  transactionId: string | null;
  assigned: boolean;
  date: string;
  amountMinor: string;
  status: string;
  canEdit: boolean;
  canDelete: boolean;
  uploadedByName: string;
  uploadedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
};

export const statusOptions: readonly string[] = [
  "All",
  "Approved",
  "Pending review",
  "Invalid",
  "Unassigned",
];

export const periodOptions: readonly string[] = [
  "All",
  "This month",
  "Last month",
  "This year",
];

export function formatShortDate(value: string) {
  const [year, month, day] = financeDateKey(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

export function toReceipt(receipt: ServerReceipt): Receipt {
  const dateKey = receipt.date
    ? financeDateKey(receipt.date)
    : financeDateKey(new Date());

  return {
    id: receipt.id,
    file: receipt.file,
    type: receipt.type,
    size: `${Math.round(receipt.sizeBytes / 1024)} KB`,
    transaction: receipt.transaction,
    transactionId: receipt.transactionId,
    date: formatShortDate(dateKey),
    dateKey,
    amount: Number(receipt.amountMinor) / 100,
    status:
      receipt.status === "approved"
        ? "Approved"
        : receipt.status === "rejected"
          ? "Invalid"
          : !receipt.assigned
            ? "Unassigned"
            : "Pending review",
    canEdit: receipt.canEdit,
    canDelete: receipt.canDelete,
    uploadedByName: receipt.uploadedByName,
    uploadedAt: receipt.uploadedAt,
    reviewedByName: receipt.reviewedByName,
    reviewedAt: receipt.reviewedAt,
  };
}

export function longDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatAmount(amount: number) {
  return `${amount < 0 ? "−" : "+"}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
