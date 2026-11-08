import { describe, expect, it } from "vitest";
import { getMemberRemovalMessage } from "@/features/people/removal-feedback";

describe("member removal feedback", () => {
  it("explains that the signed-in member cannot remove their own account", () => {
    expect(getMemberRemovalMessage("SELF_REMOVAL_NOT_ALLOWED")).toBe(
      "You cannot remove your own account.",
    );
  });

  it("explains how to remove the last administrator safely", () => {
    expect(getMemberRemovalMessage("LAST_ADMIN_REQUIRED")).toBe(
      "The last administrator cannot be removed. Assign administrator access to another active member first.",
    );
  });

  it("uses a general message for other removal errors", () => {
    expect(getMemberRemovalMessage("MEMBER_REMOVAL_FAILED")).toBe(
      "The person could not be removed.",
    );
  });
});
