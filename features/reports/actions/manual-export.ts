"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllRows, fetchRowsInBatches } from "@/lib/supabase/fetch-all-rows";
import { transactionsForCashWallets } from "@/features/finance/actions/query-filters";
import { financeDateKey } from "@/lib/finance/date-keys";
import { signedMinorAmount } from "@/lib/finance/money";

type ExportFormat = "Excel" | "Review log";

type CsvValue = string | number | null | undefined;

function csvCell(value: CsvValue, userText = false) {
  let text = String(value ?? "");

  if (userText && /^[\t\r ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvFile(name: string, rows: CsvValue[][], userTextColumns: readonly number[] = []) {
  const protectedColumns = new Set(userTextColumns);

  return {
    ok: true as const,
    filename: name,
    content: rows
      .map((row) => row.map((value, index) => csvCell(value, protectedColumns.has(index))).join(","))
      .join("\n"),
  };
}

function exportDemoData(format: ExportFormat) {
  const fileDate = financeDateKey(new Date());

  if (format === "Review log") {
    return csvFile(`abi-vault-pruefprotokoll-${fileDate}.csv`, [
      ["File", "Status", "Transaction ID", "Uploaded"],
      ...demoData.receipts.items.map((receipt) => [
        receipt.file,
        receipt.status,
        receipt.transactionId ?? "",
        receipt.uploadedAt,
      ]),
    ]);
  }

  return csvFile(`abi-vault-transaktionen-${fileDate}.csv`, [
    ["Title", "Type", "Amount (Cent)", "Currency", "Booked on", "Category"],
    ...demoData.transactions.items.map((transaction) => [
      transaction.title,
      transaction.type,
      signedMinorAmount(transaction.amountMinor, transaction.type),
      "USD",
      transaction.date,
      transaction.category,
    ]),
  ], [0, 5]);
}

export async function exportManualFinanceReport(format: ExportFormat) {
  if (isDemoData()) return exportDemoData(format);

  const context = await requirePermission("exportData");
  const supabase = await createSupabaseServerClient();
  const fileDate = financeDateKey(new Date());

  if (format === "Review log") {
    const { data: receipts, error } = await fetchAllRows((from, to) =>
      supabase
        .from("receipts")
        .select("file_name, review_status, created_at, transaction_id")
        .eq("organization_id", context.organizationId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    );

    if (error) return { ok: false as const, error: "EXPORT_FAILED" };

    return csvFile(`abi-vault-pruefprotokoll-${fileDate}.csv`, [
      ["File", "Status", "Transaction ID", "Uploaded"],
      ...(receipts ?? []).map((receipt) => [
        receipt.file_name,
        receipt.review_status,
        receipt.transaction_id ?? "",
        receipt.created_at,
      ]),
    ], [0]);
  }

  const { data: wallets, error: walletError } = await fetchAllRows((from, to) =>
    supabase
      .from("wallets")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("type", "cash")
      .eq("status", "active")
      .order("id")
      .range(from, to),
  );

  if (walletError) return { ok: false as const, error: "EXPORT_FAILED" };

  const walletIds = [...new Set((wallets ?? []).map((wallet) => wallet.id))];

  const transactionsResult = walletIds.length
    ? await fetchAllRows((from, to) =>
        supabase
          .from("transactions")
          .select("id, title, type, amount_minor::text, currency, booked_at, category_id")
          .eq("organization_id", context.organizationId)
          .eq("status", "posted")
          .is("deleted_at", null)
          .is("superseded_at", null)
          .or(transactionsForCashWallets(walletIds))
          .order("booked_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      )
    : { data: [], error: null };

  if (transactionsResult.error) return { ok: false as const, error: "EXPORT_FAILED" };

  const transactions = transactionsResult.data ?? [];

  const categoryIds = [...new Set(
    transactions
      .map((transaction) => transaction.category_id)
      .filter((id): id is string => Boolean(id)),
  )];

  const { data: categories, error: categoryError } = await fetchRowsInBatches(
    categoryIds,
    (batch) =>
      fetchAllRows((from, to) =>
        supabase
          .from("categories")
          .select("id, name")
          .eq("organization_id", context.organizationId)
          .in("id", batch)
          .order("id")
          .range(from, to),
      ),
  );

  if (categoryError) return { ok: false as const, error: "EXPORT_FAILED" };

  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return csvFile(`abi-vault-transaktionen-${fileDate}.csv`, [
    ["Title", "Type", "Amount (Cent)", "Currency", "Booked on", "Category"],
    ...transactions.map((transaction) => [
      transaction.title,
      transaction.type,
      signedMinorAmount(transaction.amount_minor, transaction.type),
      transaction.currency,
      transaction.booked_at ?? "",
      transaction.category_id ? categoryNameById.get(transaction.category_id) ?? "" : "",
    ]),
  ], [0, 5]);
}
