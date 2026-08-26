"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  periodActionSchema,
  walletCreateSchema,
  walletArchiveSchema,
  walletUpdateSchema,
  type PeriodActionInput,
  type WalletCreateInput,
} from "@/features/finance/schemas/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapWalletError(code?: string) {
  if (code === "42501") return actionFailure("FORBIDDEN", "You are not allowed to perform this action.");
  if (code === "23503" || code === "22023") return actionFailure("INVALID_PAYLOAD", "The wallet data is invalid.");
  if (code === "23505") return actionFailure("CONFLICT", "This wallet request was already submitted.");
  return actionFailure("DATABASE_ERROR", "The wallet could not be saved.");
}

export async function createWallet(
  input: WalletCreateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = walletCreateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The wallet data is invalid.");
  if (parsed.data.type !== "cash") {
    return actionFailure("INVALID_PAYLOAD", "Only the canonical cash wallet is supported.");
  }

  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_wallet", {
    p_organization_id: context.organizationId,
    p_name: parsed.data.name,
    p_type: parsed.data.type,
    p_responsible_clerk_user_id: parsed.data.responsibleClerkUserId ?? null,
    p_bank_connection_id: parsed.data.bankConnectionId ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) return mapWalletError(error.code);
  return actionSuccess({ id: String(data) });
}

export async function updateWallet(input: unknown) {
  const parsed = walletUpdateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The wallet data is invalid.");
  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wallets")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.walletId)
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active");
  if (error) return mapWalletError(error.code);
  return actionSuccess(null);
}

export async function archiveWallet(input: unknown) {
  const parsed = walletArchiveSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The wallet data is invalid.");
  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wallets")
    .update({ status: "archived" })
    .eq("id", parsed.data.walletId)
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active");
  if (error) return mapWalletError(error.code);
  return actionSuccess(null);
}

async function changePeriod(
  input: PeriodActionInput,
  operation: "lock_accounting_period" | "unlock_accounting_period",
): Promise<ActionResult<null>> {
  const parsed = periodActionSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The period action is invalid.");

  const context = await requirePermission("lockPeriods");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(operation, {
    p_organization_id: context.organizationId,
    p_period_id: parsed.data.periodId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "You are not allowed to manage periods.");
    if (error.code === "55000") return actionFailure("PERIOD_LOCKED", "The accounting period is already in the requested state.");
    return actionFailure("DATABASE_ERROR", "The accounting period could not be changed.");
  }

  return actionSuccess(null);
}

export async function lockAccountingPeriod(input: PeriodActionInput) {
  return changePeriod(input, "lock_accounting_period");
}

export async function unlockAccountingPeriod(input: PeriodActionInput) {
  return changePeriod(input, "unlock_accounting_period");
}
