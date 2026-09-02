import { describe, expect, it } from "vitest";
import { cashCountSchema } from "./cash-counts";

const base = {
  walletId: "00000000-0000-4000-8000-000000000001",
  countedAmount: "12,50",
  auditor: "Alex",
  note: "Cash count",
  idempotencyKey: "cash-count-test-key-001",
};

describe("cash count validation", () => {
  it("requires a stable idempotency key", () => {
    expect(cashCountSchema.safeParse({ ...base, idempotencyKey: "" }).success).toBe(false);
  });

  it("accepts an optional auditor name", () => {
    expect(cashCountSchema.safeParse({ ...base, auditor: undefined }).success).toBe(true);
  });
});
