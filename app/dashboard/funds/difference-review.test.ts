import { describe, expect, it } from "vitest";
import { transactionsSinceCount, type ReviewableTransaction } from "./difference-review";

function row(overrides: Partial<ReviewableTransaction> & Pick<ReviewableTransaction, "id">): ReviewableTransaction {
  return {
    title: "Entry",
    type: "expense",
    date: "2026-10-20",
    amountMinor: "-1200",
    fromWalletId: "cash",
    toWalletId: null,
    periodLocked: false,
    ...overrides,
  };
}

describe("transactionsSinceCount", () => {
  it("counts an expense from the register as an expense", () => {
    const result = transactionsSinceCount([row({ id: "t1" })], "cash", "2026-10-12");

    expect(result).toEqual([
      { id: "t1", title: "Entry", direction: "expense", amountMinor: BigInt(1200), bookedAt: "2026-10-20", periodLocked: false },
    ]);
  });

  it("counts a transfer out of the register as an expense", () => {
    const transfer = row({
      id: "t2",
      type: "transfer",
      amountMinor: "5000",
      fromWalletId: "cash",
      toWalletId: "prom",
    });

    expect(transactionsSinceCount([transfer], "cash", "2026-10-12")[0]).toMatchObject({
      direction: "expense",
      amountMinor: BigInt(5000),
    });
  });

  it("counts a transfer into the register as income", () => {
    const transfer = row({
      id: "t3",
      type: "transfer",
      amountMinor: "3000",
      fromWalletId: "prom",
      toWalletId: "cash",
    });

    expect(transactionsSinceCount([transfer], "cash", "2026-10-12")[0]).toMatchObject({
      direction: "income",
      amountMinor: BigInt(3000),
    });
  });

  it("ignores a transfer between two other registers", () => {
    const transfer = row({
      id: "t4",
      type: "transfer",
      fromWalletId: "prom",
      toWalletId: "trip",
    });

    expect(transactionsSinceCount([transfer], "cash", "2026-10-12")).toEqual([]);
  });

  it("ignores entries booked before the last count", () => {
    const old = row({ id: "t5", date: "2026-10-01" });

    expect(transactionsSinceCount([old], "cash", "2026-10-12")).toEqual([]);
  });
});
