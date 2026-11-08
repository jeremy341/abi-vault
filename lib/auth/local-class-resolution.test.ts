import { describe, expect, it } from "vitest";
import { LOCAL_ORGANIZATION_ID } from "@/lib/auth/constants";
import { resolveLocalOrganizationId } from "./local-class-resolution";
import { localAuthIdentity, localJwtIdentity } from "./local-identity";

describe("local class selection", () => {
  it("uses a selected class only when the demo user has an active membership", () => {
    expect(resolveLocalOrganizationId("org_local_second", [LOCAL_ORGANIZATION_ID, "org_local_second"]))
      .toBe("org_local_second");
  });

  it("ignores a forged or revoked selection and falls back to an active default class", () => {
    expect(resolveLocalOrganizationId("org_local_not_a_member", [LOCAL_ORGANIZATION_ID]))
      .toBe(LOCAL_ORGANIZATION_ID);
  });

  it("uses an active class when the default class membership is absent", () => {
    expect(resolveLocalOrganizationId(undefined, ["org_local_second"]))
      .toBe("org_local_second");
  });

  it("fails closed when no active class membership exists", () => {
    expect(() => resolveLocalOrganizationId("org_local_forged", [])).toThrow(/no active class membership/i);
  });

  it("keeps the app session and Supabase JWT scoped to the same validated class", () => {
    const validatedOrganizationId = "org_local_second";
    const session = localAuthIdentity("user_local_student", validatedOrganizationId);
    const token = localJwtIdentity(session);
    expect(token.org_id).toBe(session.organizationId);
    expect(token.sub).toBe(session.clerkUserId);
    expect(token.sub).toBe("user_local_student");
  });
});
