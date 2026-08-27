"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseEuroToMinor } from "@/lib/finance/money";
import {
  transactionArchiveSchema,
  transactionCorrectionSchema,
  type TransactionArchiveInput,
  type TransactionCorrectionInput,
} from "@/features/finance/schemas/corrections";

function mapCorrectionError(code?: string) {
  if (code === "42501") return actionFailure("FORBIDDEN", "Du darfst diese Transaktion nicht ändern.");
  if (code === "55000") return actionFailure("PERIOD_LOCKED", "Der Buchungszeitraum ist gesperrt.");
  if (code === "23505") return actionFailure("CONFLICT", "Diese Änderung wurde bereits übermittelt.");
  if (code === "23503" || code === "23514" || code === "22023" || code === "22003") {
    return actionFailure("INVALID_PAYLOAD", "Die Transaktionsdaten sind ungültig.");
  }
  return actionFailure("DATABASE_ERROR", "Die Transaktion konnte nicht geändert werden.");
}

export async function correctTransactionFromUi(
  input: TransactionCorrectionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionCorrectionSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Bitte alle Änderungsfelder ausfüllen.");
  const context = await requirePermission("editOpenTransactions");
  let amountMinor: bigint;
  try {
    amountMinor = parseEuroToMinor(parsed.data.amount);
  } catch {
    return actionFailure("INVALID_PAYLOAD", "Der Betrag ist ungültig.");
  }
  if (amountMinor <= BigInt(0)) return actionFailure("INVALID_PAYLOAD", "Der Betrag muss größer als 0 sein.");

  const supabase = await createSupabaseServerClient();
  const { data: original, error: originalError } = await supabase
    .from("transactions")
    .select("id, created_by, status, type, from_wallet_id, to_wallet_id, period_id, booked_at")
    .eq("id", parsed.data.transactionId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (originalError) return mapCorrectionError(originalError.code);
  if (!original) return actionFailure("NOT_FOUND", "Die Transaktion wurde nicht gefunden.");
  if (context.role !== "admin" && original.created_by !== context.clerkUserId) {
    return actionFailure("FORBIDDEN", "Nur der Ersteller oder ein Admin kann bearbeiten.");
  }
  if (original.status !== "posted") return actionFailure("CONFLICT", "Diese Transaktion kann nicht mehr geändert werden.");

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("name", parsed.data.categoryName)
    .eq("kind", parsed.data.direction)
    .is("archived_at", null)
    .maybeSingle();
  if (categoryError) return mapCorrectionError(categoryError.code);
  if (!category) return actionFailure("INVALID_PAYLOAD", "Die Kategorie ist nicht verfügbar.");

  const fromWalletId = parsed.data.direction === "expense"
    ? original.type === "expense" ? original.from_wallet_id : original.to_wallet_id
    : null;
  const toWalletId = parsed.data.direction === "income"
    ? original.type === "income" ? original.to_wallet_id : original.from_wallet_id
    : null;
  if (!fromWalletId && parsed.data.direction === "expense") {
    return actionFailure("INVALID_PAYLOAD", "Der Quellbereich der Transaktion fehlt.");
  }
  if (!toWalletId && parsed.data.direction === "income") {
    return actionFailure("INVALID_PAYLOAD", "Der Zielbereich der Transaktion fehlt.");
  }

  const { data, error } = await supabase.rpc("correct_manual_transaction", {
    p_organization_id: context.organizationId,
    p_transaction_id: parsed.data.transactionId,
    p_amount_minor: amountMinor.toString(),
    p_type: parsed.data.direction,
    p_title: parsed.data.title,
    p_description: null,
    p_category_id: category.id,
    p_from_wallet_id: fromWalletId,
    p_to_wallet_id: toWalletId,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return mapCorrectionError(error.code);
  return actionSuccess({ id: String(data) });
}

export async function archiveTransaction(
  input: TransactionArchiveInput,
): Promise<ActionResult<null>> {
  const parsed = transactionArchiveSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_PAYLOAD", "Ein Archivierungsgrund ist erforderlich.");
  const context = await requirePermission("archiveFinanceRecords");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_transaction", {
    p_organization_id: context.organizationId,
    p_transaction_id: parsed.data.transactionId,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return mapCorrectionError(error.code);
  return actionSuccess(null);
}
