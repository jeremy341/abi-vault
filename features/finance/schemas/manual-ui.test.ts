import { describe, expect, it } from "vitest";
import { manualUiTransactionSchema } from "./manual-ui";

const validInput = {
  title: "Cake sale",
  amount: "12,50",
  direction: "income" as const,
  categoryName: "Sales",
  walletId: "00000000-0000-4000-8000-000000000002",
  idempotencyKey: "ui-transaction-test-001",
};

describe("manual UI transaction validation", () => {
  it("requires a stable idempotency key", () => {
    const result = manualUiTransactionSchema.safeParse({
      ...validInput,
      idempotencyKey: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a wallet-routed transaction with an idempotency key", () => {
    const result = manualUiTransactionSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });
});
