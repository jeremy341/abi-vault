import {
  explainDifference,
  type DetectiveTransaction,
  type DifferenceSuggestion,
} from "@/lib/finance/difference-detective";
import type { DashboardData } from "@/app/dashboard/funds/funds-page-types";

export type DifferenceReview = {
  suggestions: DifferenceSuggestion[];
  transactions: DetectiveTransaction[];
};

export type ReviewableTransaction = {
  id: string;
  title: string;
  type: string;
  date: string;
  amountMinor: string | number;
  fromWalletId?: string | null;
  toWalletId?: string | null;
  periodLocked: boolean;
};

function directionFor(transaction: ReviewableTransaction, walletId: string) {
  if (transaction.type === "income" && transaction.toWalletId === walletId) {
    return "income";
  }

  if (transaction.type === "expense" && transaction.fromWalletId === walletId) {
    return "expense";
  }

  if (transaction.type === "transfer" && transaction.toWalletId === walletId) {
    return "income";
  }

  if (transaction.type === "transfer" && transaction.fromWalletId === walletId) {
    return "expense";
  }

  return null;
}

function absoluteMinor(amount: string | number) {
  const minor = BigInt(String(amount));

  return minor < BigInt(0) ? -minor : minor;
}

export function transactionsSinceCount(
  transactions: readonly ReviewableTransaction[],
  walletId: string,
  sinceDate: string,
): DetectiveTransaction[] {
  const result: DetectiveTransaction[] = [];

  for (const transaction of transactions) {
    const direction = directionFor(transaction, walletId);

    if (!direction) {
      continue;
    }

    if (transaction.date < sinceDate) {
      continue;
    }

    result.push({
      id: transaction.id,
      title: transaction.title,
      direction,
      amountMinor: absoluteMinor(transaction.amountMinor),
      bookedAt: transaction.date,
      periodLocked: transaction.periodLocked,
    });
  }

  return result;
}

export function differenceReviewFor(data: DashboardData, walletId: string): DifferenceReview | null {
  const wallet = data.wallets.find((item) => item.id === walletId);

  if (!wallet?.lastCountAt) {
    return null;
  }

  const transactions = transactionsSinceCount(data.transactions, walletId, wallet.lastCountAt.slice(0, 10));
  const differenceMinor = BigInt(String(wallet.lastCountDifferenceMinor ?? 0));

  return {
    suggestions: explainDifference(differenceMinor, transactions),
    transactions,
  };
}
