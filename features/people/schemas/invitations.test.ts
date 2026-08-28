import { describe, expect, it } from "vitest";
import { inviteMemberSchema } from "./invitations";

describe("organization invitation validation", () => {
  it("accepts supported roles and a valid email", () => {
    expect(inviteMemberSchema.safeParse({ email: "team@example.com", role: "supervisor" }).success).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(inviteMemberSchema.safeParse({ email: "not-an-email", role: "admin" }).success).toBe(false);
  });
});
