import "server-only";

import { auth } from "@clerk/nextjs/server";

export class AuthenticationRequiredError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor() {
    super("Authentication is required.");
  }
}

export class OrganizationRequiredError extends Error {
  readonly code = "ORGANIZATION_REQUIRED" as const;

  constructor() {
    super("An active committee organization is required.");
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor() {
    super("You do not have permission to perform this action.");
  }
}

export async function requireClerkContext() {
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
