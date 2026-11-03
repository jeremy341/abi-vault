import "server-only";

import { auth } from "@clerk/nextjs/server";
import { isLocalMode } from "@/lib/auth/local";
import { LOCAL_ORGANIZATION_ID, LOCAL_USER_ID } from "@/lib/auth/constants";

export class AuthenticationRequiredError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor() {
    super("Sign-in is required.");
  }
}

export class OrganizationRequiredError extends Error {
  readonly code = "ORGANIZATION_REQUIRED" as const;

  constructor() {
    super("An active Abi workspace is required.");
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor() {
    super("You do not have permission for this action.");
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
