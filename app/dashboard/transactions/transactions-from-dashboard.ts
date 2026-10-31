import { toTransaction } from "@/features/finance/transactions/view-model";
import type { DashboardData } from "./types";

export function transactionsFromDashboard(data: DashboardData) {
  return data.transactions.map(toTransaction);
}
