import type { Transaction } from "@/features/finance/transactions/view-model";

export function sumIncomeAndExpense(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.amount >= 0) {
      income += transaction.amount;
    } else {
      expense += Math.abs(transaction.amount);
    }
  }

  return { totalIncome: income, totalExpense: expense };
}
