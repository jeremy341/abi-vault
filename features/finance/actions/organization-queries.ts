"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions-server";
import type { AccountingPeriodListItem, CashCountListItem } from "./queries-types";

export async function getCommitteeSettingsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("committee_settings")
    .select("school_name, graduation_year, notifications")
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  return { ok: true as const, data };
}

export async function listMembersForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("committee_memberships")
    .select("clerk_user_id, role, status, profiles(display_name, email)")
    .eq("organization_id", context.organizationId)
    .order("created_at");

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  return {
    ok: true as const,
    items: (data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;

      return {
        id: item.clerk_user_id,
        name: profile?.display_name || profile?.email || "Unbekannt",
        role: item.role,
        status: item.status,
      };
    }),
  };
}

// SAFETY: the KPI projection consumes only explicitly selected Supabase rows.

export async function listCashCountsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cash_counts")
    .select("id, wallet_id, counted_amount_minor, book_amount_minor, difference_minor, counted_by_name, created_at, note")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  return {
    ok: true as const,
    items: (data ?? []).map((item): CashCountListItem => ({
      id: item.id,
      walletId: item.wallet_id,
      countedAmountMinor: String(item.counted_amount_minor),
      bookAmountMinor: String(item.book_amount_minor),
      differenceMinor: String(item.difference_minor),
      countedByName: item.counted_by_name,
      createdAt: item.created_at,
      note: item.note,
    })),
  };
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

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const lockedByIds = [...new Set((periods ?? []).map((period) => period.locked_by).filter(Boolean))];

  const emptyLockedProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: profiles, error: profileError } = lockedByIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", lockedByIds)
    : { data: emptyLockedProfiles, error: null };

  if (profileError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.clerk_user_id, profile.display_name || profile.email || "Unbekannt"]));

  return {
    ok: true as const,
    items: (periods ?? []).map((period): AccountingPeriodListItem => ({
      id: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
      lockedAt: period.locked_at,
      lockedByName: period.locked_by ? profileMap.get(period.locked_by) ?? "Unbekannt" : null,
      lockReason: period.lock_reason,
    })),
  };
}

