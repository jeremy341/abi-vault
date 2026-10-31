import type { DashboardResult } from "@/features/finance/actions/queries";
import type { TransactionFilters } from "@/features/finance/transactions/filter-transactions";

export type DashboardData = Extract<DashboardResult, { ok: true }>;

export type DraftFilters = Pick<
  TransactionFilters,
  | "categories"
  | "types"
  | "start"
  | "end"
  | "minimumAmount"
  | "maximumAmount"
  | "receipt"
  | "review"
>;
