import { describe, expect, it } from "vitest";
import { mapWalletToCashRegisterCard } from "./cash-register-card";

describe("cash register card mapping", () => {
  it("preserves the Kasse presentation data", () => {
    expect(mapWalletToCashRegisterCard({
      id: "cash-1",
      name: "Sportfestkasse",
      balanceMinor: "253010",
      cardNumberVisual: "1111222233334444",
      cardHolderVisual: "Abi 2026",
      cardExpiryVisual: "12/29",
      cardColorVisual: "#e9e9e7",
    })).toEqual({
      id: "cash-1",
      details: {
        accountName: "Sportfestkasse",
        cardNumber: "1111222233334444",
        holder: "Abi 2026",
        expiry: "12/29",
        color: "#e9e9e7",
      },
      balance: 2530.1,
    });
  });
});
