import { describe, expect, it } from "vitest";
import {
  applicationRoleFromClerkRole,
  applicationRoleFromMetadata,
} from "./application-role";

describe("Application role mapping", () => {
  it("Prefers a valid role from metadata", () => {
    expect(applicationRoleFromMetadata({ abiVaultRole: "supervisor" })).toBe("supervisor");
    expect(applicationRoleFromClerkRole("org:admin", { abiVaultRole: "student" })).toBe("student");
  });

  it("Falls back to Clerk roles, then student", () => {
    expect(applicationRoleFromClerkRole("org:admin")).toBe("admin");
    expect(applicationRoleFromClerkRole("unknown")).toBe("student");
  });
});
