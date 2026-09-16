"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import { inviteMemberSchema, type InviteMemberInput } from "@/features/people/schemas/invitations";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";

export async function inviteMember(input: InviteMemberInput): Promise<ActionResult<{ id: string }>> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_INPUT", "The invitation data is invalid.");
  const context = await requirePermission("manageMemberships");
  const client = await clerkClient();
  try {
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: context.organizationId,
      emailAddress: parsed.data.email,
      role: parsed.data.role === "admin" ? "org:admin" : "org:member",
      inviterUserId: context.clerkUserId,
      expiresInDays: 30,
      publicMetadata: {
        abiVaultRole: parsed.data.role,
      },
    });
    return actionSuccess({ id: invitation.id });
  } catch {
    return actionFailure("INVITATION_FAILED", "The invitation could not be sent.");
  }
}
