"use client";

import { LoadingText } from "@/components/ui/loading-state";
import { formatAmount, formatTotal } from "@/features/finance/transactions/view-model";
import ledger from "../ledger.module.css";

type TransactionsSummaryProps = {
  loading: boolean;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  addDisabled: boolean;
  onAddTransaction: () => void;
};

export function TransactionsSummary({
  loading,
  totalIncome,
  totalExpense,
  netBalance,
  addDisabled,
  onAddTransaction,
}: TransactionsSummaryProps) {
  return (
    <div className={ledger.summary}>
      <dl className={ledger.figures}>
        <div>
          <dt>Income</dt>
          <dd><LoadingText loading={loading}>{formatTotal(totalIncome)}</LoadingText></dd>
        </div>
        <div>
          <dt>Expenses</dt>
          <dd><LoadingText loading={loading}>{formatTotal(totalExpense)}</LoadingText></dd>
        </div>
        <div>
          <dt>Net</dt>
          <dd className={`${ledger.net} total-rule`}><LoadingText loading={loading}>{formatAmount(netBalance)}</LoadingText></dd>
        </div>
      </dl>
      <button
        type="button"
        className={ledger.primaryButton}
        onClick={onAddTransaction}
        disabled={addDisabled}
      >
        Add transaction
      </button>
    </div>
  );
}
