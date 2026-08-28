import { describe, expect, it } from "vitest";
import { calculateCashDenominationMinor } from "./cash-count";

describe("cash count denomination arithmetic", () => {
  it("keeps decimal coin totals in exact minor units", () => {
    expect(calculateCashDenominationMinor({ "0.1": 1, "0.2": 1 })).toBe(30);
  });

  it("sums notes and coins without floating-point drift", () => {
    expect(calculateCashDenominationMinor({ "50": 2, "2": 1, "0.5": 1 })).toBe(10250);
  });
});
