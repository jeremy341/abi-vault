"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateCommitteeSettingsSchema,
  type UpdateCommitteeSettingsInput,
} from "@/features/settings/schemas/settings";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";

export async function updateCommitteeSettings(input: UpdateCommitteeSettingsInput): Promise<ActionResult<null>> {
  const parsed = updateCommitteeSettingsSchema.safeParse(input);

  if (!parsed.success) return actionFailure("INVALID_INPUT", "The settings data is invalid.");
  const context = await requirePermission("manageMemberships");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("update_committee_settings", {
    p_organization_id: context.organizationId,
    p_school_name: parsed.data.schoolName,
    p_graduation_year: parsed.data.graduationYear,
    p_notifications: parsed.data.notifications,
  });

  if (error) return actionFailure("SETTINGS_UPDATE_FAILED", "The settings could not be saved.");

  return actionSuccess(null);
}
