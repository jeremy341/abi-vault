import { describe, expect, it } from "vitest";
import { getMemberDisplayName } from "@/features/people/member-display-name";

describe("member display names", () => {
  it("shows the local demo account label even if an existing profile has an older name", () => {
    expect(getMemberDisplayName({
      displayName: "Local Admin",
      email: "admin@example.test",
      isLocalDemoUser: true,
    })).toBe("Demo User");
  });

  it("uses the profile name for regular members", () => {
    expect(getMemberDisplayName({
      displayName: "Avery Member",
      email: "avery@example.test",
      isLocalDemoUser: false,
    })).toBe("Avery Member");
  });

  it("falls back to email and then a neutral label", () => {
    expect(getMemberDisplayName({ displayName: "", email: "member@example.test", isLocalDemoUser: false }))
      .toBe("member@example.test");
    expect(getMemberDisplayName({ displayName: null, email: null, isLocalDemoUser: false }))
      .toBe("Unbekannt");
  });
});
