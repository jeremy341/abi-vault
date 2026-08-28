import "server-only";

import { auth } from "@clerk/nextjs/server";

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
