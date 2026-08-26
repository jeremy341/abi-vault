"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { manualUiTransactionSchema, parseManualUiAmount } from "@/features/finance/schemas/manual-ui";

export async function createManualTransactionFromUi(input: unknown) {
  const parsed = manualUiTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };
  const context = await requirePermission("createTransactions");
  const supabase = await createSupabaseServerClient();
  let amountMinor: bigint;
  try {
    amountMinor = parseManualUiAmount(parsed.data.amount);
  } catch {
    return { ok: false as const, error: "INVALID_AMOUNT" };
  }
  const type = parsed.data.direction;
  const [{ data: wallet }, { data: category }] = await Promise.all([
    supabase.from("wallets").select("id").eq("organization_id", context.organizationId).eq("id", parsed.data.walletId).eq("type", "cash").eq("status", "active").maybeSingle(),
    supabase.from("categories").select("id").eq("organization_id", context.organizationId).eq("name", parsed.data.categoryName).eq("kind", type).is("archived_at", null).maybeSingle(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const [year, month] = today.split("-").map(Number);
  const { data: period } = await supabase.from("accounting_periods").select("id").eq("organization_id", context.organizationId).eq("year", year).eq("month", month).eq("status", "open").maybeSingle();
  if (!wallet || !category || !period) return { ok: false as const, error: "ACCOUNT_SETUP_INCOMPLETE" };
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
    p_idempotency_key: `ui-${context.clerkUserId}-${crypto.randomUUID()}`,
  });
  return error ? { ok: false as const, error: "TRANSACTION_CREATE_FAILED" } : { ok: true as const, id: String(data) };
}
