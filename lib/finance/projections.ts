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

export type MonthlyFlowMinor = {
  month: string;
  year: number;
  incomeMinor: bigint;
  expensesMinor: bigint;
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
  const totals = new Map<string, bigint>();
  let totalExpenseMinor = BigInt(0);

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;

    const recordedAmount = toMinor(transaction.amountMinor);
    const amount = recordedAmount < BigInt(0) ? -recordedAmount : recordedAmount;
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? BigInt(0)) + amount,
    );
    totalExpenseMinor += amount;
  }

  return [...totals.entries()].map(([name, amountMinor]) => ({
    name,
    amountMinor: amountMinor.toString(),
    progress: totalExpenseMinor
      ? Number((amountMinor * BigInt(100) + totalExpenseMinor / BigInt(2)) / totalExpenseMinor)
      : 0,
  }));
}

export function projectMonthlyFlowMinor(
  transactions: readonly ProjectionTransaction[],
  months: readonly ReportMonth[],
): MonthlyFlowMinor[] {
  const monthly = new Map(
    months.map((month) => [month.key, { incomeMinor: BigInt(0), expensesMinor: BigInt(0) }]),
  );

  for (const transaction of transactions) {
    const monthKey = transaction.date?.slice(0, 7);
    const flow = monthKey ? monthly.get(monthKey) : undefined;

    if (!flow) continue;

    const recordedAmount = toMinor(transaction.amountMinor);
    const amount = recordedAmount < BigInt(0) ? -recordedAmount : recordedAmount;

    if (transaction.type === "income") flow.incomeMinor += amount;

    if (transaction.type === "expense") flow.expensesMinor += amount;
  }

  return months.map((month) => ({
    month: month.label,
    year: month.year,
    ...(monthly.get(month.key) ?? { incomeMinor: BigInt(0), expensesMinor: BigInt(0) }),
  }));
}

export function projectMonthlyFlow(
  transactions: readonly ProjectionTransaction[],
  months: readonly ReportMonth[],
): MonthlyFlow[] {
  return projectMonthlyFlowMinor(transactions, months).map((month) => ({
    month: month.month,
    year: month.year,
    income: Number(month.incomeMinor) / 100,
    expenses: Number(month.expensesMinor) / 100,
  }));
}
