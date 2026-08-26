"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseEuroToMinor } from "@/lib/finance/money";
import { cashCountSchema } from "@/features/finance/schemas/cash-counts";

export async function recordCashCount(input: unknown) {
  const parsed = cashCountSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  let amount: bigint;
  try { amount = parseEuroToMinor(parsed.data.countedAmount); } catch { return { ok: false as const, error: "INVALID_AMOUNT" }; }
  const context = await requirePermission("createTransactions");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_cash_count", {
    p_organization_id: context.organizationId,
    p_wallet_id: parsed.data.walletId,
    p_counted_amount_minor: amount.toString(),
    p_note: parsed.data.note ?? null,
  });
  return error ? { ok: false as const, error: "CASH_COUNT_FAILED" } : { ok: true as const, id: String(data) };
}
