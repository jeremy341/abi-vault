import type { ReactNode } from "react";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";

export type FundsCard = {
  id: string;
  details: Pick<AccountCardDetails, "accountName"> & Partial<Omit<AccountCardDetails, "accountName">>;
  balance: number;
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

export type FundsActivity = {
  label: string;
  meta: string;
  date: string;
  type: string;
  description: string;
  user: string;
  amount: number;
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
  activities: FundsActivity[];
  dollar: (value: number) => string;
  differencePanel?: ReactNode;
  onSwitchCard: (direction: -1 | 1) => void;
  onSelectCard: (index: number) => void;
  onAddCard: () => void;
  onEditCard: () => void;
  onCountCash: () => void;
};

