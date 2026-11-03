import type { DashboardResult } from "@/features/finance/actions/queries";

export type CashAuditEntry = {
  id: string;
  date: string;
  auditor: string;
  countedAmount: number;
  bookBalance: number;
  difference: number;
  note?: string;
};

export type DashboardData = Extract<DashboardResult, { ok: true }>;
