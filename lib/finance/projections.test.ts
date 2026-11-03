import { describe, expect, it } from "vitest";
import {
  projectCategoryTotals,
  projectMonthlyFlow,
  projectFlowTotals,
  projectWalletBalances,
} from "./projections";

describe("finance projections", () => {
  it("projects wallet balances from opening balances and all transaction directions", () => {
    const balances = projectWalletBalances(
      [
        { id: "cash-a", openingBalanceMinor: "10000" },
        { id: "cash-b", openingBalanceMinor: "2500" },
      ],
      [
        { amountMinor: "3200", type: "income", category: "Sales", fromWalletId: null, toWalletId: "cash-a" },
        { amountMinor: "800", type: "expense", category: "Material", fromWalletId: "cash-a", toWalletId: null },
        { amountMinor: "500", type: "transfer", category: "Transfer", fromWalletId: "cash-a", toWalletId: "cash-b" },
      ],
    );

    expect(balances).toEqual(new Map([
      ["cash-a", BigInt(11900)],
      ["cash-b", BigInt(3000)],
    ]));
  });

  it("projects expense categories with stable totals and percentages", () => {
    const categories = projectCategoryTotals([
      { amountMinor: "1000", type: "expense", category: "Material", fromWalletId: "cash-a", toWalletId: null },
      { amountMinor: "500", type: "expense", category: "Material", fromWalletId: "cash-a", toWalletId: null },
      { amountMinor: "500", type: "expense", category: "Event", fromWalletId: "cash-a", toWalletId: null },
      { amountMinor: "900", type: "income", category: "Sales", fromWalletId: null, toWalletId: "cash-a" },
    ]);

    expect(categories).toEqual([
      { name: "Material", amountMinor: "1500", progress: 75 },
      { name: "Event", amountMinor: "500", progress: 25 },
    ]);
  });

  it("returns no categories when there are no expenses", () => {
    expect(projectCategoryTotals([])).toEqual([]);
  });

  it("projects income, expenses, and net totals from ledger movements", () => {
    expect(projectFlowTotals([
      { amountMinor: "3200", type: "income", category: "Sales", fromWalletId: null, toWalletId: "cash-a" },
      { amountMinor: "800", type: "expense", category: "Material", fromWalletId: "cash-a", toWalletId: null },
    ])).toEqual({
      incomeMinor: BigInt(3200),
      expenseMinor: BigInt(800),
      netMinor: BigInt(2400),
    });
  });

  it("projects six-month income and expense flow into the supplied month buckets", () => {
    const months = [
      { key: "2026-05", label: "May", year: 2026 },
      { key: "2026-06", label: "Jun", year: 2026 },
    ];

    expect(projectMonthlyFlow(
      [
        { amountMinor: "10000", type: "income", category: "Sales", date: "2026-05-12", fromWalletId: null, toWalletId: "cash-a" },
        { amountMinor: "2500", type: "expense", category: "Material", date: "2026-06-04", fromWalletId: "cash-a", toWalletId: null },
      ],
      months,
    )).toEqual([
      { month: "May", year: 2026, income: 100, expenses: 0 },
      { month: "Jun", year: 2026, income: 0, expenses: 25 },
    ]);
  });
});
