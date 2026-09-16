import { describe, expect, it } from "vitest";
import { actionFailure, actionSuccess } from "./result";

describe("action results", () => {
  it("marks successful results with both canonical status fields", () => {
    expect(actionSuccess({ id: "goal-1" })).toMatchObject({
      ok: true,
      success: true,
      data: { id: "goal-1" },
    });
  });

  it("marks failures with a typed error and both canonical status fields", () => {
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
