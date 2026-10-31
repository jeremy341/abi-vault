import { describe, expect, it } from "vitest";
import { filterTransactions, type TransactionFilters } from "./filter-transactions";
import type { Transaction } from "./view-model";

const noFilters: TransactionFilters = {
  query: "",
  category: "All",
  type: "All",
  categories: [],
  types: [],
  start: "",
  end: "",
  minimumAmount: "",
  maximumAmount: "",
  receipt: "All",
  review: "All",
};

function transaction(overrides: Partial<Transaction> & Pick<Transaction, "id" | "date">): Transaction {
  return {
    title: "Class purchase",
    category: "Supplies",
    amount: -10,
    receipt: "receipt.jpg",
    receiptId: "receipt-1",
    receiptType: "image/jpeg",
    reviewStatus: "Approved",
    createdByName: null,
    createdAt: "2026-10-01T10:00:00Z",
    account: "Class cash box",
    walletId: "wallet-1",
    type: "expense",
    createdBy: null,
    canEdit: true,
    canDelete: false,
    ...overrides,
  };
}

describe("filterTransactions", () => {
  it("sorts the matches newest first without reordering the input", () => {
    const input = [
      transaction({ id: "old", date: "15.10.2026" }),
      transaction({ id: "new", date: "24.10.2026" }),
      transaction({ id: "middle", date: "20.10.2026" }),
    ];

    const result = filterTransactions(input, noFilters);

    expect(result.map((item) => item.id)).toEqual(["new", "middle", "old"]);
    expect(input.map((item) => item.id)).toEqual(["old", "new", "middle"]);
  });

  it("applies search, category, date, amount, receipt, and review filters together", () => {
    const input = [
      transaction({
        id: "match",
        title: "Poster printing",
        date: "22.10.2026",
        amount: -23.9,
      }),
      transaction({
        id: "wrong-amount",
        title: "Poster printing",
        date: "22.10.2026",
        amount: -45,
      }),
      transaction({
        id: "wrong-status",
        title: "Poster printing",
        date: "22.10.2026",
        amount: -23.9,
        reviewStatus: "Pending review",
      }),
      transaction({
        id: "wrong-date",
        title: "Poster printing",
        date: "30.09.2026",
        amount: -23.9,
      }),
    ];

    const result = filterTransactions(input, {
      ...noFilters,
      query: "  POSTER  ",
      category: "Supplies",
      categories: ["Supplies"],
      type: "Expenses",
      types: ["Expenses"],
      start: "2026-10-01",
      end: "2026-10-31",
      minimumAmount: "20,00",
      maximumAmount: "30,00",
      receipt: "Present",
      review: "Approved",
    });

    expect(result.map((item) => item.id)).toEqual(["match"]);
  });

  it("can find income rows that have no receipt", () => {
    const result = filterTransactions(
      [
        transaction({
          id: "missing-receipt-income",
          title: "Parent contribution",
          date: "18.10.2026",
          amount: 25,
          receipt: undefined,
          receiptId: null,
          receiptType: null,
          reviewStatus: "Pending review",
          type: "income",
        }),
        transaction({
          id: "has-receipt-income",
          title: "Cake sale",
          date: "19.10.2026",
          amount: 25,
          type: "income",
        }),
      ],
      {
        ...noFilters,
        type: "Income",
        types: ["Income"],
        receipt: "Missing",
        review: "Pending review",
      },
    );

    expect(result.map((item) => item.id)).toEqual(["missing-receipt-income"]);
  });
});
