export type ProjectionTransaction = {
  amountMinor: string | number;
  type: "income" | "expense" | "transfer";
  category: string;
  date?: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
};

export type ProjectionWallet = {
  id: string;
  openingBalanceMinor: string | number;
};

export type CategoryTotal = {
  name: string;
  amountMinor: string;
  progress: number;
};

export type FlowTotals = {
  incomeMinor: bigint;
  expenseMinor: bigint;
  netMinor: bigint;
};

export type ReportMonth = {
  key: string;
  label: string;
  year: number;
};

export type MonthlyFlow = {
  month: string;
  year: number;
  income: number;
  expenses: number;
};

function toMinor(value: string | number) {
  return BigInt(String(value));
}

export function projectFlowTotals(
  transactions: readonly ProjectionTransaction[],
): FlowTotals {
  let incomeMinor = BigInt(0);
  let expenseMinor = BigInt(0);

  for (const transaction of transactions) {
    const amount = toMinor(transaction.amountMinor);
    if (transaction.type === "income") incomeMinor += amount;
    if (transaction.type === "expense") expenseMinor += amount;
  }

  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
}

export function projectWalletBalances(
  wallets: readonly ProjectionWallet[],
  transactions: readonly ProjectionTransaction[],
) {
  const balances = new Map(
    wallets.map((wallet) => [wallet.id, toMinor(wallet.openingBalanceMinor)]),
  );

  for (const transaction of transactions) {
    const amount = toMinor(transaction.amountMinor);

    if (transaction.type === "income" && transaction.toWalletId) {
      balances.set(
        transaction.toWalletId,
        (balances.get(transaction.toWalletId) ?? BigInt(0)) + amount,
      );
    }

    if (transaction.type === "expense" && transaction.fromWalletId) {
      balances.set(
        transaction.fromWalletId,
        (balances.get(transaction.fromWalletId) ?? BigInt(0)) - amount,
      );
    }

    if (transaction.type === "transfer") {
      const transferAmount = amount < BigInt(0) ? -amount : amount;

      if (transaction.fromWalletId) {
        balances.set(
          transaction.fromWalletId,
          (balances.get(transaction.fromWalletId) ?? BigInt(0)) - transferAmount,
        );
      }

      if (transaction.toWalletId) {
        balances.set(
          transaction.toWalletId,
          (balances.get(transaction.toWalletId) ?? BigInt(0)) + transferAmount,
        );
      }
    }
  }

  return balances;
}

export function projectCategoryTotals(
  transactions: readonly ProjectionTransaction[],
): CategoryTotal[] {
  const totals = new Map<string, number>();
  let totalExpense = 0;

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;

    const amount = Math.abs(Number(transaction.amountMinor));
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + amount,
    );
    totalExpense += amount;
  }

  return [...totals.entries()].map(([name, amountMinor]) => ({
    name,
    amountMinor: String(amountMinor),
    progress: totalExpense
      ? Math.round((amountMinor / totalExpense) * 100)
      : 0,
  }));
}

export function projectMonthlyFlow(
  transactions: readonly ProjectionTransaction[],
  months: readonly ReportMonth[],
): MonthlyFlow[] {
  const monthly = new Map(
    months.map((month) => [month.key, { income: 0, expenses: 0 }]),
  );

  for (const transaction of transactions) {
    const monthKey = transaction.date?.slice(0, 7);
    const flow = monthKey ? monthly.get(monthKey) : undefined;
    if (!flow) continue;

    const amount = Math.abs(Number(transaction.amountMinor)) / 100;
    if (transaction.type === "income") flow.income += amount;
    if (transaction.type === "expense") flow.expenses += amount;
  }

  return months.map((month) => ({
    month: month.label,
    year: month.year,
    ...(monthly.get(month.key) ?? { income: 0, expenses: 0 }),
  }));
}
