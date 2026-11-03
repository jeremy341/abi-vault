"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseDollarToMinor } from "@/lib/finance/money";
import { cashCountSchema, type CashCountInput } from "@/features/finance/schemas/cash-counts";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import { isDemoData } from "@/lib/demo/mode";
import { addDemoCashCount } from "@/lib/demo/store";

export async function recordCashCount(input: CashCountInput): Promise<ActionResult<{ id: string }>> {
  const parsed = cashCountSchema.safeParse(input);

  if (!parsed.success) return actionFailure("INVALID_INPUT", "The cash count data is invalid.");
  let amount: bigint;

  try {
    amount = parseDollarToMinor(parsed.data.countedAmount);
  } catch {
    return actionFailure("INVALID_AMOUNT", "The cash count amount is invalid.");
  }

  if (isDemoData()) {
    const id = await addDemoCashCount({
      walletId: parsed.data.walletId,
      countedAmountMinor: amount,
      countedByName: parsed.data.auditor ?? "Demo user",
      note: parsed.data.note ?? "",
    });

    return id ? actionSuccess({ id }) : actionFailure("NOT_FOUND", "The cash register was not found.");
  }

  const context = await requirePermission("createTransactions");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("record_cash_count_v2", {
    p_organization_id: context.organizationId,
    p_wallet_id: parsed.data.walletId,
    p_counted_amount_minor: amount.toString(),
    p_counted_by_name: parsed.data.auditor ?? null,
    p_note: parsed.data.note ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  return error
    ? actionFailure("CASH_COUNT_FAILED", "The cash count could not be saved.")
    : actionSuccess({ id: String(data) });
}
