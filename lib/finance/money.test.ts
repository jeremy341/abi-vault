import { describe, expect, it } from "vitest";
import { formatMinorDollar, parseDollarToMinor } from "./money";

describe("USD minor-unit money", () => {
  it("parses decimal commas without floating point arithmetic", () => {
    expect(parseDollarToMinor("1.395,50")).toBe(BigInt(139550));
    expect(parseDollarToMinor("12,5")).toBe(BigInt(1250));
  });

  it("rejects malformed or negative amounts", () => {
    expect(() => parseDollarToMinor("-1,00")).toThrow("INVALID_AMOUNT");
    expect(() => parseDollarToMinor("1,234")).toThrow("INVALID_AMOUNT");
    expect(() => parseDollarToMinor("1.2.3")).toThrow("INVALID_AMOUNT");
  });

  it("formats signed minor units for English USD display", () => {
    expect(formatMinorDollar(BigInt(139550))).toBe("$1,395.50");
    expect(formatMinorDollar(BigInt(-7500))).toBe("-$75.00");
  });
});
