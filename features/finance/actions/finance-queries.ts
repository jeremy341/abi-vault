"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";

export async function listTransactionsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return queryFailure("FORBIDDEN");

  if (membership.role === "student") {
    const { data: transparencyTransactions, error } = await supabase
      .from("transparency_transactions")
      .select("transaction_id, public_title, public_type, public_date, amount_minor, category_name, wallet_label")
      .order("public_date", { ascending: false });

    if (error) return queryFailure("DATABASE_ERROR");

    return querySuccess({
      items: (transparencyTransactions ?? []).map((transparencyTransaction) => ({
        id: transparencyTransaction.transaction_id,
        title: transparencyTransaction.public_title,
        category: transparencyTransaction.category_name ?? "Sonstiges",
        date: transparencyTransaction.public_date ?? "",
        amountMinor: String(transparencyTransaction.public_type === "expense" ? -transparencyTransaction.amount_minor : transparencyTransaction.amount_minor),
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

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, title, type, booked_at, amount_minor, category_id, from_wallet_id, to_wallet_id, created_by, created_at, correction_role, superseded_at")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null)
    .is("superseded_at", null)
    .or("correction_role.is.null,correction_role.neq.reversal")
    .order("booked_at", { ascending: false });

  if (error) return queryFailure("DATABASE_ERROR");

  const cashTransactions = (transactions ?? []).filter((transaction) =>
    cashWalletIds.has(transaction.from_wallet_id ?? "") || cashWalletIds.has(transaction.to_wallet_id ?? ""),
  );

  const categoryIds = [...new Set(cashTransactions.map((transaction) => transaction.category_id).filter(Boolean))];
  const walletIds = [...new Set(cashTransactions.flatMap((transaction) => [transaction.from_wallet_id, transaction.to_wallet_id]).filter(Boolean))];

  const [
    { data: categories, error: categoryError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
  ] = await Promise.all([
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    walletIds.length ? supabase.from("wallets").select("id, name").in("id", walletIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    supabase.from("receipts").select("id, file_name, mime_type, transaction_id, review_status").eq("organization_id", context.organizationId).is("archived_at", null),
  ]);

  if (categoryError || walletError || receiptError) return queryFailure("DATABASE_ERROR");
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const walletMap = new Map((wallets ?? []).map((wallet) => [wallet.id, wallet.name]));
  const creatorIds = [...new Set(cashTransactions.map((transaction) => transaction.created_by).filter(Boolean))];

  const emptyCreatorProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: creators, error: creatorError } = creatorIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", creatorIds)
    : { data: emptyCreatorProfiles, error: null };

  if (creatorError) return queryFailure("DATABASE_ERROR");
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
      amountMinor: String(transaction.type === "expense" ? -transaction.amount_minor : transaction.amount_minor),
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


export async function listReceiptsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || !membership) return queryFailure("FORBIDDEN");

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("id, file_name, mime_type, file_size_bytes, transaction_id, review_status, created_at, uploaded_by, reviewed_by, reviewed_at")
    .eq("organization_id", context.organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) return queryFailure("DATABASE_ERROR");

  const transactionIds = [...new Set((receipts ?? []).map((receipt) => receipt.transaction_id).filter(Boolean))];

  const emptyReceiptTransactions: Array<{ id: string; title: string; type: string; booked_at: string | null; amount_minor: number }> = [];

  const { data: transactions, error: transactionError } = transactionIds.length
    ? await supabase.from("transactions").select("id, title, type, booked_at, amount_minor").in("id", transactionIds)
    : { data: emptyReceiptTransactions };

  if (transactionError) return queryFailure("DATABASE_ERROR");
  const transactionMap = new Map((transactions ?? []).map((transaction) => [transaction.id, transaction]));
  const profileIds = [...new Set((receipts ?? []).flatMap((receipt) => [receipt.uploaded_by, receipt.reviewed_by]).filter(Boolean))];

  const emptyReceiptProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: receiptProfiles, error: receiptProfileError } = profileIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", profileIds)
    : { data: emptyReceiptProfiles, error: null };

  if (receiptProfileError) return queryFailure("DATABASE_ERROR");
  const receiptProfileMap = new Map((receiptProfiles ?? []).map((profile) => [profile.clerk_user_id, profile.display_name || profile.email || "Unbekannt"]));

  return querySuccess({
    items: (receipts ?? []).map((receipt) => {
      const transaction = receipt.transaction_id ? transactionMap.get(receipt.transaction_id) : undefined;

      return {
        id: receipt.id,
        file: receipt.file_name,
        type: receipt.mime_type === "application/pdf" ? "PDF" : receipt.mime_type === "image/png" ? "PNG" : "JPG",
        sizeBytes: receipt.file_size_bytes,
        transaction: transaction?.title ?? "Unassigned",
        transactionId: receipt.transaction_id,
        assigned: Boolean(receipt.transaction_id),
        date: transaction?.booked_at ?? receipt.created_at.slice(0, 10),
        amountMinor: transaction ? String(transaction.type === "expense" ? -transaction.amount_minor : transaction.amount_minor) : "0",
        status: receipt.review_status,
        uploadedByName: receiptProfileMap.get(receipt.uploaded_by) ?? "Unbekannt",
        uploadedAt: receipt.created_at,
        reviewedByName: receipt.reviewed_by ? receiptProfileMap.get(receipt.reviewed_by) ?? "Unbekannt" : null,
        reviewedAt: receipt.reviewed_at,
        canEdit: membership.role === "admin" || receipt.uploaded_by === context.clerkUserId,
        canDelete: membership.role === "admin",
      };
    }),
  });
}


export async function listWalletsForCurrentOrganization(options?: { includeBalances?: boolean }) {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, name, type, status, responsible_clerk_user_id, opening_balance_minor, card_number_visual, card_holder_visual, card_expiry_visual, card_color_visual")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) return queryFailure("DATABASE_ERROR");

  const transactionQuery = options?.includeBalances === false
    ? { data: [] as Array<{ amount_minor: number; type: string; from_wallet_id: string | null; to_wallet_id: string | null }>, error: null }
    : await supabase
      .from("transactions")
      .select("amount_minor, type, from_wallet_id, to_wallet_id, correction_role, superseded_at")
      .eq("organization_id", context.organizationId)
      .eq("status", "posted")
      .is("deleted_at", null)
      .is("superseded_at", null)
      .or("correction_role.is.null,correction_role.neq.reversal");

  if (transactionQuery.error) return queryFailure("DATABASE_ERROR");
  const transactions = transactionQuery.data ?? [];
  const activeWalletIds = new Set((wallets ?? []).map((wallet) => wallet.id));

  const effectiveTransactions = transactions.filter((transaction) =>
    activeWalletIds.has(transaction.from_wallet_id ?? "") || activeWalletIds.has(transaction.to_wallet_id ?? ""),
  );

  const balances = new Map((wallets ?? []).map((wallet) => [wallet.id, BigInt(String(wallet.opening_balance_minor ?? 0))]));

  for (const transaction of effectiveTransactions) {
    const amount = BigInt(String(transaction.amount_minor));

    if (transaction.type === "income" && transaction.to_wallet_id) balances.set(transaction.to_wallet_id, (balances.get(transaction.to_wallet_id) ?? BigInt(0)) + amount);

    if (transaction.type === "expense" && transaction.from_wallet_id) balances.set(transaction.from_wallet_id, (balances.get(transaction.from_wallet_id) ?? BigInt(0)) - amount);

    if (transaction.type === "transfer") {
      if (transaction.from_wallet_id) balances.set(transaction.from_wallet_id, (balances.get(transaction.from_wallet_id) ?? BigInt(0)) - amount);

      if (transaction.to_wallet_id) balances.set(transaction.to_wallet_id, (balances.get(transaction.to_wallet_id) ?? BigInt(0)) + amount);
    }
  }

  const { data: cashCounts, error: cashCountError } = await supabase
    .from("cash_counts")
    .select("wallet_id, counted_amount_minor, difference_minor, counted_by_name, created_at")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (cashCountError) return queryFailure("DATABASE_ERROR");

  const latestCounts = new Map<string, {
    countedAmountMinor: string;
    differenceMinor: string;
    countedByName: string | null;
    createdAt: string;
  }>();

  for (const cashCount of cashCounts ?? []) {
    if (!latestCounts.has(cashCount.wallet_id)) {
      latestCounts.set(cashCount.wallet_id, {
        countedAmountMinor: String(cashCount.counted_amount_minor),
        differenceMinor: String(cashCount.difference_minor),
        countedByName: cashCount.counted_by_name,
        createdAt: cashCount.created_at,
      });
    }
  }

  return querySuccess({
    items: (wallets ?? []).map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balanceMinor: (balances.get(wallet.id) ?? BigInt(0)).toString(),
      openingBalanceMinor: String(wallet.opening_balance_minor ?? 0),
      cardNumberVisual: wallet.card_number_visual,
      cardHolderVisual: wallet.card_holder_visual,
      cardExpiryVisual: wallet.card_expiry_visual,
      cardColorVisual: wallet.card_color_visual,
      lastCountAt: latestCounts.get(wallet.id)?.createdAt ?? null,
      lastCountedAmountMinor: latestCounts.get(wallet.id)?.countedAmountMinor ?? null,
      lastCountDifferenceMinor: latestCounts.get(wallet.id)?.differenceMinor ?? null,
      lastCountedByName: latestCounts.get(wallet.id)?.countedByName ?? null,
      connected: {
        display_name: null,
        iban_last4: null,
        bic: null,
        account_holder: null,
      },
    })),
  });
}

export async function listGoalsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return queryFailure("FORBIDDEN");

  if (membership.role === "student") {
    const { data: transparencyGoalProgress, error } = await supabase.from("transparency_goal_progress").select("id, title, target_amount_minor, saved_amount_minor, deadline").order("deadline");

    if (error) return queryFailure("DATABASE_ERROR");

    return querySuccess({ items: transparencyGoalProgress ?? [] });
  }

  const { data: goals, error } = await supabase
    .from("fundraising_goals")
    .select("id, title, target_amount_minor, deadline, status")
    .eq("organization_id", context.organizationId)
    .neq("status", "archived")
    .order("deadline");

  if (error) return queryFailure("DATABASE_ERROR");
  const goalIds = (goals ?? []).map((goal) => goal.id);

  const emptyContributions: Array<{ goal_id: string; allocated_amount_minor: number }> = [];

  const { data: contributions } = goalIds.length
    ? await supabase.from("goal_contributions").select("goal_id, allocated_amount_minor").in("goal_id", goalIds)
    : { data: emptyContributions };

  const saved = new Map<string, bigint>();

  for (const contribution of contributions ?? []) saved.set(contribution.goal_id, (saved.get(contribution.goal_id) ?? BigInt(0)) + BigInt(String(contribution.allocated_amount_minor)));

  return querySuccess({
    items: (goals ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      target_amount_minor: String(goal.target_amount_minor),
      saved_amount_minor: (saved.get(goal.id) ?? BigInt(0)).toString(),
      deadline: goal.deadline,
    })),
  });
}
