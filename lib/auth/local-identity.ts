import { LOCAL_USER_ID } from "@/lib/auth/constants";

export function localAuthIdentity(organizationId: string) {
  return { clerkUserId: LOCAL_USER_ID, organizationId };
}

export function localJwtIdentity(identity: ReturnType<typeof localAuthIdentity>) {
  return { sub: identity.clerkUserId, org_id: identity.organizationId };
}
