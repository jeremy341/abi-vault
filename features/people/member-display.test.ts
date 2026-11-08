import { describe, expect, it } from "vitest";
import { isCurrentMember, memberDisplayName } from "./member-display";

describe("demo member identity", () => {
  it("shows the current sample administrator as Demo User", () => {
    expect(memberDisplayName("u1", "Mara Lindner")).toBe("Demo User");
    expect(isCurrentMember("u1", null)).toBe(true);
  });

  it("uses the signed-in id for authenticated members", () => {
    expect(isCurrentMember("user_123", "user_123")).toBe(true);
    expect(isCurrentMember("user_456", "user_123")).toBe(false);
  });
});
