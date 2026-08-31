import "server-only";

import { auth } from "@clerk/nextjs/server";
import { isLocalMode, LOCAL_ORGANIZATION_ID, LOCAL_USER_ID } from "@/lib/auth/local";

export class AuthenticationRequiredError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor() {
    super("Eine Anmeldung ist erforderlich.");
  }
}

export class OrganizationRequiredError extends Error {
  readonly code = "ORGANIZATION_REQUIRED" as const;

  constructor() {
    super("Ein aktiver Abi-Arbeitsbereich ist erforderlich.");
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor() {
    super("Du hast keine Berechtigung für diese Aktion.");
  }
}

export async function requireClerkContext() {
  if (isLocalMode()) {
    return {
      clerkUserId: LOCAL_USER_ID,
      organizationId: LOCAL_ORGANIZATION_ID,
      getToken: async () => null,
    };
  }

  const context = await auth();

  if (!context.userId) {
    throw new AuthenticationRequiredError();
  }

  if (!context.orgId) {
    throw new OrganizationRequiredError();
  }

  return {
    clerkUserId: context.userId,
    organizationId: context.orgId,
    getToken: context.getToken,
  };
}
