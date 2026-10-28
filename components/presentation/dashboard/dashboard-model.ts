import type { DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";

export type DashboardReviewSnapshot = {
  transactions: Array<{
    title: string;
    reviewStatus: string;
    receipt: boolean;
  }>;
};

const MINUS = "−";

export function formatMoney(value: string) {
  const amount = Number(value) / 100;

  const formatted = Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return amount < 0 ? `${MINUS}${formatted}` : formatted;
}

export function formatSignedMoney(value: string) {
  const amount = Number(value);

  return `${amount < 0 ? MINUS : "+"}${formatMoney(String(Math.abs(amount)))}`;
}

export function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function transactionRows(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];

  return snapshot.transactions.map((transaction) => ({
    id: transaction.id,
    title: transaction.title,
    category: transaction.category,
    date: formatDate(transaction.date),
    amount: formatSignedMoney(transaction.amountMinor),
    income: Number(transaction.amountMinor) >= 0,
  }));
}

export function goalRows(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];

  return snapshot.goals.map((goal) => {
    const target = Number(goal.target_amount_minor);
    const saved = Number(goal.saved_amount_minor);

    return {
      id: goal.id,
      title: goal.title,
      detail: `${formatMoney(String(saved))} of ${formatMoney(String(target))}`,
      progress: target ? Math.min(100, Math.round((saved / target) * 100)) : 0,
      deadline: formatDate(goal.deadline),
    };
  });
}

export function categoryRows(snapshot: DashboardSnapshot | null) {
  if (!snapshot) return [];

  return snapshot.categories.map((category) => ({
    title: category.name,
    amount: formatMoney(category.amountMinor),
    progress: category.progress,
  }));
}

export function cashRegisters(snapshot: DashboardSnapshot | null) {
  return snapshot?.wallets.filter((wallet) => wallet.type === "cash") ?? [];
}

export function displayDashboardReviews(snapshot: DashboardReviewSnapshot | null) {
  if (!snapshot) return [];

  return snapshot.transactions
    .filter((transaction) => transaction.reviewStatus !== "Approved")
    .map((transaction) => ({
      title: transaction.title,
      detail: transaction.receipt
        ? "Receipt status pending"
        : "Cash payment without receipt",
      href: "/dashboard/transactions",
    }));
}
