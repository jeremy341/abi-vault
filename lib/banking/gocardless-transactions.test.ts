import { describe, expect, it } from "vitest";
import { normalizeGoCardlessTransaction } from "@/lib/banking/normalize";

describe("GoCardless transaction normalization", () => {
  it("keeps exact EUR cents for income and builds a readable title", () => {
    expect(normalizeGoCardlessTransaction({
      transactionId: "provider-1",
      bookingDate: "2026-05-15",
      transactionAmount: { amount: "185,50", currency: "EUR" },
      remittanceInformationUnstructured: ["Mitgliedsbeitrag"],
    })).toMatchObject({ amountMinor: BigInt(18550), title: "Mitgliedsbeitrag" });
  });

  it("preserves a negative expense and ignores incomplete provider rows", () => {
    expect(normalizeGoCardlessTransaction({
      transactionId: "provider-2",
      bookingDate: "2026-05-14",
      transactionAmount: { amount: "-64.80", currency: "EUR" },
      creditorName: "Druckerei",
    })).toMatchObject({ amountMinor: BigInt(-6480), title: "Druckerei" });
    expect(normalizeGoCardlessTransaction({ transactionId: "missing-amount" })).toBeNull();
  });
});
