import { describe, expect, it } from "vitest";
import { explainDifference, type DetectiveTransaction } from "./difference-detective";

function entry(overrides: Partial<DetectiveTransaction> & Pick<DetectiveTransaction, "id" | "amountMinor">): DetectiveTransaction {
  return {
    title: "Class purchase",
    direction: "expense",
    bookedAt: "2026-10-12",
    periodLocked: false,
    ...overrides,
  };
}

describe("explainDifference", () => {
  it("returns nothing when the count matches the book balance", () => {
    expect(explainDifference(BigInt(0), [entry({ id: "t1", amountMinor: BigInt(200) })])).toEqual([]);
  });

  it("flags a duplicated entry with the same title and date", () => {
    const transactions = [
      entry({ id: "t1", amountMinor: BigInt(250) }),
      entry({ id: "t2", amountMinor: BigInt(250) }),
    ];

    expect(explainDifference(BigInt(250), transactions)[0]).toEqual({
      kind: "double-entry",
      transactionId: "t1",
      periodLocked: false,
    });
  });

  it("flags one recorded entry whose amount equals the difference", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(1234) })];

    expect(explainDifference(BigInt(1234), transactions)).toEqual([
      { kind: "wrong-entry", transactionId: "t1", periodLocked: false },
    ]);
  });

  it("matches only the direction the difference points to", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(1234), direction: "income" })];

    expect(explainDifference(BigInt(1234), transactions)).toEqual([
      { kind: "no-match", transactionId: null, periodLocked: false },
    ]);
  });

  it("flags an expense recorded as income when the difference is twice the amount", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(600), direction: "income" })];

    expect(explainDifference(BigInt(-1200), transactions)).toEqual([
      { kind: "sign-flip", transactionId: "t1", periodLocked: false },
    ]);
  });

  it("flags an income recorded as expense when the difference is twice the amount", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(600) })];

    expect(explainDifference(BigInt(1200), transactions)).toEqual([
      { kind: "sign-flip", transactionId: "t1", periodLocked: false },
    ]);
  });

  it("flags two neighbouring digits that were typed in the wrong order", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(1230) })];

    expect(explainDifference(BigInt(-900), transactions)).toEqual([
      { kind: "digits-swapped", transactionId: "t1", periodLocked: false },
    ]);
  });

  it("suggests a recount when the difference is a coin or note value", () => {
    expect(explainDifference(BigInt(500), [])).toEqual([
      { kind: "denomination", transactionId: null, periodLocked: false },
    ]);
  });

  it("says no match when nothing explains the difference", () => {
    expect(explainDifference(BigInt(777), [entry({ id: "t1", amountMinor: BigInt(300) })])).toEqual([
      { kind: "no-match", transactionId: null, periodLocked: false },
    ]);
  });

  it("suggests an unrecorded expense when cash is short and nothing explains it", () => {
    expect(explainDifference(BigInt(-777), [entry({ id: "t1", amountMinor: BigInt(300) })])).toEqual([
      { kind: "unrecorded-expense", transactionId: null, periodLocked: false },
    ]);
  });

  it("carries the locked period flag to the suggestion", () => {
    const transactions = [entry({ id: "t1", amountMinor: BigInt(250), periodLocked: true })];

    expect(explainDifference(BigInt(250), transactions)[0].periodLocked).toBe(true);
  });

  it("keeps exact amounts for large values", () => {
    const large = BigInt("12345678901234567");
    const transactions = [entry({ id: "t1", amountMinor: large })];

    expect(explainDifference(large, transactions)).toEqual([
      { kind: "wrong-entry", transactionId: "t1", periodLocked: false },
    ]);
  });

  it("returns at most three suggestions in priority order", () => {
    const transactions = [
      entry({ id: "t1", amountMinor: BigInt(1000) }),
      entry({ id: "t2", amountMinor: BigInt(1000) }),
      entry({ id: "t3", amountMinor: BigInt(500) }),
      entry({ id: "t4", amountMinor: BigInt(1000) }),
    ];

    const kinds = explainDifference(BigInt(1000), transactions).map((suggestion) => suggestion.kind);

    expect(kinds).toEqual(["double-entry", "wrong-entry", "sign-flip"]);
  });
});
