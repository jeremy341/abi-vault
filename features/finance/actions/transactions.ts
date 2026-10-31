"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  transactionCreateSchema,
  type TransactionCreateInput,
} from "@/features/finance/schemas/transactions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { financeDateKey } from "@/lib/finance/date-keys";
import { isDemoData } from "@/lib/demo/mode";
import { demoReadOnlyFailure } from "@/lib/demo/read-only-action";

function mapDatabaseError(code?: string) {
  if (code === "42501") return actionFailure("FORBIDDEN", "You do not have permission for this action.");

  if (code === "55000") return actionFailure("PERIOD_LOCKED", "The accounting period is locked.");

  if (code === "23503" || code === "23514" || code === "22023" || code === "22003") {
    return actionFailure("INVALID_PAYLOAD", "The transaction data is invalid.");
  }

  if (code === "23505") return actionFailure("CONFLICT", "This transaction was already submitted.");

  return actionFailure("DATABASE_ERROR", "The transaction could not be saved.");
}

export async function createManualTransaction(
  input: TransactionCreateInput,
): Promise<ActionResult<{ id: string }>> {
  if (isDemoData()) return demoReadOnlyFailure();

  const parsed = transactionCreateSchema.safeParse(input);

  if (!parsed.success) {
    return actionFailure("INVALID_PAYLOAD", "The transaction data is invalid.");
  }

  let context;

  try {
    context = await requireClerkContext();
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const code = error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "FORBIDDEN";

      return actionFailure(code, code === "UNAUTHENTICATED" ? "Sign-in is required." : "An active Abi workspace is required.");
    }

    return actionFailure("UNAUTHENTICATED", "Sign-in is required.");
  }

  const command = parsed.data;

  if (command.type === "transfer") {
    return actionFailure("INVALID_PAYLOAD", "Transfers are not supported in this flow.");
  }

  const supabase = await createSupabaseServerClient();
  const walletId = command.type === "income" ? command.toWalletId : command.fromWalletId;

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", walletId)
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active")
    .maybeSingle();

  if (walletError) {
    return actionFailure("DATABASE_ERROR", "The cash register could not be checked.");
  }

  if (!wallet) {
    return actionFailure("INVALID_PAYLOAD", "Only one active cash register can contain transactions.");
  }

  const { data, error } = await supabase.rpc("create_manual_transaction", {
    p_organization_id: context.organizationId,
    p_amount_minor: command.amount.toString(),
    p_type: command.type,
    p_title: command.title,
    p_description: command.description ?? null,
    p_category_id: command.categoryId ?? null,
    p_from_wallet_id: command.fromWalletId ?? null,
    p_to_wallet_id: command.toWalletId ?? null,
    p_period_id: command.periodId,
    p_booked_at: command.bookedAt ?? financeDateKey(new Date()),
    p_idempotency_key: command.idempotencyKey,
  });

  if (error) return mapDatabaseError(error.code);

  return actionSuccess({ id: String(data) });
}
