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
  const { error } = await supabase.rpc("update_member_role", {
    p_organization_id: context.organizationId,
    p_clerk_user_id: parsed.data.clerkUserId,
    p_role: parsed.data.role,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false as const, error: error.code === "55000" ? "LAST_ADMIN_REQUIRED" : "ROLE_UPDATE_FAILED" };
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
  const { data: target } = await supabase
    .from("committee_memberships")
    .select("role, status")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", parsed.data.clerkUserId)
    .maybeSingle();
  if (!target) return { ok: false as const, error: "MEMBER_NOT_FOUND" };

  if (target.role === "admin") {
    const { count } = await supabase
      .from("committee_memberships")
      .select("clerk_user_id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("role", "admin")
      .eq("status", "active");
    if ((count ?? 0) <= 1) return { ok: false as const, error: "LAST_ADMIN_REQUIRED" };
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

  const { error } = await supabase
    .from("committee_memberships")
    .delete()
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", parsed.data.clerkUserId);
  return error
    ? { ok: false as const, error: "MEMBER_REMOVAL_FAILED" }
    : { ok: true as const };
}
