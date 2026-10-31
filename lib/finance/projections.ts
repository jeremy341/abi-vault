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

function absoluteValue(value: bigint) {
  if (value < BigInt(0)) return -value;

  return value;
}

function addAmount(amounts: Map<string, bigint>, key: string, amount: bigint) {
  const currentAmount = amounts.get(key) ?? BigInt(0);

  amounts.set(key, currentAmount + amount);
}

function toPercentOfTotal(amountMinor: bigint, totalMinor: bigint) {
  if (totalMinor === BigInt(0)) return 0;

  return Number((amountMinor * BigInt(100) + totalMinor / BigInt(2)) / totalMinor);
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
      addAmount(balances, transaction.toWalletId, amount);
    }

    if (transaction.type === "expense" && transaction.fromWalletId) {
      addAmount(balances, transaction.fromWalletId, -amount);
    }

    if (transaction.type === "transfer") {
      const transferAmount = absoluteValue(amount);

      if (transaction.fromWalletId) {
        addAmount(balances, transaction.fromWalletId, -transferAmount);
      }

      if (transaction.toWalletId) {
        addAmount(balances, transaction.toWalletId, transferAmount);
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

    const amount = absoluteValue(toMinor(transaction.amountMinor));

    addAmount(totals, transaction.category, amount);

    totalExpenseMinor += amount;
  }

  return [...totals.entries()].map(([name, amountMinor]) => ({
    name,
    amountMinor: amountMinor.toString(),
    progress: toPercentOfTotal(amountMinor, totalExpenseMinor),
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

    if (!monthKey) continue;

    const flow = monthly.get(monthKey);

    if (!flow) continue;

    const amount = absoluteValue(toMinor(transaction.amountMinor));

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
