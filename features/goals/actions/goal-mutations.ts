"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { archiveGoalSchema, updateGoalSchema } from "@/features/goals/schemas/goal-mutations";

export async function updateGoal(input: unknown) {
  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageGoals");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_fundraising_goal", {
    p_organization_id: context.organizationId,
    p_goal_id: parsed.data.goalId,
    p_title: parsed.data.title,
    p_description: parsed.data.description ?? null,
    p_target_amount_minor: parsed.data.targetAmount.toString(),
    p_deadline: parsed.data.deadline,
    p_reason: parsed.data.reason,
  });
  return error ? { ok: false as const, error: "GOAL_UPDATE_FAILED" } : { ok: true as const };
}

export async function archiveGoal(input: unknown) {
  const parsed = archiveGoalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("manageGoals");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_fundraising_goal", {
    p_organization_id: context.organizationId,
    p_goal_id: parsed.data.goalId,
    p_reason: parsed.data.reason,
  });
  return error ? { ok: false as const, error: "GOAL_ARCHIVE_FAILED" } : { ok: true as const };
}
