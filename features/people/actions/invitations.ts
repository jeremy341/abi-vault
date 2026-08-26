"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import { inviteMemberSchema } from "@/features/people/schemas/invitations";

export async function inviteMember(input: unknown) {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageMemberships");
  const client = await clerkClient();
  try {
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: context.organizationId,
      emailAddress: parsed.data.email,
      role: `org:${parsed.data.role}`,
      inviterUserId: context.clerkUserId,
      expiresInDays: 30,
    });
    return { ok: true as const, id: invitation.id };
  } catch {
    return { ok: false as const, error: "INVITATION_FAILED" };
  }
}
