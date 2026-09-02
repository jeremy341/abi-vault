"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeMemberSchema, updateMemberRoleSchema } from "@/features/people/schemas/memberships";

export async function updateMemberRole(input: unknown) {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageMemberships");
  const supabase = await createSupabaseServerClient();
  const { data: target, error: targetError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", parsed.data.clerkUserId)
    .eq("status", "active")
    .maybeSingle();
  if (targetError || !target) return { ok: false as const, error: "ROLE_UPDATE_FAILED" };

  const { error } = await supabase.rpc("update_member_role", {
    p_organization_id: context.organizationId,
    p_clerk_user_id: parsed.data.clerkUserId,
    p_role: parsed.data.role,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false as const, error: error.code === "55000" ? "LAST_ADMIN_REQUIRED" : "ROLE_UPDATE_FAILED" };

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
      p_reason: "Role change reverted after Clerk synchronization failed",
    });
    return { ok: false as const, error: "ROLE_UPDATE_FAILED" };
  }
  return { ok: true as const };
}

export async function removeMember(input: unknown) {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageMemberships");
  if (parsed.data.clerkUserId === context.clerkUserId) {
    return { ok: false as const, error: "SELF_REMOVAL_NOT_ALLOWED" };
  }

  const supabase = await createSupabaseServerClient();
  const { error: removeError } = await supabase.rpc("remove_member", {
    p_organization_id: context.organizationId,
    p_clerk_user_id: parsed.data.clerkUserId,
    p_reason: parsed.data.reason,
  });
  if (removeError) {
    if (removeError.code === "55000") return { ok: false as const, error: "LAST_ADMIN_REQUIRED" };
    if (removeError.code === "23503") return { ok: false as const, error: "MEMBER_NOT_FOUND" };
    return { ok: false as const, error: "MEMBER_REMOVAL_FAILED" };
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: context.organizationId,
      userId: parsed.data.clerkUserId,
    });
  } catch {
    return { ok: false as const, error: "MEMBER_REMOVAL_FAILED" };
  }
  return { ok: true as const };
}
