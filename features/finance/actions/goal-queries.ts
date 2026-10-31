"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";
import { fetchAllRows, fetchRowsInBatches } from "@/lib/supabase/fetch-all-rows";

export async function listGoalsForCurrentOrganization() {
  if (isDemoData()) return demoData.goals;
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) return queryFailure("DATABASE_ERROR");

  if (!membership) return queryFailure("FORBIDDEN");

  if (membership.role === "student") {
    const { data: transparencyGoalProgress, error } = await fetchAllRows((from, to) =>
      supabase
        .from("transparency_goal_progress")
        .select("id, title, target_amount_minor::text, saved_amount_minor::text, deadline")
        .order("deadline")
        .order("id")
        .range(from, to),
    );

    if (error) return queryFailure("DATABASE_ERROR");

    return querySuccess({ items: transparencyGoalProgress ?? [] });
  }

  const { data: goals, error } = await fetchAllRows((from, to) =>
    supabase
      .from("fundraising_goals")
      .select("id, title, target_amount_minor::text, deadline, status")
      .eq("organization_id", context.organizationId)
      .neq("status", "archived")
      .order("deadline")
      .order("id")
      .range(from, to),
  );

  if (error) return queryFailure("DATABASE_ERROR");
  const goalIds = (goals ?? []).map((goal) => goal.id);

  const { data: contributions, error: contributionError } = await fetchRowsInBatches(
    goalIds,
    (batch) =>
      fetchAllRows((from, to) =>
        supabase
          .from("goal_contributions")
          .select("id, goal_id, allocated_amount_minor::text")
          .in("goal_id", batch)
          .order("id")
          .range(from, to),
      ),
  );

  if (contributionError) return queryFailure("DATABASE_ERROR");

  const saved = new Map<string, bigint>();

  for (const contribution of contributions ?? []) saved.set(contribution.goal_id, (saved.get(contribution.goal_id) ?? BigInt(0)) + BigInt(String(contribution.allocated_amount_minor)));

  return querySuccess({
    items: (goals ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      target_amount_minor: String(goal.target_amount_minor),
      saved_amount_minor: (saved.get(goal.id) ?? BigInt(0)).toString(),
      deadline: goal.deadline,
    })),
  });
}
