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
  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("id, title, type, amount_minor, currency, booked_at, origin, provider, external_transaction_id, category_id")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null)
    .order("booked_at", { ascending: false });
  if (transactionError) return { ok: false as const, error: "EXPORT_FAILED" };

  if (format === "Prüfprotokoll") {
    const { data: receipts } = await supabase
      .from("receipts")
      .select("file_name, review_status, created_at, transaction_id")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false });
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
  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] as { id: string; name: string }[] };
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
