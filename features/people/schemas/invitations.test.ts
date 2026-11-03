import { describe, expect, it } from "vitest";
import { inviteMemberSchema } from "./invitations";

describe("Organization invitation validation", () => {
  it("Accepts a supported role and valid email", () => {
    expect(inviteMemberSchema.safeParse({ email: "team@example.com", role: "supervisor" }).success).toBe(true);
  });

  it("Rejects invalid email addresses", () => {
    expect(inviteMemberSchema.safeParse({ email: "not-an-email", role: "admin" }).success).toBe(false);
  });
});
