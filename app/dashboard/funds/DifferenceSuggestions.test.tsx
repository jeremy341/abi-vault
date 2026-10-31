import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DifferenceSuggestions from "./DifferenceSuggestions";
import type { DifferenceReview } from "./difference-review";

function review(periodLocked: boolean): DifferenceReview {
  return {
    suggestions: [{ kind: "wrong-entry", transactionId: "t9", periodLocked }],
    transactions: [
      { id: "t9", title: "Poster printing", direction: "expense", amountMinor: BigInt(2390), bookedAt: "2026-10-22", periodLocked },
    ],
  };
}

describe("DifferenceSuggestions", () => {
  it("links a suggestion to its transaction in the edit view", () => {
    const html = renderToStaticMarkup(<DifferenceSuggestions review={review(false)} />);

    expect(html).toContain('href="/dashboard/transactions?edit=t9"');
    expect(html).toContain("Poster printing may have the wrong amount.");
  });

  it("does not link a suggestion whose period is locked", () => {
    const html = renderToStaticMarkup(<DifferenceSuggestions review={review(true)} />);

    expect(html).not.toContain("/dashboard/transactions?edit=");
    expect(html).toContain("Its accounting period is locked.");
  });
});
