import type { listCashCountsForCurrentOrganization, CashCountListItem } from "@/features/finance/actions/queries";
import { mapWalletToCashRegisterCard } from "@/lib/finance/cash-register-card";
import type { CashBox } from "@/app/dashboard/funds/CashCountDialog";
import type { CashAuditEntry, DashboardData } from "@/app/dashboard/funds/funds-page-types";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const dollar = (value: number) => money.format(value).replace("-", "−");

export function formatCountDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function cashWalletsFrom(data: DashboardData) {
  return data.wallets.filter((wallet) => wallet.type === "cash");
}

export function createBlankCashBox(id: string, name: string, balance: number): CashBox {
  return {
    id,
    name,
    balance,
    responsible: "",
    lastCountDate: "",
    countStatus: "matched",
    difference: 0,
  };
}

export function cashBoxesFromDashboard(data: DashboardData) {
  const cashBoxes: Record<string, CashBox> = {};

  for (const wallet of cashWalletsFrom(data)) {
    cashBoxes[wallet.id] = toCashBox(wallet);
  }

  return cashBoxes;
}

type WalletWithCount = {
  id: string;
  name: string;
  balanceMinor: string | number;
  lastCountAt?: string | null;
  lastCountDifferenceMinor?: string | number | null;
  lastCountedByName?: string | null;
};

export function toCashBox(wallet: WalletWithCount): CashBox {
  const difference = Number(String(wallet.lastCountDifferenceMinor ?? 0)) / 100;
  const hasCount = Boolean(wallet.lastCountAt);
  const countStatus = Math.abs(difference) < 0.01 ? "matched" : "discrepancy";

  return {
    id: wallet.id,
    name: wallet.name,
    balance: Number(wallet.balanceMinor) / 100,
    responsible: wallet.lastCountedByName ?? "",
    lastCountDate: hasCount ? formatCountDate(wallet.lastCountAt!) : "",
    countStatus,
    difference: hasCount ? difference : 0,
  };
}

export function cardsFromDashboard(data: DashboardData) {
  return cashWalletsFrom(data).map(mapWalletToCashRegisterCard);
}

export function toCountEntry(count: CashCountListItem): CashAuditEntry {
  return {
    id: count.id,
    date: formatCountDate(count.createdAt),
    auditor: count.countedByName ?? "Unknown",
    countedAmount: Number(count.countedAmountMinor) / 100,
    bookBalance: Number(count.bookAmountMinor) / 100,
    difference: Number(count.differenceMinor) / 100,
    note: count.note ?? undefined,
  };
}

type CashCountData = Extract<Awaited<ReturnType<typeof listCashCountsForCurrentOrganization>>, { ok: true }>;

export function auditLogsFromQuery(data: CashCountData) {
  return data.items.map(toCountEntry);
}
