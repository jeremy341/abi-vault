export type TransactionListItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  amountMinor: string;
  type: "income" | "expense" | "transfer";
  receipt: boolean;
  receiptId: string | null;
  receiptFile: string | null;
  receiptType: string | null;
  reviewStatus: "Approved" | "Pending review" | "Invalid";
  createdByName: string | null;
  createdAt: string;
  account: string;
  walletId: string | null;
  fromWalletId?: string | null;
  toWalletId?: string | null;
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type CashCountListItem = {
  id: string;
  walletId: string;
  countedAmountMinor: string;
  bookAmountMinor: string;
  differenceMinor: string;
  countedByName: string | null;
  createdAt: string;
  note: string | null;
};

export type AccountingPeriodListItem = {
  id: string;
  year: number;
  month: number;
  status: "open" | "locked";
  lockedAt: string | null;
  lockedByName: string | null;
  lockReason: string | null;
};

// SAFETY: Supabase query selections and membership checks establish the row shapes used below.
