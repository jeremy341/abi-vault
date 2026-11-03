import { describe, expect, it } from "vitest";
import { calculateCashDenominationMinor } from "./cash-count";

describe("Cash count denomination arithmetic", () => {
  it("Keeps decimal coin totals in minor units", () => {
    expect(calculateCashDenominationMinor({ "0.1": 1, "0.2": 1 })).toBe(30);
  });

  it("Sums notes and coins without drift", () => {
    expect(calculateCashDenominationMinor({ "50": 2, "2": 1, "0.5": 1 })).toBe(10250);
  });
});
