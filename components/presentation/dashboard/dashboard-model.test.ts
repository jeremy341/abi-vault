import { describe, expect, it } from "vitest";
import { displayDashboardReviews } from "./dashboard-model";

describe("dashboard view model", () => {
  it("keeps only transactions that need review and preserves their destinations", () => {
    expect(displayDashboardReviews({
      transactions: [
        { title: "Approved item", reviewStatus: "Approved", receipt: true },
        { title: "Pending receipt", reviewStatus: "Pending review", receipt: true },
        { title: "Missing receipt", reviewStatus: "Invalid", receipt: false },
      ],
    })).toEqual([
      {
        title: "Pending receipt",
        detail: "Receipt status pending",
        href: "/dashboard/transactions",
      },
      {
        title: "Missing receipt",
        detail: "Cash payment without receipt",
        href: "/dashboard/transactions",
      },
    ]);
  });
});
