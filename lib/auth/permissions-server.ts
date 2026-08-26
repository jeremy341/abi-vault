import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AuthorizationError,
  requireClerkContext,
} from "@/lib/auth/session";
import {
  PERMISSIONS,
  hasPermission,
  type AppRole,
} from "@/features/auth/permissions";

export async function requirePermission(
  permission: keyof typeof PERMISSIONS,
) {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const { data: membership, error } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !membership) throw new AuthorizationError();

  const role = membership.role as AppRole;
  if (!hasPermission(role, permission)) throw new AuthorizationError();

  return { ...context, role };
}
