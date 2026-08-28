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
  if (code === "42501") return actionFailure("FORBIDDEN", "Du hast keine Berechtigung für diese Aktion.");
  if (code === "23503" || code === "22023") return actionFailure("INVALID_PAYLOAD", "Die Kassendaten sind ungültig.");
  if (code === "23505") return actionFailure("CONFLICT", "Diese Kassenänderung wurde bereits übermittelt.");
  return actionFailure("DATABASE_ERROR", "Die Kasse konnte nicht gespeichert werden.");
}

export async function createWallet(
  input: WalletCreateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = walletCreateSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Die Kassendaten sind ungültig.");
  if (parsed.data.type !== "cash") {
    return actionFailure("INVALID_PAYLOAD", "Es werden nur Kassen unterstützt.");
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
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Die Kassendaten sind ungültig.");
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
    if (error.code === "23503") return actionFailure("NOT_FOUND", "Die Kasse ist nicht mehr aktiv.");
    return mapWalletError(error.code);
  }
  return actionSuccess(null);
}

export async function archiveWallet(input: unknown) {
  const parsed = walletArchiveSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Die Kassendaten sind ungültig.");
  const context = await requirePermission("manageWallets");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_cash_wallet", {
    p_organization_id: context.organizationId,
    p_wallet_id: parsed.data.walletId,
    p_reason: parsed.data.reason,
  });
  if (error) {
    if (error.code === "23503") return actionFailure("NOT_FOUND", "Die Kasse ist nicht mehr aktiv.");
    return mapWalletError(error.code);
  }
  return actionSuccess(null);
}

async function changePeriod(
  input: PeriodActionInput,
  operation: "lock_accounting_period" | "unlock_accounting_period",
): Promise<ActionResult<null>> {
  const parsed = periodActionSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Die Aktion für den Buchungszeitraum ist ungültig.");

  const context = await requirePermission("lockPeriods");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(operation, {
    p_organization_id: context.organizationId,
    p_period_id: parsed.data.periodId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "Du hast keine Berechtigung, Buchungszeiträume zu verwalten.");
    if (error.code === "55000") return actionFailure("PERIOD_LOCKED", "Der Buchungszeitraum befindet sich bereits im gewünschten Zustand.");
    return actionFailure("DATABASE_ERROR", "Der Buchungszeitraum konnte nicht geändert werden.");
  }

  return actionSuccess(null);
}

export async function lockAccountingPeriod(input: PeriodActionInput) {
  return changePeriod(input, "lock_accounting_period");
}

export async function unlockAccountingPeriod(input: PeriodActionInput) {
  return changePeriod(input, "unlock_accounting_period");
}
