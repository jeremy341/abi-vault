"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveGoalSchema,
  updateGoalSchema,
  type ArchiveGoalInput,
  type UpdateGoalInput,
} from "@/features/goals/schemas/goal-mutations";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";

export async function updateGoal(input: UpdateGoalInput): Promise<ActionResult<null>> {
  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_INPUT", "The goal data is invalid.");
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
  return error
    ? actionFailure("GOAL_UPDATE_FAILED", "The goal could not be saved.")
    : actionSuccess(null);
}

export async function archiveGoal(input: ArchiveGoalInput): Promise<ActionResult<null>> {
  const parsed = archiveGoalSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_INPUT", "The goal data is invalid.");
  const context = await requirePermission("manageGoals");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_fundraising_goal", {
    p_organization_id: context.organizationId,
    p_goal_id: parsed.data.goalId,
    p_reason: parsed.data.reason,
  });
  return error
    ? actionFailure("GOAL_ARCHIVE_FAILED", "The goal could not be archived.")
    : actionSuccess(null);
}
