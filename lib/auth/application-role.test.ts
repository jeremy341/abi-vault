import { describe, expect, it } from "vitest";
import {
  applicationRoleFromClerkRole,
  applicationRoleFromMetadata,
} from "./application-role";

describe("application role mapping", () => {
  it("prefers a valid invited application role from metadata", () => {
    expect(applicationRoleFromMetadata({ abiVaultRole: "supervisor" })).toBe("supervisor");
    expect(applicationRoleFromClerkRole("org:admin", { abiVaultRole: "student" })).toBe("student");
  });

  it("falls back to Clerk roles and then student", () => {
    expect(applicationRoleFromClerkRole("org:admin")).toBe("admin");
    expect(applicationRoleFromClerkRole("unknown")).toBe("student");
  });
});
