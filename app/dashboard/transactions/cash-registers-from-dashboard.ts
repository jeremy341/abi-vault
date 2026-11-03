import type { DashboardData } from "./types";

export function cashRegistersFromDashboard(data: DashboardData) {
  return data.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }));
}
