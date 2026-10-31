"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectCategoryTotals, projectMonthlyFlowMinor, projectWalletBalances } from "@/lib/finance/projections";
import { listGoalsForCurrentOrganization, listTransactionsForCurrentOrganization, listWalletsForCurrentOrganization } from "./finance-queries";
import { querySuccess } from "@/lib/finance/query-result";
import { financeDateKey } from "@/lib/finance/date-keys";
import { mapFinanceSnapshotWallet, readFinanceSnapshot } from "./finance-snapshot";

function formatShortMonth(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).replace(".", "");
}

export async function getReportKpisForCurrentOrganization() {
  if (isDemoData()) return demoData.reportKpis;

  await requireClerkContext();

  const supabase = await createSupabaseServerClient();

  const snapshot = await readFinanceSnapshot(supabase);

  if (!snapshot.ok) return snapshot;

  return querySuccess({
    incomeMinor: snapshot.incomeMinor,
    expenseMinor: snapshot.expenseMinor,
    netMinor: snapshot.netMinor,
    liquidMinor: snapshot.liquidMinor,
    walletCount: snapshot.walletCount,
    reviewCount: snapshot.pendingReceiptCount,
    reviewedReceiptCount: snapshot.reviewedReceiptCount,
    unassignedReceiptCount: snapshot.unassignedReceiptCount,
    reconciliationPercent: snapshot.reconciliationPercent,
  });
}

export async function getDashboardSnapshot() {
  const [transactions, goals, financeSnapshot] = await Promise.all([
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
    isDemoData()
      ? Promise.resolve(null)
      : createSupabaseServerClient().then(readFinanceSnapshot),
  ]);

  if (!transactions.ok || !goals.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard snapshot query failed", {
        transactions: transactions.ok ? "ok" : transactions.error,
        goals: goals.ok ? "ok" : goals.error,
      });
    }

    return { ok: false as const };
  }

  if (financeSnapshot && !financeSnapshot.ok) return { ok: false as const };

  const hasFinanceWallets = financeSnapshot?.ok && financeSnapshot.wallets.length > 0;

  const wallets = hasFinanceWallets
    ? querySuccess({ items: financeSnapshot.wallets.map(mapFinanceSnapshotWallet) })
    : await listWalletsForCurrentOrganization({ includeBalances: false });

  if (!wallets.ok) return { ok: false as const };

  const projectionTransactions = hasFinanceWallets
    ? []
    : transactions.items.map((transaction) => ({
        amountMinor: transaction.amountMinor,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        fromWalletId: transaction.fromWalletId ?? null,
        toWalletId: transaction.toWalletId ?? null,
      }));

  const categories = hasFinanceWallets
    ? financeSnapshot.categories
    : projectCategoryTotals(projectionTransactions);

  const balances = hasFinanceWallets
    ? new Map(financeSnapshot.wallets.map((wallet) => [wallet.id, BigInt(wallet.balanceMinor)]))
    : projectWalletBalances(
        wallets.items.map((wallet) => ({
          id: wallet.id,
          openingBalanceMinor: wallet.openingBalanceMinor,
        })),
        projectionTransactions,
      );

  return querySuccess({
    wallets: wallets.items.map((wallet) => ({
      ...wallet,
      balanceMinor: (balances.get(wallet.id) ?? BigInt(0)).toString(),
    })),
    transactions: transactions.items,
    goals: goals.items,
    categories,
  });
}

