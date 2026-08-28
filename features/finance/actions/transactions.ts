"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  transactionCreateSchema,
  type TransactionCreateInput,
} from "@/features/finance/schemas/transactions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapDatabaseError(code?: string) {
  if (code === "42501") return actionFailure("FORBIDDEN", "Du hast keine Berechtigung für diese Aktion.");
  if (code === "55000") return actionFailure("PERIOD_LOCKED", "Der Buchungszeitraum ist gesperrt.");
  if (code === "23503" || code === "23514" || code === "22023" || code === "22003") {
    return actionFailure("INVALID_PAYLOAD", "Die Transaktionsdaten sind ungültig.");
  }
  if (code === "23505") return actionFailure("CONFLICT", "Diese Transaktion wurde bereits übermittelt.");
  return actionFailure("DATABASE_ERROR", "Die Transaktion konnte nicht gespeichert werden.");
}

export async function createManualTransaction(
  input: TransactionCreateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("INVALID_PAYLOAD", "Die Transaktionsdaten sind ungültig.");
  }

  let context;
  try {
    context = await requireClerkContext();
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const code = error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "FORBIDDEN";
      return actionFailure(code, code === "UNAUTHENTICATED" ? "Eine Anmeldung ist erforderlich." : "Ein aktiver Abi-Arbeitsbereich ist erforderlich.");
    }
    return actionFailure("UNAUTHENTICATED", "Eine Anmeldung ist erforderlich.");
  }

  const command = parsed.data;
  if (command.type === "transfer") {
    return actionFailure("INVALID_PAYLOAD", "Überweisungen werden in diesem Ablauf nicht unterstützt.");
  }
  const supabase = await createSupabaseServerClient();
  const walletId = command.type === "income" ? command.toWalletId : command.fromWalletId;
  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", walletId)
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active")
    .maybeSingle();
  if (!wallet) {
    return actionFailure("INVALID_PAYLOAD", "Nur eine aktive Kasse kann Transaktionen aufnehmen.");
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
    p_booked_at: command.bookedAt ?? new Date().toISOString().slice(0, 10),
    p_idempotency_key: command.idempotencyKey,
  });

  if (error) return mapDatabaseError(error.code);
  return actionSuccess({ id: String(data) });
}
