"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";
import { signedMinorAmount } from "@/lib/finance/money";
import { fetchAllRows, fetchRowsInBatches } from "@/lib/supabase/fetch-all-rows";
import { transactionsForCashWallets } from "./query-filters";

export async function listTransactionsForCurrentOrganization() {
  if (isDemoData()) return demoData.transactions;
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) return queryFailure("DATABASE_ERROR");

  if (!membership) return queryFailure("FORBIDDEN");

  if (membership.role === "student") {
    const { data: transparencyTransactions, error } = await fetchAllRows((from, to) =>
      supabase
        .from("transparency_transactions")
        .select("transaction_id, public_title, public_type, public_date, amount_minor::text, category_name, wallet_label")
        .order("public_date", { ascending: false })
        .order("transaction_id", { ascending: false })
        .range(from, to),
    );

    if (error) return queryFailure("DATABASE_ERROR");

    return querySuccess({
      items: (transparencyTransactions ?? []).map((transparencyTransaction) => ({
        id: transparencyTransaction.transaction_id,
        title: transparencyTransaction.public_title,
        category: transparencyTransaction.category_name ?? "Sonstiges",
        date: transparencyTransaction.public_date ?? "",
        amountMinor: signedMinorAmount(transparencyTransaction.amount_minor, transparencyTransaction.public_type),
        type: transparencyTransaction.public_type,
        receipt: false,
        receiptId: null,
        receiptFile: null,
        receiptType: null,
        reviewStatus: "Approved",
        createdByName: null,
        createdAt: "",
        account: transparencyTransaction.wallet_label ?? "Unassigned",
        walletId: null,
        fromWalletId: null,
        toWalletId: null,
        createdBy: null,
        canEdit: false,
        canDelete: false,
      })),
    });
  }

  const { data: cashWallets, error: cashWalletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active");

  if (cashWalletError) return queryFailure("DATABASE_ERROR");
  const cashWalletIds = new Set((cashWallets ?? []).map((wallet) => wallet.id));

  if (!cashWalletIds.size) return querySuccess({ items: [] });
  const cashTransactionFilter = transactionsForCashWallets([...cashWalletIds]);

  const { data: transactions, error } = await fetchAllRows((from, to) =>
    supabase
      .from("transactions")
      .select("id, title, type, booked_at, amount_minor::text, category_id, from_wallet_id, to_wallet_id, created_by, created_at, correction_role, superseded_at")
      .eq("organization_id", context.organizationId)
      .eq("status", "posted")
      .is("deleted_at", null)
      .is("superseded_at", null)
      .or(cashTransactionFilter)
      .order("booked_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
  );

  if (error) return queryFailure("DATABASE_ERROR");

  const cashTransactions = transactions ?? [];

  const categoryIds = [...new Set(
    cashTransactions
      .map((transaction) => transaction.category_id)
      .filter((id): id is string => Boolean(id)),
  )];

  const walletIds = [...new Set(
    cashTransactions
      .flatMap((transaction) => [transaction.from_wallet_id, transaction.to_wallet_id])
      .filter((id): id is string => Boolean(id)),
  )];

  const creatorIds = [...new Set(
    cashTransactions
      .map((transaction) => transaction.created_by)
      .filter((id): id is string => Boolean(id)),
  )];

  const receiptPromise = fetchRowsInBatches(
    cashTransactions.map((transaction) => transaction.id),
    (transactionIds) =>
      fetchAllRows((from, to) =>
        supabase
          .from("receipts")
          .select("id, file_name, mime_type, transaction_id, review_status")
          .eq("organization_id", context.organizationId)
          .is("archived_at", null)
          .in("transaction_id", transactionIds)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      ),
  );

  const [
    { data: categories, error: categoryError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
    { data: creators, error: creatorError },
  ] = await Promise.all([
    fetchRowsInBatches(categoryIds, (batch) =>
      fetchAllRows((from, to) =>
        supabase
          .from("categories")
          .select("id, name")
          .in("id", batch)
          .order("id")
          .range(from, to),
      ),
    ),
    fetchRowsInBatches(walletIds, (batch) =>
      fetchAllRows((from, to) =>
        supabase
          .from("wallets")
          .select("id, name")
          .in("id", batch)
          .order("id")
          .range(from, to),
      ),
    ),
    receiptPromise,
    fetchRowsInBatches(creatorIds, (batch) =>
      fetchAllRows((from, to) =>
          supabase
            .from("profiles")
            .select("clerk_user_id, display_name, email")
            .in("clerk_user_id", batch)
            .order("clerk_user_id")
            .range(from, to),
      ),
    ),
  ]);

  if (categoryError || walletError || receiptError || creatorError) return queryFailure("DATABASE_ERROR");
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const walletMap = new Map((wallets ?? []).map((wallet) => [wallet.id, wallet.name]));
  const creatorMap = new Map((creators ?? []).map((creator) => [creator.clerk_user_id, creator.display_name || creator.email || "Unbekannt"]));

  const receiptMap = new Map<string, { id: string; fileName: string; type: string; status: string }>(
    (receipts ?? [])
      .filter((receipt): receipt is typeof receipt & { transaction_id: string } => Boolean(receipt.transaction_id))
      .map((receipt) => [receipt.transaction_id, { id: receipt.id, fileName: receipt.file_name, type: receipt.mime_type, status: receipt.review_status }]),
  );

  return querySuccess({
    items: cashTransactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      category: transaction.category_id ? categoryMap.get(transaction.category_id) ?? "Sonstiges" : "Sonstiges",
      date: transaction.booked_at ?? "",
      amountMinor: signedMinorAmount(transaction.amount_minor, transaction.type),
      type: transaction.type,
      receipt: receiptMap.has(transaction.id),
      reviewStatus: receiptMap.get(transaction.id)?.status === "approved" ? "Approved" : receiptMap.get(transaction.id)?.status === "rejected" ? "Invalid" : "Pending review",
      createdByName: creatorMap.get(transaction.created_by) ?? null,
      createdAt: transaction.created_at,
      receiptId: receiptMap.get(transaction.id)?.id ?? null,
      receiptFile: receiptMap.get(transaction.id)?.fileName ?? null,
      receiptType: receiptMap.get(transaction.id)?.type ?? null,
      account: walletMap.get(transaction.type === "income" ? transaction.to_wallet_id : transaction.from_wallet_id) ?? "Unassigned",
      walletId: transaction.type === "income" ? transaction.to_wallet_id : transaction.from_wallet_id,
      fromWalletId: transaction.from_wallet_id,
      toWalletId: transaction.to_wallet_id,
      createdBy: transaction.created_by,
      canEdit: membership.role === "admin" || transaction.created_by === context.clerkUserId,
      canDelete: membership.role === "admin",
    })),
  });
}
