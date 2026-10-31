export type Category = string;

export type FilterType = "Income" | "Expenses";

export type ReceiptFilter = "All" | "Vorhanden" | "Fehlt";

export type ReviewFilter = "All" | "Approved" | "Pending review" | "Invalid";

export type Transaction = {
  id: number | string;
  title: string;
  category: string;
  date: string;
  amount: number;
  receipt?: string;
  receiptId: string | null;
  receiptType: string | null;
  reviewStatus: string;
  createdByName: string | null;
  createdAt: string;
  account: string;
  walletId: string | null;
  type: "income" | "expense" | "transfer";
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

type ServerTransaction = {
  id: string;
  title: string;
  category: string;
  date: string;
  amountMinor: string;
  type: "income" | "expense" | "transfer";
  receipt: boolean;
  receiptFile: string | null;
  receiptId: string | null;
  receiptType: string | null;
  reviewStatus: string;
  createdByName: string | null;
  createdAt: string;
  account: string;
  walletId: string | null;
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

export const categoryFilterOptions: readonly Category[] = [
  "Material",
  "Sonstiges",
  "Veranstaltung",
];

export const transactionTypeFilterOptions: readonly FilterType[] = [
  "Income",
  "Expenses",
];

export const receiptFilterOptions: readonly ReceiptFilter[] = [
  "All",
  "Vorhanden",
  "Fehlt",
];

export const reviewFilterOptions: readonly ReviewFilter[] = [
  "All",
  "Approved",
  "Pending review",
  "Invalid",
];

export function toTransaction(serverTransaction: ServerTransaction): Transaction {
  return {
    id: serverTransaction.id,
    title: serverTransaction.title,
    category: serverTransaction.category,
    date: serverTransaction.date
      ? formatShortDate(fromIso(serverTransaction.date))
      : formatShortDate(new Date()),
    amount: Number(serverTransaction.amountMinor) / 100,
    receipt: serverTransaction.receiptFile ?? (serverTransaction.receipt ? "receipt" : undefined),
    receiptId: serverTransaction.receiptId,
    receiptType: serverTransaction.receiptType,
    reviewStatus: serverTransaction.reviewStatus,
    createdByName: serverTransaction.createdByName,
    createdAt: serverTransaction.createdAt,
    account: serverTransaction.account,
    walletId: serverTransaction.walletId,
    type: serverTransaction.type,
    createdBy: serverTransaction.createdBy,
    canEdit: serverTransaction.canEdit,
    canDelete: serverTransaction.canDelete,
  };
}

export const parseDate = (value: string) => {
  const [day, month, year] = value.split(".").map(Number);

  return new Date(year, month - 1, day);
};

export const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const formatShortDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

const money = (amount: number) =>
  `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatAmount = (amount: number) => `${amount >= 0 ? "+" : "−"}${money(amount)}`;

export const formatTotal = (amount: number) => money(amount);

export const formatLongDate = (value: string) =>
  parseDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
