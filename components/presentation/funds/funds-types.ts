import type { ReactNode } from "react";
import type { AccountCardDetails } from "@/components/dashboard/account-card-details";

export type FundsCard = {
  id: string;
  details: Pick<AccountCardDetails, "accountName"> & Partial<Omit<AccountCardDetails, "accountName">>;
  balance: number;
  lastCountAt?: string;
  lastCountDifference?: number;
};

export type FundsCashBox = {
  id: string;
  name: string;
  balance: number;
  responsible: string;
  lastCountDate: string;
  countStatus: "matched" | "discrepancy";
  difference: number;
};

export type FundsAudit = {
  id: string;
  date: string;
  auditor: string;
  countedAmount: number;
  bookBalance: number;
  difference: number;
  note?: string;
};

export type AdaptiveFundsViewProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  cards: FundsCard[];
  activeCard: FundsCard | undefined;
  activeCardIndex: number;
  cashBox: FundsCashBox;
  auditLogs: FundsAudit[];
  dollar: (value: number) => string;
  differencePanel?: ReactNode;
  onSelectCard: (index: number) => void;
  onAddCard: () => void;
  onEditCard: () => void;
  onCountCash: () => void;
};

