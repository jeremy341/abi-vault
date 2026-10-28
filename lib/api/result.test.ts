import { describe, expect, it } from "vitest";
import { actionFailure, actionSuccess } from "./result";

describe("Action results", () => {
  it("Marks successful results as ok and success", () => {
    expect(actionSuccess({ id: "goal-1" })).toMatchObject({
      ok: true,
      success: true,
      data: { id: "goal-1" },
    });
  });

  it("Marks failures with a typed error", () => {
    expect(actionFailure("INVALID_PAYLOAD", "The payload is invalid.")).toMatchObject({
      ok: false,
      success: false,
      error: {
        code: "INVALID_PAYLOAD",
        message: "The payload is invalid.",
      },
    });
  });
});
