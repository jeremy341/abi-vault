import "server-only";

import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LOCAL_USER_ID } from "@/lib/auth/constants";
import { resolveLocalOrganizationId } from "@/lib/auth/local-class-resolution";

const ACTIVE_CLASS_COOKIE = "abi_vault_active_class";

/**
 * The local demo cookie is only a selection hint. Every read verifies that the
 * fixed demo user still has an active membership before using the class id.
 */
export async function getLocalActiveOrganizationId() {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(ACTIVE_CLASS_COOKIE)?.value;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("committee_memberships")
    .select("organization_id")
    .eq("clerk_user_id", LOCAL_USER_ID)
    .eq("status", "active");
  if (error) throw error;
  return resolveLocalOrganizationId(selectedId, (data ?? []).map((row) => row.organization_id));
}

export async function setLocalActiveOrganizationId(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("committee_memberships")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", LOCAL_USER_ID)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("That class is not available to this demo user.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CLASS_COOKIE, data.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
