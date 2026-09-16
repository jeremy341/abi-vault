import {
  FileText,
  HandCoins,
  MoreHorizontal,
} from "lucide-react";
import { dashboardCategories } from "@/components/dashboard/DashboardPanels";
import type {
  DashboardSnapshot,
} from "@/hooks/use-dashboard-snapshot";

export type DashboardReviewSnapshot = {
  transactions: Array<{
    title: string;
    reviewStatus: string;
    receipt: boolean;
  }>;
};

export function displayMinor(value: string) {
  return (Number(value) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatLastTransaction(date: string | undefined) {
  if (!date) return "No transactions yet";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No transactions yet";

  const days = Math.max(
    0,
    Math.floor((Date.now() - parsed.getTime()) / 86_400_000),
  );
  const time = parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (days === 0) return `${time}, today`;
  if (days === 1) return `${time}, 1 day ago`;
  return `${time}, ${days} days ago`;
}

export function displayDashboardTransactions(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.transactions.map((item) => ({
    title: item.title,
    category: item.category,
    date: item.date,
    amount: `${Number(item.amountMinor) >= 0 ? "+" : ""}${displayMinor(item.amountMinor)}`,
    tone: Number(item.amountMinor) >= 0 ? "green" : "violet",
    icon: Number(item.amountMinor) >= 0 ? HandCoins : FileText,
  }));
}

export function displayDashboardGoals(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.goals.map((goal) => {
    const target = Number(goal.target_amount_minor) / 100;
    const saved = Number(goal.saved_amount_minor) / 100;
    return {
      title: goal.title,
      target: target.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      saved: `${saved.toLocaleString("en-US", { style: "currency", currency: "USD" })} saved`,
      progress: target ? Math.round((saved / target) * 100) : 0,
      date: new Date(`${goal.deadline}T00:00:00`).toLocaleDateString("en-GB"),
    };
  });
}

export function displayDashboardCategories(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.categories.map((item, index) => ({
    title: item.name,
    amount: displayMinor(item.amountMinor),
    progress: item.progress,
    color:
      dashboardCategories[index % dashboardCategories.length]?.color ??
      "bg-[var(--chart-2)]",
    bubble:
      dashboardCategories[index % dashboardCategories.length]?.bubble ??
      "bg-[var(--ui-surface-muted)] text-ink",
    icon:
      dashboardCategories[index % dashboardCategories.length]?.icon ??
      MoreHorizontal,
  }));
}

export function primaryCashWallet(snapshot: DashboardSnapshot | null) {
  return snapshot?.wallets.find((wallet) => wallet.type === "cash") ?? null;
}

export function displayDashboardReviews(snapshot: DashboardReviewSnapshot | null) {
  if (!snapshot) return [];
  return snapshot.transactions
    .filter((item) => item.reviewStatus !== "Approved")
    .map((item) => ({
      title: item.title,
      detail: item.receipt
        ? "Receipt status pending"
        : "Cash payment without receipt",
      href: "/dashboard/transactions",
    }));
}
