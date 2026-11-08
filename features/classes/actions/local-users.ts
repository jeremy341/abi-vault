"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isLocalMode } from "@/lib/auth/local";
import { hasPermission, type AppRole } from "@/features/auth/permissions";
import { getLocalSession, setLocalUserId } from "@/lib/auth/local-class-context";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LocalPerson = { id: string; name: string; role: AppRole };

const localPersonSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.enum(["admin", "supervisor", "student"]),
});

/** Demo people in the active class, for the user switcher. Needs no permission: switching is the demo's point. */
export async function listLocalPeople() {
  if (!isLocalMode()) return { ok: false as const, error: "UNAVAILABLE" as const };
  const session = await getLocalSession();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("committee_memberships")
    .select("clerk_user_id, role, profiles(display_name)")
    .eq("organization_id", session.organizationId)
    .eq("status", "active")
    .order("created_at");
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const people: LocalPerson[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.clerk_user_id,
      name: profile?.display_name || "Demo person",
      role: row.role as AppRole,
    };
  });

  return {
    ok: true as const,
    currentUserId: session.userId,
    canManageMembers: hasPermission(session.role as AppRole, "manageMemberships"),
    people,
  };
}

export async function switchLocalUser(userId: string) {
  if (!isLocalMode()) return { ok: false as const, error: "UNAVAILABLE" as const };
  if (typeof userId !== "string" || !userId) return { ok: false as const, error: "INVALID_INPUT" as const };
  try {
    await setLocalUserId(userId);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "PERSON_NOT_FOUND" as const };
  }
}

/** Adds a new demo person to the active class, as the invite flow would, and switches to them. */
export async function createLocalPerson(input: unknown) {
  if (!isLocalMode()) return { ok: false as const, error: "UNAVAILABLE" as const };
  const parsed = localPersonSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" as const };

  let context: Awaited<ReturnType<typeof requirePermission>>;
  try {
    context = await requirePermission("manageMemberships");
  } catch {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const admin = createSupabaseAdminClient();
  const userId = `user_local_${randomUUID()}`;
  const { error: profileError } = await admin.from("profiles").insert({
    clerk_user_id: userId,
    display_name: parsed.data.name,
    email: "",
    status: "active",
  });
  if (profileError) return { ok: false as const, error: "PERSON_CREATE_FAILED" as const };

  const { error: membershipError } = await admin.from("committee_memberships").insert({
    organization_id: context.organizationId,
    clerk_user_id: userId,
    role: parsed.data.role,
    status: "active",
  });
  if (membershipError) {
    await admin.from("profiles").delete().eq("clerk_user_id", userId);
    return { ok: false as const, error: "PERSON_CREATE_FAILED" as const };
  }

  await setLocalUserId(userId);
  return { ok: true as const, id: userId };
}
