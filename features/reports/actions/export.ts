"use server";

import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[\",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportReport(format: "Excel" | "Prüfprotokoll") {
  const context = await requirePermission("exportData");
  const supabase = await createSupabaseServerClient();
  const [{ data: wallets, error: walletError }, { data: rawTransactions, error: transactionError }] = await Promise.all([
    supabase
      .from("wallets")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("type", "cash")
      .eq("status", "active"),
    supabase
    .from("transactions")
    .select("id, title, type, amount_minor, currency, booked_at, origin, provider, external_transaction_id, category_id, from_wallet_id, to_wallet_id, correction_role, superseded_at")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null)
    .is("superseded_at", null)
    .or("correction_role.is.null,correction_role.neq.reversal")
    .order("booked_at", { ascending: false }),
  ]);
  if (walletError || transactionError) return { ok: false as const, error: "EXPORT_FAILED" };
  const activeWalletIds = new Set((wallets ?? []).map((wallet) => wallet.id));
  const transactions = (rawTransactions ?? []).filter((transaction) =>
    activeWalletIds.has(transaction.from_wallet_id ?? "") || activeWalletIds.has(transaction.to_wallet_id ?? ""),
  );

  if (format === "Prüfprotokoll") {
    const { data: receipts, error: receiptError } = await supabase
      .from("receipts")
      .select("file_name, review_status, created_at, transaction_id")
      .eq("organization_id", context.organizationId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (receiptError) return { ok: false as const, error: "EXPORT_FAILED" };
    const rows = [
      ["Datei", "Status", "Transaktions-ID", "Hochgeladen"],
      ...(receipts ?? []).map((receipt) => [receipt.file_name, receipt.review_status, receipt.transaction_id ?? "", receipt.created_at]),
    ];
    return {
      ok: true as const,
      filename: `abi-vault-pruefprotokoll-${new Date().toISOString().slice(0, 10)}.csv`,
      content: rows.map((row) => row.map(csvCell).join(",")).join("\n"),
    };
  }

  const categoryIds = [...new Set((transactions ?? []).map((transaction) => transaction.category_id).filter(Boolean))];
  const { data: categories, error: categoryError } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] as { id: string; name: string }[], error: null };
  if (categoryError) return { ok: false as const, error: "EXPORT_FAILED" };
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const rows = [
    ["Titel", "Typ", "Betrag (Cent)", "Währung", "Gebucht am", "Kategorie", "Herkunft", "Provider-ID"],
    ...(transactions ?? []).map((transaction) => [
      transaction.title,
      transaction.type,
      transaction.type === "expense" ? `-${transaction.amount_minor}` : String(transaction.amount_minor),
      transaction.currency,
      transaction.booked_at ?? "",
      transaction.category_id ? categoryMap.get(transaction.category_id) ?? "" : "",
      transaction.origin,
      transaction.external_transaction_id ?? "",
    ]),
  ];
  return {
    ok: true as const,
    filename: `abi-vault-transaktionen-${new Date().toISOString().slice(0, 10)}.csv`,
    content: rows.map((row) => row.map(csvCell).join(",")).join("\n"),
  };
}
