"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  goalContributionSchema,
  goalCreateSchema,
  type GoalContributionInput,
  type GoalCreateInput,
} from "@/features/goals/schemas/goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapGoalError(code?: string) {
  if (code === "42501") return actionFailure("FORBIDDEN", "Du hast keine Berechtigung, Goals zu verwalten.");
  if (code === "55000") return actionFailure("CONFLICT", "The goal or accounting period is unavailable.");
  if (code === "23514" || code === "22023") return actionFailure("INVALID_PAYLOAD", "The goal data is invalid.");
  if (code === "23505") return actionFailure("CONFLICT", "This goal change was already submitted.");
  return actionFailure("DATABASE_ERROR", "Das Goal konnte nicht gespeichert werden.");
}

export async function createGoal(
  input: GoalCreateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = goalCreateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The goal data is invalid.");

  const context = await requirePermission("manageGoals");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_fundraising_goal", {
    p_organization_id: context.organizationId,
    p_title: parsed.data.title,
    p_description: parsed.data.description ?? null,
    p_target_amount_minor: parsed.data.targetAmount.toString(),
    p_deadline: parsed.data.deadline,
    p_visibility: parsed.data.visibility,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) return mapGoalError(error.code);
  return actionSuccess({ id: String(data) });
}

export async function createGoalContribution(
  input: GoalContributionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = goalContributionSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The contribution data is invalid.");

  const context = await requirePermission("manageGoals");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_goal_contribution", {
    p_organization_id: context.organizationId,
    p_goal_id: parsed.data.goalId,
    p_transaction_id: parsed.data.transactionId,
    p_allocated_amount_minor: parsed.data.allocatedAmount.toString(),
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) return mapGoalError(error.code);
  return actionSuccess({ id: String(data) });
}
