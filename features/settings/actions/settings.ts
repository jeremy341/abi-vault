"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCommitteeSettingsSchema } from "@/features/settings/schemas/settings";

export async function updateCommitteeSettings(input: unknown) {
  const parsed = updateCommitteeSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageMemberships");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_committee_settings", {
    p_organization_id: context.organizationId,
    p_school_name: parsed.data.schoolName,
    p_graduation_year: parsed.data.graduationYear,
    p_notifications: parsed.data.notifications,
  });
  if (error) return { ok: false as const, error: "SETTINGS_UPDATE_FAILED" };
  return { ok: true as const };
}
