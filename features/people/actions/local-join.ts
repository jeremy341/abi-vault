"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isLocalMode } from "@/lib/auth/local";
import { getLocalUserId, setLocalActiveOrganizationId, setLocalUserId } from "@/lib/auth/local-class-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { acceptRoleInviteLink } from "@/features/people/actions/invite-links";

const joinSchema = z.object({
  token: z.string().min(32).max(200),
  name: z.string().trim().min(2).max(120),
});

/**
 * Local demo join: the visitor enters a name, which creates a new demo person,
 * accepts the invite link as that person, and makes the invited class active.
 */
export async function joinLocalClassWithInvite(input: unknown) {
  if (!isLocalMode()) return { ok: false as const, error: "UNAVAILABLE" as const };
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_NAME" as const };

  const admin = createSupabaseAdminClient();
  const personId = `user_local_${randomUUID()}`;
  const previousPersonId = await getLocalUserId();

  const { error: profileError } = await admin.from("profiles").insert({
    clerk_user_id: personId,
    display_name: parsed.data.name,
    email: "",
    status: "active",
  });
  if (profileError) return { ok: false as const, error: "PERSON_CREATE_FAILED" as const };

  await setLocalUserId(personId);
  const result = await acceptRoleInviteLink(parsed.data.token);
  if (!result.ok) {
    // Undo the new person so a rejected link leaves no trace.
    await setLocalUserId(previousPersonId).catch(() => undefined);
    await admin.from("profiles").delete().eq("clerk_user_id", personId);
    return { ok: false as const, error: result.error.code };
  }

  await setLocalActiveOrganizationId(result.data.organizationId);
  return { ok: true as const, organizationId: result.data.organizationId };
}
