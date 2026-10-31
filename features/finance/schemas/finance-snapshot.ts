import { z } from "zod";

const minorUnits = z.string().regex(/^-?\d+$/);

const monthKey = z.string().regex(/^\d{4}-\d{2}$/);

export const financeSnapshotSchema = z.object({
  asOf: z.string(),
  transactionCount: z.number().int().nonnegative(),
  incomeMinor: minorUnits,
  expenseMinor: minorUnits,
  netMinor: minorUnits,
  liquidMinor: minorUnits,
  walletCount: z.number().int().nonnegative(),
  wallets: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    responsibleClerkUserId: z.string().nullable(),
    openingBalanceMinor: minorUnits,
    balanceMinor: minorUnits,
    cardNumberVisual: z.string().nullable(),
    cardHolderVisual: z.string().nullable(),
    cardExpiryVisual: z.string().nullable(),
    cardColorVisual: z.string().nullable(),
    lastCountedAmountMinor: minorUnits.nullable(),
    lastCountDifferenceMinor: minorUnits.nullable(),
    lastCountedByName: z.string().nullable(),
    lastCountAt: z.string().nullable(),
  })),
  categories: z.array(z.object({
    name: z.string(),
    amountMinor: minorUnits,
    progress: z.number().min(0).max(100),
  })),
  monthlyFlow: z.array(z.object({
    monthKey,
    year: z.number().int(),
    incomeMinor: minorUnits,
    expensesMinor: minorUnits,
    balanceMinor: minorUnits,
  })),
  analysisBalance: z.array(z.object({
    monthKey,
    balanceMinor: minorUnits,
  })),
  pendingReceiptCount: z.number().int().nonnegative(),
  reviewedReceiptCount: z.number().int().nonnegative(),
  unassignedReceiptCount: z.number().int().nonnegative(),
  reconciliationPercent: z.number().int().min(0).max(100).nullable(),
}).superRefine((snapshot, context) => {
  try {
    const expectedNetMinor = BigInt(snapshot.incomeMinor) - BigInt(snapshot.expenseMinor);

    if (BigInt(snapshot.netMinor) !== expectedNetMinor) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["netMinor"],
        message: "Net amount must equal income minus expenses.",
      });
    }

    const walletTotalMinor = snapshot.wallets.reduce(
      (total, wallet) => total + BigInt(wallet.balanceMinor),
      BigInt(0),
    );

    if (BigInt(snapshot.liquidMinor) !== walletTotalMinor) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["liquidMinor"],
        message: "Liquid total must equal the sum of wallet balances.",
      });
    }

    const categoryTotalMinor = snapshot.categories.reduce(
      (total, category) => total + BigInt(category.amountMinor),
      BigInt(0),
    );

    if (BigInt(snapshot.expenseMinor) !== categoryTotalMinor) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categories"],
        message: "Category totals must equal total expenses.",
      });
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["netMinor"],
      message: "Snapshot totals must be valid integer minor units.",
    });
  }

  if (snapshot.walletCount !== snapshot.wallets.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["walletCount"],
      message: "Wallet count must match the returned wallet list.",
    });
  }

  const flowMonths = snapshot.monthlyFlow.map((month) => month.monthKey);
  const balanceMonths = snapshot.analysisBalance.map((month) => month.monthKey);

  if (
    flowMonths.length !== 6 ||
    balanceMonths.length !== 6 ||
    flowMonths.some((monthKey, index) => monthKey !== balanceMonths[index])
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["monthlyFlow"],
      message: "Flow and balance data must cover the same six months.",
    });
  }
});

export type FinanceReadSnapshot = z.infer<typeof financeSnapshotSchema>;
