"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  manualUiTransactionSchema,
  parseManualUiAmount,
  type ManualUiTransactionInput,
} from "@/features/finance/schemas/manual-ui";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import { financeDateKey } from "@/lib/finance/date-keys";
import { isDemoData } from "@/lib/demo/mode";
import { demoReadOnlyFailure } from "@/lib/demo/read-only-action";

export async function createManualTransactionFromUi(input: ManualUiTransactionInput): Promise<ActionResult<{ id: string; bookedAt: string }>> {
  if (isDemoData()) return demoReadOnlyFailure();

  const parsed = manualUiTransactionSchema.safeParse(input);

  if (!parsed.success) return actionFailure("INVALID_INPUT", "The transaction data is invalid.");
  const context = await requirePermission("createTransactions");
  const supabase = await createSupabaseServerClient();
  let amountMinor: bigint;

  try {
    amountMinor = parseManualUiAmount(parsed.data.amount);
  } catch {
    return actionFailure("INVALID_AMOUNT", "The transaction amount is invalid.");
  }

  const type = parsed.data.direction;

  const [
    { data: wallet, error: walletError },
    { data: category, error: categoryError },
  ] = await Promise.all([
    supabase.from("wallets").select("id").eq("organization_id", context.organizationId).eq("id", parsed.data.walletId).eq("type", "cash").eq("status", "active").maybeSingle(),
    supabase.from("categories").select("id").eq("organization_id", context.organizationId).eq("name", parsed.data.categoryName).eq("kind", type).is("archived_at", null).maybeSingle(),
  ]);

  if (walletError || categoryError) {
    return actionFailure("DATABASE_ERROR", "The cash register setup could not be checked.");
  }

  const today = financeDateKey(new Date());
  const [year, month] = today.split("-").map(Number);
  const { data: period, error: periodError } = await supabase.from("accounting_periods").select("id").eq("organization_id", context.organizationId).eq("year", year).eq("month", month).eq("status", "open").maybeSingle();

  if (periodError) {
    return actionFailure("DATABASE_ERROR", "The accounting period could not be checked.");
  }

  if (!wallet || !category || !period) {
    return actionFailure("ACCOUNT_SETUP_INCOMPLETE", "The cash register setup is incomplete.");
  }

  const { data, error } = await supabase.rpc("create_manual_transaction", {
    p_organization_id: context.organizationId,
    p_amount_minor: amountMinor.toString(),
    p_type: type,
    p_title: parsed.data.title,
    p_description: null,
    p_category_id: category.id,
    p_from_wallet_id: type === "expense" ? wallet.id : null,
    p_to_wallet_id: type === "income" ? wallet.id : null,
    p_period_id: period.id,
    p_booked_at: today,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  return error
    ? actionFailure("TRANSACTION_CREATE_FAILED", "The transaction could not be saved.")
    : actionSuccess({ id: String(data), bookedAt: today });
}
