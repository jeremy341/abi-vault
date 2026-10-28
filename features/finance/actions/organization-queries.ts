"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import type { AccountingPeriodListItem, CashCountListItem } from "./queries-types";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";

export async function getCommitteeSettingsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: committeeSettings, error } = await supabase
    .from("committee_settings")
    .select("school_name, graduation_year, notifications")
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (error) return queryFailure("DATABASE_ERROR");

  return querySuccess({ data: committeeSettings });
}

export async function listMembersForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: memberships, error } = await supabase
    .from("committee_memberships")
    .select("clerk_user_id, role, status, profiles(display_name, email)")
    .eq("organization_id", context.organizationId)
    .order("created_at");

  if (error) return queryFailure("DATABASE_ERROR");

  return querySuccess({
    items: (memberships ?? []).map((membership) => {
      const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;

      return {
        id: membership.clerk_user_id,
        name: profile?.display_name || profile?.email || "Unbekannt",
        role: membership.role,
        status: membership.status,
      };
    }),
  });
}


export async function listCashCountsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: cashCounts, error } = await supabase
    .from("cash_counts")
    .select("id, wallet_id, counted_amount_minor, book_amount_minor, difference_minor, counted_by_name, created_at, note")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) return queryFailure("DATABASE_ERROR");

  return querySuccess({
    items: (cashCounts ?? []).map((cashCount): CashCountListItem => ({
      id: cashCount.id,
      walletId: cashCount.wallet_id,
      countedAmountMinor: String(cashCount.counted_amount_minor),
      bookAmountMinor: String(cashCount.book_amount_minor),
      differenceMinor: String(cashCount.difference_minor),
      countedByName: cashCount.counted_by_name,
      createdAt: cashCount.created_at,
      note: cashCount.note,
    })),
  });
}

export async function listAccountingPeriodsForCurrentOrganization() {
  const context = await requirePermission("lockPeriods");
  const supabase = await createSupabaseServerClient();

  const { data: periods, error } = await supabase
    .from("accounting_periods")
    .select("id, year, month, status, locked_at, locked_by, lock_reason")
    .eq("organization_id", context.organizationId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) return queryFailure("DATABASE_ERROR");

  const lockedByIds = [...new Set((periods ?? []).map((period) => period.locked_by).filter(Boolean))];

  const emptyLockedProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: profiles, error: profileError } = lockedByIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", lockedByIds)
    : { data: emptyLockedProfiles, error: null };

  if (profileError) return queryFailure("DATABASE_ERROR");
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.clerk_user_id, profile.display_name || profile.email || "Unbekannt"]));

  return querySuccess({
    items: (periods ?? []).map((period): AccountingPeriodListItem => ({
      id: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
      lockedAt: period.locked_at,
      lockedByName: period.locked_by ? profileMap.get(period.locked_by) ?? "Unbekannt" : null,
      lockReason: period.lock_reason,
    })),
  });
}
