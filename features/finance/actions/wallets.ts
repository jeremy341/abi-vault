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
  if (code === "42501") return actionFailure("FORBIDDEN", "You do not have permission for this action.");
  if (code === "23503" || code === "22023") return actionFailure("INVALID_PAYLOAD", "The cash register data is invalid.");
  if (code === "23505") return actionFailure("CONFLICT", "This cash register change was already submitted.");
  return actionFailure("DATABASE_ERROR", "The cash register could not be saved.");
}

export async function createWallet(
  input: WalletCreateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = walletCreateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The cash register data is invalid.");
  if (parsed.data.type !== "cash") {
    return actionFailure("INVALID_PAYLOAD", "Only cash registers are supported.");
  }

  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { data: walletId, error: insertError } = await supabase.rpc("create_cash_wallet", {
    p_organization_id: context.organizationId,
    p_name: parsed.data.name,
    p_responsible_clerk_user_id: parsed.data.responsibleClerkUserId ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_card_number_visual: parsed.data.cardNumberVisual ?? null,
    p_card_holder_visual: parsed.data.cardHolderVisual ?? null,
    p_card_expiry_visual: parsed.data.cardExpiryVisual ?? null,
    p_card_color_visual: parsed.data.cardColorVisual ?? null,
  });
  if (insertError || !walletId) return mapWalletError(insertError?.code);
  return actionSuccess({ id: String(walletId) });
}

export async function updateWallet(input: unknown) {
  const parsed = walletUpdateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The cash register data is invalid.");
  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_cash_wallet", {
    p_organization_id: context.organizationId,
    p_wallet_id: parsed.data.walletId,
    p_name: parsed.data.name,
    p_reason: parsed.data.reason,
    p_card_number_visual: parsed.data.cardNumberVisual ?? null,
    p_card_holder_visual: parsed.data.cardHolderVisual ?? null,
    p_card_expiry_visual: parsed.data.cardExpiryVisual ?? null,
    p_card_color_visual: parsed.data.cardColorVisual ?? null,
  });
  if (error) {
    if (error.code === "23503") return actionFailure("NOT_FOUND", "The cash register is no longer active.");
    return mapWalletError(error.code);
  }
  return actionSuccess(null);
}

export async function archiveWallet(input: unknown) {
  const parsed = walletArchiveSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The cash register data is invalid.");
  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_cash_wallet", {
    p_organization_id: context.organizationId,
    p_wallet_id: parsed.data.walletId,
    p_reason: parsed.data.reason,
  });
  if (error) {
    if (error.code === "23503") return actionFailure("NOT_FOUND", "The cash register is no longer active.");
    return mapWalletError(error.code);
  }
  return actionSuccess(null);
}

async function changePeriod(
  input: PeriodActionInput,
  operation: "lock_accounting_period" | "unlock_accounting_period",
): Promise<ActionResult<null>> {
  const parsed = periodActionSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "The accounting period action is invalid.");

  const context = await requirePermission("lockPeriods");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(operation, {
    p_organization_id: context.organizationId,
    p_period_id: parsed.data.periodId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "You do not have permission to manage accounting periods.");
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
