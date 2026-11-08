"use server";

import { revalidatePath } from "next/cache";
import { isLocalMode } from "@/lib/auth/local";
import { LOCAL_USER_ID } from "@/lib/auth/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setLocalActiveOrganizationId } from "@/lib/auth/local-class-context";

export type ClassOption = { id: string; name: string };

export async function listLocalClasses(): Promise<ClassOption[]> {
  if (!isLocalMode()) return [];
  const admin = createSupabaseAdminClient();
  const { data: memberships, error } = await admin
    .from("committee_memberships")
    .select("organization_id")
    .eq("clerk_user_id", LOCAL_USER_ID)
    .eq("status", "active");
  if (error) throw error;
  const ids = (memberships ?? []).map(({ organization_id }) => organization_id);
  if (ids.length === 0) return [];

  const { data: committees, error: committeesError } = await admin
    .from("committees")
    .select("organization_id, name")
    .in("organization_id", ids)
    .order("created_at", { ascending: true });
  if (committeesError) throw committeesError;
  return (committees ?? []).map((committee) => ({
    id: committee.organization_id,
    name: committee.name,
  }));
}

export async function selectLocalClass(organizationId: string) {
  if (!isLocalMode()) throw new Error("Local class selection is unavailable.");
  await setLocalActiveOrganizationId(organizationId);
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function renameLocalClass(organizationId: string, name: string) {
  if (!isLocalMode()) throw new Error("Local class management is unavailable.");
  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new Error("Class name must be between 2 and 120 characters.");
  }

  const admin = createSupabaseAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", LOCAL_USER_ID)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (membership?.role !== "admin") throw new Error("Only a class administrator can rename this class.");

  const { error } = await admin
    .from("committees")
    .update({ name: normalizedName })
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function createLocalClass(name: string) {
  if (!isLocalMode()) throw new Error("Local class creation is unavailable.");
  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new Error("Class name must be between 2 and 120 characters.");
  }

  const admin = createSupabaseAdminClient();
  const { data: organizationId, error } = await admin.rpc("create_local_class", {
    p_name: normalizedName,
  });
  if (error) throw error;
  if (typeof organizationId !== "string" || !organizationId) {
    throw new Error("Class creation did not return a class identifier.");
  }

  await setLocalActiveOrganizationId(organizationId);
  revalidatePath("/", "layout");
  return { success: true as const, organizationId };
}