export async function getReportSnapshot() {
  const [goals, financeSnapshot] = await Promise.all([
    listGoalsForCurrentOrganization(),
    isDemoData()
      ? Promise.resolve(null)
      : createSupabaseServerClient().then(readFinanceSnapshot),
  ]);

  if (!goals.ok) return { ok: false as const };

  if (financeSnapshot && !financeSnapshot.ok) return { ok: false as const };

  const goalItems = goals.items.map((goal) => ({
    name: goal.title,
    saved: Number(goal.saved_amount_minor) / 100,
    target: Number(goal.target_amount_minor) / 100,
  }));

  if (financeSnapshot?.ok && financeSnapshot.wallets.length > 0) {
    if (!financeSnapshot.transactionCount) {
      return querySuccess({
        cashflow: [],
        categories: [],
        goals: goalItems,
        analysisBalance: [],
        analysisFlow: [],
        reviewItems: [],
      });
    }

    const cashflow = financeSnapshot.monthlyFlow.map((month) => {
      const date = new Date(`${month.monthKey}-01T00:00:00.000Z`);
      const monthLabel = formatShortMonth(date);

      return {
        month: monthLabel,
        year: month.year,
        income: Number(month.incomeMinor) / 100,
        expenses: Number(month.expensesMinor) / 100,
      };
    });

    const categories = financeSnapshot.categories.map((category) => ({
      name: category.name,
      amount: Number(category.amountMinor) / 100,
      share: category.progress,
    }));

    const analysisBalance = financeSnapshot.analysisBalance.map((month) => {
      const date = new Date(`${month.monthKey}-01T00:00:00.000Z`);
      const monthLabel = formatShortMonth(date);

      return {
        month: `${monthLabel} ${date.getUTCFullYear()}`,
        balance: Number(month.balanceMinor) / 100,
      };
    });

    return querySuccess({
      cashflow,
      categories,
      goals: goalItems,
      analysisBalance,
      analysisFlow: cashflow,
      reviewItems: [],
    });
  }

  const wallets = await listWalletsForCurrentOrganization({ includeBalances: false });

  if (!wallets.ok) return { ok: false as const };

  const transactions = await listTransactionsForCurrentOrganization();

  if (!transactions.ok) return { ok: false as const };

  const currentDateKey = financeDateKey(new Date());

  const [currentYear, currentMonth] = currentDateKey.split("-").map(Number);

  const months = Array.from({ length: 6 }, (_, monthIndex) => {
    const date = new Date(Date.UTC(currentYear, currentMonth - 6 + monthIndex, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = formatShortMonth(date);

    return { key, label, year: date.getUTCFullYear() };
  });

  const projectionTransactions = transactions.items.map((transaction) => ({
    amountMinor: transaction.amountMinor,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    fromWalletId: transaction.fromWalletId ?? null,
    toWalletId: transaction.toWalletId ?? null,
  }));

  const monthlyFlow = projectMonthlyFlowMinor(projectionTransactions, months);

  const cashflow = monthlyFlow.map((month) => ({
    month: month.month,
    year: month.year,
    income: Number(month.incomeMinor) / 100,
    expenses: Number(month.expensesMinor) / 100,
  }));

  if (!transactions.items.length) {
    return querySuccess({
      cashflow: [],
      categories: [],
      goals: goalItems,
      analysisBalance: [],
      analysisFlow: [],
      reviewItems: [],
    });
  }

  const categoryTotals = projectCategoryTotals(projectionTransactions);

  const categories = categoryTotals.map((category) => ({
    name: category.name,
    amount: Number(category.amountMinor) / 100,
    share: category.progress,
  }));

  let balanceMinor = BigInt(0);

  for (const wallet of wallets.items) {
    balanceMinor += BigInt(String(wallet.openingBalanceMinor));
  }

  for (const transaction of transactions.items) {
    if (transaction.date && transaction.date.slice(0, 7) >= months[0].key) continue;

    const recordedAmount = BigInt(transaction.amountMinor);

    const amountMinor = recordedAmount < BigInt(0) ? -recordedAmount : recordedAmount;

    if (transaction.type === "income") balanceMinor += amountMinor;

    if (transaction.type === "expense") balanceMinor -= amountMinor;
  }

  const analysisBalance = monthlyFlow.map((month) => {
    balanceMinor += month.incomeMinor - month.expensesMinor;

    return {
      month: `${month.month} ${month.year}`,
      balance: Number(balanceMinor) / 100,
    };
  });

  return querySuccess({
    cashflow,
    categories,
    goals: goalItems,
    analysisBalance,
    analysisFlow: cashflow,
    reviewItems: [],
  });
}
