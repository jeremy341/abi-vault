import "server-only";

import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LOCAL_CLASS_COOKIE, LOCAL_USER_COOKIE, LOCAL_USER_ID } from "@/lib/auth/constants";
import { resolveLocalOrganizationId } from "@/lib/auth/local-class-resolution";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * The local demo cookies are only selection hints. Every read verifies that the
 * selected person exists and that the class is one of their active memberships.
 */
export async function getLocalUserId() {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(LOCAL_USER_COOKIE)?.value;
  if (!selectedId) return LOCAL_USER_ID;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("clerk_user_id")
    .eq("clerk_user_id", selectedId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data?.clerk_user_id ?? LOCAL_USER_ID;
}

export async function setLocalUserId(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("clerk_user_id")
    .eq("clerk_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("That demo person does not exist.");

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_USER_COOKIE, data.clerk_user_id, cookieOptions);
}

export async function getLocalSession() {
  const userId = await getLocalUserId();
  const cookieStore = await cookies();
  const selectedClassId = cookieStore.get(LOCAL_CLASS_COOKIE)?.value;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("committee_memberships")
    .select("organization_id, role")
    .eq("clerk_user_id", userId)
    .eq("status", "active");
  if (error) throw error;

  const memberships = data ?? [];
  const organizationId = resolveLocalOrganizationId(
    selectedClassId,
    memberships.map((row) => row.organization_id),
  );
  const membership = memberships.find((row) => row.organization_id === organizationId);
  if (!membership) throw new Error("The local demo user has no active class membership.");

  return { userId, organizationId, role: membership.role as string };
}

export async function getLocalActiveOrganizationId() {
  return (await getLocalSession()).organizationId;
}

export async function setLocalActiveOrganizationId(organizationId: string) {
  const userId = await getLocalUserId();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("committee_memberships")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("That class is not available to this demo user.");

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_CLASS_COOKIE, data.organization_id, cookieOptions);
}
