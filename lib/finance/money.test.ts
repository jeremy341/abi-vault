import { describe, expect, it } from "vitest";
import { formatMinorEuro, parseEuroToMinor } from "./money";

describe("EUR minor-unit money", () => {
  it("parses decimal commas without floating point arithmetic", () => {
    expect(parseEuroToMinor("1.395,50")).toBe(BigInt(139550));
    expect(parseEuroToMinor("12,5")).toBe(BigInt(1250));
  });

  it("rejects malformed or negative amounts", () => {
    expect(() => parseEuroToMinor("-1,00")).toThrow("INVALID_AMOUNT");
    expect(() => parseEuroToMinor("1,234")).toThrow("INVALID_AMOUNT");
    expect(() => parseEuroToMinor("1.2.3")).toThrow("INVALID_AMOUNT");
  });

  it("formats signed minor units for English EUR display", () => {
    expect(formatMinorEuro(BigInt(139550))).toBe("€1,395.50");
    expect(formatMinorEuro(BigInt(-7500))).toBe("-€75.00");
  });
});
