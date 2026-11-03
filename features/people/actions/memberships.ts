"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  removeMemberSchema,
  updateMemberRoleSchema,
  type RemoveMemberInput,
  type UpdateMemberRoleInput,
} from "@/features/people/schemas/memberships";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<ActionResult<null>> {
  const parsed = updateMemberRoleSchema.safeParse(input);

  if (!parsed.success) return actionFailure("INVALID_INPUT", "The member role data is invalid.");
  const context = await requirePermission("manageMemberships");
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", parsed.data.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (targetError || !target) return actionFailure("ROLE_UPDATE_FAILED", "The member role could not be updated.");

  const { error } = await supabase.rpc("update_member_role", {
    p_organization_id: context.organizationId,
    p_clerk_user_id: parsed.data.clerkUserId,
    p_role: parsed.data.role,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return error.code === "55000"
      ? actionFailure("LAST_ADMIN_REQUIRED", "The last administrator cannot be removed.")
      : actionFailure("ROLE_UPDATE_FAILED", "The member role could not be updated.");
  }

  try {
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganizationMembership({
      organizationId: context.organizationId,
      userId: parsed.data.clerkUserId,
      role: parsed.data.role === "admin" ? "org:admin" : "org:member",
    });
  } catch {
    await supabase.rpc("update_member_role", {
      p_organization_id: context.organizationId,
      p_clerk_user_id: parsed.data.clerkUserId,
      p_role: target.role,
      p_reason: "Role change reset after failed Clerk synchronization",
    });

    return actionFailure("ROLE_UPDATE_FAILED", "The member role could not be updated.");
  }

  return actionSuccess(null);
}

export async function removeMember(input: RemoveMemberInput): Promise<ActionResult<null>> {
  const parsed = removeMemberSchema.safeParse(input);

  if (!parsed.success) return actionFailure("INVALID_INPUT", "The member data is invalid.");
  const context = await requirePermission("manageMemberships");

  if (parsed.data.clerkUserId === context.clerkUserId) {
    return actionFailure("SELF_REMOVAL_NOT_ALLOWED", "You cannot remove yourself.");
  }

  const supabase = await createSupabaseServerClient();

  const { error: removeError } = await supabase.rpc("remove_member", {
    p_organization_id: context.organizationId,
    p_clerk_user_id: parsed.data.clerkUserId,
    p_reason: parsed.data.reason,
  });

  if (removeError) {
    if (removeError.code === "55000") return actionFailure("LAST_ADMIN_REQUIRED", "The last administrator cannot be removed.");

    if (removeError.code === "23503") return actionFailure("MEMBER_NOT_FOUND", "The member was not found.");

    return actionFailure("MEMBER_REMOVAL_FAILED", "The member could not be removed.");
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: context.organizationId,
      userId: parsed.data.clerkUserId,
    });
  } catch {
    return actionFailure("MEMBER_REMOVAL_FAILED", "The member could not be removed.");
  }

  return actionSuccess(null);
}
