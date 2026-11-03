"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectCategoryTotals, projectFlowTotals, projectMonthlyFlow, projectWalletBalances, type ProjectionTransaction } from "@/lib/finance/projections";
import { listGoalsForCurrentOrganization, listTransactionsForCurrentOrganization, listWalletsForCurrentOrganization } from "./finance-queries";

export async function getReportKpisForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const [
    { data: transactions, error: transactionError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
    { data: cashCounts, error: cashCountError },
  ] = await Promise.all([
    supabase.from("transactions").select("amount_minor, type, from_wallet_id, to_wallet_id").eq("organization_id", context.organizationId).eq("status", "posted").is("deleted_at", null).is("superseded_at", null).or("correction_role.is.null,correction_role.neq.reversal"),
    supabase.from("wallets").select("id, opening_balance_minor").eq("organization_id", context.organizationId).eq("type", "cash").eq("status", "active"),
    supabase.from("receipts").select("review_status, transaction_id").eq("organization_id", context.organizationId).is("archived_at", null),
    supabase.from("cash_counts").select("wallet_id, difference_minor, created_at").eq("organization_id", context.organizationId).order("created_at", { ascending: false }),
  ]);

  if (transactionError || walletError || receiptError || cashCountError) {
    return { ok: false as const, error: "DATABASE_ERROR" as const };
  }

  const activeWalletIds = new Set((wallets ?? []).map((wallet) => wallet.id));

  const effectiveTransactions = (transactions ?? []).filter((transaction) =>
    activeWalletIds.has(transaction.from_wallet_id ?? "") || activeWalletIds.has(transaction.to_wallet_id ?? ""),
  );

  const projectionTransactions: ProjectionTransaction[] = effectiveTransactions.map((transaction) => ({
    amountMinor: String(transaction.amount_minor),
    type: transaction.type,
    category: "",
    fromWalletId: transaction.from_wallet_id,
    toWalletId: transaction.to_wallet_id,
  }));

  const totals = projectFlowTotals(projectionTransactions);
  const pendingReceipts = (receipts ?? []).filter((receipt) => receipt.review_status === "pending").length;
  const reviewedReceiptCount = (receipts ?? []).filter((receipt) => receipt.review_status === "approved").length;
  const unassignedReceiptCount = (receipts ?? []).filter((receipt) => !receipt.transaction_id).length;

  const balances = projectWalletBalances(
    (wallets ?? []).map((wallet) => ({
      id: wallet.id,
      openingBalanceMinor: String(wallet.opening_balance_minor ?? 0),
    })),
    projectionTransactions,
  );

  const liquid = [...balances.entries()]
    .filter(([walletId]) => activeWalletIds.has(walletId))
    .reduce((sum, [, amount]) => sum + amount, BigInt(0));

  const latestCounts = new Map<string, { difference_minor: number }>();

  for (const count of cashCounts ?? []) {
    if (activeWalletIds.has(count.wallet_id) && !latestCounts.has(count.wallet_id)) {
      latestCounts.set(count.wallet_id, { difference_minor: count.difference_minor });
    }
  }

  const reconciliationPercent = activeWalletIds.size > 0 && latestCounts.size === activeWalletIds.size
    ? Math.round((([...latestCounts.values()].filter((count) => Number(count.difference_minor) === 0).length / activeWalletIds.size) * 100))
    : null;

  return {
    ok: true as const,
    incomeMinor: totals.incomeMinor.toString(),
    expenseMinor: totals.expenseMinor.toString(),
    netMinor: totals.netMinor.toString(),
    liquidMinor: liquid.toString(),
    walletCount: wallets?.length ?? 0,
    reviewCount: pendingReceipts,
    reviewedReceiptCount,
    unassignedReceiptCount,
    reconciliationPercent,
  };
}

export async function getDashboardSnapshot() {
  const [wallets, transactions, goals] = await Promise.all([
    listWalletsForCurrentOrganization({ includeBalances: false }),
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
  ]);

  if (!wallets.ok || !transactions.ok || !goals.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard snapshot query failed", {
        wallets: wallets.ok ? "ok" : wallets.error,
        transactions: transactions.ok ? "ok" : transactions.error,
        goals: goals.ok ? "ok" : goals.error,
      });
    }

    return { ok: false as const };
  }

  const projectionTransactions = transactions.items.map((transaction) => ({
    amountMinor: transaction.amountMinor,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    fromWalletId: transaction.fromWalletId ?? null,
    toWalletId: transaction.toWalletId ?? null,
  }));

  const categories = projectCategoryTotals(projectionTransactions);

  const balances = projectWalletBalances(
    wallets.items.map((wallet) => ({
      id: wallet.id,
      openingBalanceMinor: wallet.openingBalanceMinor,
    })),
    projectionTransactions,
  );

  return {
    ok: true as const,
    wallets: wallets.items.map((wallet) => ({
      ...wallet,
      balanceMinor: (balances.get(wallet.id) ?? BigInt(0)).toString(),
    })),
    transactions: transactions.items,
    goals: goals.items,
    categories,
  };
}

// SAFETY: report projections consume only typed results returned by the query helpers above.

export async function getReportSnapshot() {
  const [transactions, goals, wallets] = await Promise.all([
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
    listWalletsForCurrentOrganization({ includeBalances: false }),
  ]);

  if (!transactions.ok || !goals.ok || !wallets.ok) return { ok: false as const };

  const now = new Date();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-GB", { month: "short" }).replace(".", "");

    return { key, label, year: date.getFullYear() };
  });

  const projectionTransactions = transactions.items.map((transaction) => ({
    amountMinor: transaction.amountMinor,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    fromWalletId: transaction.fromWalletId ?? null,
    toWalletId: transaction.toWalletId ?? null,
  }));

  const cashflow = projectMonthlyFlow(projectionTransactions, months);

  if (!transactions.items.length) {
    return {
      ok: true as const,
      cashflow: [],
      categories: [],
      goals: goals.items.map((goal) => ({
        name: goal.title,
        saved: Number(goal.saved_amount_minor) / 100,
        target: Number(goal.target_amount_minor) / 100,
      })),
      analysisBalance: [],
      analysisFlow: [],
      reviewItems: [],
    };
  }

  const categoryTotals = projectCategoryTotals(projectionTransactions);

  const categories = categoryTotals.map((category) => ({
    name: category.name,
    amount: Number(category.amountMinor) / 100,
    share: category.progress,
  }));

  let balance = wallets.items.reduce((sum, wallet) => sum + Number(wallet.openingBalanceMinor) / 100, 0);

  for (const transaction of transactions.items) {
    if (transaction.date && transaction.date.slice(0, 7) >= months[0].key) continue;
    const amount = Math.abs(Number(transaction.amountMinor)) / 100;

    if (transaction.type === "income") balance += amount;

    if (transaction.type === "expense") balance -= amount;
  }

  const analysisBalance = cashflow.map((month, index) => {
    balance += month.income - month.expenses;

    return { month: `${month.month} ${months[index]?.year ?? now.getFullYear()}`, balance };
  });

  return {
    ok: true as const,
    cashflow,
    categories,
    goals: goals.items.map((goal) => ({
      name: goal.title,
      saved: Number(goal.saved_amount_minor) / 100,
      target: Number(goal.target_amount_minor) / 100,
    })),
    analysisBalance,
    analysisFlow: cashflow,
    reviewItems: [],
  };
}
