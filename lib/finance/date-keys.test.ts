import { describe, expect, it } from "vitest";
import { financeDateKey, previousFinanceMonthKey } from "./date-keys";

describe("Berlin finance date keys", () => {
  it("keeps date-only values on their calendar date", () => {
    expect(financeDateKey("2026-03-29")).toBe("2026-03-29");
  });

  it("uses the Berlin date for UTC timestamps around midnight", () => {
    expect(financeDateKey("2026-10-21T22:30:00.000Z")).toBe("2026-10-22");
    expect(financeDateKey("2026-10-31T23:30:00.000Z")).toBe("2026-11-01");
  });

  it("handles the spring daylight-saving offset", () => {
    expect(financeDateKey("2026-03-29T22:30:00.000Z")).toBe("2026-03-30");
  });

  it("moves January back to December of the prior year", () => {
    expect(previousFinanceMonthKey("2026-01")).toBe("2025-12");
    expect(previousFinanceMonthKey("2026-10")).toBe("2026-09");
  });
});
