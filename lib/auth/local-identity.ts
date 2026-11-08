export function localAuthIdentity(userId: string, organizationId: string) {
  return { clerkUserId: userId, organizationId };
}

export function localJwtIdentity(identity: ReturnType<typeof localAuthIdentity>) {
  return { sub: identity.clerkUserId, org_id: identity.organizationId };
}
