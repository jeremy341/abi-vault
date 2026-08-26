import { describe, expect, it } from "vitest";
import { transactionCreateSchema } from "./transactions";

const ids = {
  category: "00000000-0000-4000-8000-000000000001",
  wallet: "00000000-0000-4000-8000-000000000002",
  otherWallet: "00000000-0000-4000-8000-000000000003",
  period: "00000000-0000-4000-8000-000000000004",
};

const base = {
  amount: "12,50",
  currency: "EUR" as const,
  title: "Kuchenverkauf",
  description: null,
  categoryId: ids.category,
  periodId: ids.period,
  bookedAt: "2026-06-15",
  idempotencyKey: "transaction-test-key-001",
};

describe("transaction command validation", () => {
  it("accepts income routing and returns exact minor units", () => {
    const result = transactionCreateSchema.safeParse({
      ...base,
      type: "income",
      fromWalletId: null,
      toWalletId: ids.wallet,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(BigInt(1250));
  });

  it("rejects transfers that use one wallet on both sides", () => {
    const result = transactionCreateSchema.safeParse({
      ...base,
      type: "transfer",
      categoryId: null,
      fromWalletId: ids.wallet,
      toWalletId: ids.wallet,
    });

    expect(result.success).toBe(false);
  });

  it("requires categories for income and expenses", () => {
    const result = transactionCreateSchema.safeParse({
      ...base,
      type: "expense",
      categoryId: null,
      fromWalletId: ids.wallet,
      toWalletId: null,
    });

    expect(result.success).toBe(false);
  });
});
