"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  if (!membership) return { ok: false as const, error: "FORBIDDEN" as const };

  if (membership.role === "student") {
    const { data, error } = await supabase
      .from("transparency_transactions")
      .select("transaction_id, public_title, public_type, public_date, amount_minor, category_name, wallet_label")
      .order("public_date", { ascending: false });

    if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

    return {
      ok: true as const,
      items: (data ?? []).map((item) => ({
        id: item.transaction_id,
        title: item.public_title,
        category: item.category_name ?? "Sonstiges",
        date: item.public_date ?? "",
        amountMinor: String(item.public_type === "expense" ? -item.amount_minor : item.amount_minor),
        type: item.public_type,
        receipt: false,
        receiptId: null,
        receiptFile: null,
        receiptType: null,
        reviewStatus: "Approved",
        createdByName: null,
        createdAt: "",
        account: item.wallet_label ?? "Unassigned",
        walletId: null,
        fromWalletId: null,
        toWalletId: null,
        createdBy: null,
        canEdit: false,
        canDelete: false,
      })),
    };
  }

  const { data: cashWallets, error: cashWalletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active");

  if (cashWalletError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const cashWalletIds = new Set((cashWallets ?? []).map((wallet) => wallet.id));

  if (!cashWalletIds.size) return { ok: true as const, items: [] };

  const { data, error } = await supabase
    .from("transactions")
    .select("id, title, type, booked_at, amount_minor, category_id, from_wallet_id, to_wallet_id, created_by, created_at, correction_role, superseded_at")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null)
    .is("superseded_at", null)
    .or("correction_role.is.null,correction_role.neq.reversal")
    .order("booked_at", { ascending: false });

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const cashTransactions = (data ?? []).filter((item) =>
    cashWalletIds.has(item.from_wallet_id ?? "") || cashWalletIds.has(item.to_wallet_id ?? ""),
  );

  const categoryIds = [...new Set(cashTransactions.map((item) => item.category_id).filter(Boolean))];
  const walletIds = [...new Set(cashTransactions.flatMap((item) => [item.from_wallet_id, item.to_wallet_id]).filter(Boolean))];

  const [
    { data: categories, error: categoryError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
  ] = await Promise.all([
    // SAFETY: empty fallbacks match the selected category row shape.
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    // SAFETY: empty fallbacks match the selected wallet row shape.
    walletIds.length ? supabase.from("wallets").select("id, name").in("id", walletIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    supabase.from("receipts").select("id, file_name, mime_type, transaction_id, review_status").eq("organization_id", context.organizationId).is("archived_at", null),
  ]);

  if (categoryError || walletError || receiptError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const categoryMap = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const walletMap = new Map((wallets ?? []).map((item) => [item.id, item.name]));
  const creatorIds = [...new Set(cashTransactions.map((item) => item.created_by).filter(Boolean))];

  const emptyCreatorProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: creators, error: creatorError } = creatorIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", creatorIds)
    : { data: emptyCreatorProfiles, error: null };

  if (creatorError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const creatorMap = new Map((creators ?? []).map((item) => [item.clerk_user_id, item.display_name || item.email || "Unbekannt"]));

  const receiptMap = new Map<string, { id: string; fileName: string; type: string; status: string }>(
    (receipts ?? [])
      .filter((item): item is typeof item & { transaction_id: string } => Boolean(item.transaction_id))
      .map((item) => [item.transaction_id, { id: item.id, fileName: item.file_name, type: item.mime_type, status: item.review_status }]),
  );

  return {
    ok: true as const,
    items: cashTransactions.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category_id ? categoryMap.get(item.category_id) ?? "Sonstiges" : "Sonstiges",
      date: item.booked_at ?? "",
      amountMinor: String(item.type === "expense" ? -item.amount_minor : item.amount_minor),
      type: item.type,
      receipt: receiptMap.has(item.id),
      reviewStatus: receiptMap.get(item.id)?.status === "approved" ? "Approved" : receiptMap.get(item.id)?.status === "rejected" ? "Invalid" : "Pending review",
      createdByName: creatorMap.get(item.created_by) ?? null,
      createdAt: item.created_at,
      receiptId: receiptMap.get(item.id)?.id ?? null,
      receiptFile: receiptMap.get(item.id)?.fileName ?? null,
      receiptType: receiptMap.get(item.id)?.type ?? null,
      account: walletMap.get(item.type === "income" ? item.to_wallet_id : item.from_wallet_id) ?? "Unassigned",
      walletId: item.type === "income" ? item.to_wallet_id : item.from_wallet_id,
      fromWalletId: item.from_wallet_id,
      toWalletId: item.to_wallet_id,
      createdBy: item.created_by,
      canEdit: membership.role === "admin" || item.created_by === context.clerkUserId,
      canDelete: membership.role === "admin",
    })),
  };
}

// SAFETY: Supabase query selections establish the receipt, transaction, and profile row shapes used below.

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

  if (membershipError || !membership) return { ok: false as const, error: "FORBIDDEN" as const };

  const { data, error } = await supabase
    .from("receipts")
    .select("id, file_name, mime_type, file_size_bytes, transaction_id, review_status, created_at, uploaded_by, reviewed_by, reviewed_at")
    .eq("organization_id", context.organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const transactionIds = [...new Set((data ?? []).map((item) => item.transaction_id).filter(Boolean))];

  const emptyReceiptTransactions: Array<{ id: string; title: string; type: string; booked_at: string | null; amount_minor: number }> = [];

  const { data: transactions, error: transactionError } = transactionIds.length
    ? await supabase.from("transactions").select("id, title, type, booked_at, amount_minor").in("id", transactionIds)
    : { data: emptyReceiptTransactions };

  if (transactionError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const transactionMap = new Map((transactions ?? []).map((item) => [item.id, item]));
  const profileIds = [...new Set((data ?? []).flatMap((item) => [item.uploaded_by, item.reviewed_by]).filter(Boolean))];

  const emptyReceiptProfiles: Array<{ clerk_user_id: string; display_name: string; email: string }> = [];

  const { data: receiptProfiles, error: receiptProfileError } = profileIds.length
    ? await supabase.from("profiles").select("clerk_user_id, display_name, email").in("clerk_user_id", profileIds)
    : { data: emptyReceiptProfiles, error: null };

  if (receiptProfileError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const receiptProfileMap = new Map((receiptProfiles ?? []).map((item) => [item.clerk_user_id, item.display_name || item.email || "Unbekannt"]));

  return {
    ok: true as const,
    items: (data ?? []).map((item) => {
      const transaction = item.transaction_id ? transactionMap.get(item.transaction_id) : undefined;

      return {
        id: item.id,
        file: item.file_name,
        type: item.mime_type === "application/pdf" ? "PDF" : item.mime_type === "image/png" ? "PNG" : "JPG",
        sizeBytes: item.file_size_bytes,
        transaction: transaction?.title ?? "Unassigned",
        transactionId: item.transaction_id,
        assigned: Boolean(item.transaction_id),
        date: transaction?.booked_at ?? item.created_at.slice(0, 10),
        amountMinor: transaction ? String(transaction.type === "expense" ? -transaction.amount_minor : transaction.amount_minor) : "0",
        status: item.review_status,
        uploadedByName: receiptProfileMap.get(item.uploaded_by) ?? "Unbekannt",
        uploadedAt: item.created_at,
        reviewedByName: item.reviewed_by ? receiptProfileMap.get(item.reviewed_by) ?? "Unbekannt" : null,
        reviewedAt: item.reviewed_at,
        canEdit: membership.role === "admin" || item.uploaded_by === context.clerkUserId,
        canDelete: membership.role === "admin",
      };
    }),
  };
}

// SAFETY: Supabase query selections establish the wallet and transaction row shapes used below.

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

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  // SAFETY: the empty branch matches the selected transaction row shape.
  const transactions = options?.includeBalances === false
    ? { data: [] as Array<{ amount_minor: number; type: string; from_wallet_id: string | null; to_wallet_id: string | null }>, error: null }
    : await supabase
      .from("transactions")
      .select("amount_minor, type, from_wallet_id, to_wallet_id, correction_role, superseded_at")
      .eq("organization_id", context.organizationId)
      .eq("status", "posted")
      .is("deleted_at", null)
      .is("superseded_at", null)
      .or("correction_role.is.null,correction_role.neq.reversal");

  if (transactions.error) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const transactionRows = transactions.data ?? [];
  const activeWalletIds = new Set((wallets ?? []).map((wallet) => wallet.id));

  const effectiveTransactions = transactionRows.filter((transaction) =>
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

  if (cashCountError) return { ok: false as const, error: "DATABASE_ERROR" as const };

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

  return {
    ok: true as const,
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
  };
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

  if (!membership) return { ok: false as const, error: "FORBIDDEN" as const };

  if (membership.role === "student") {
    const { data, error } = await supabase.from("transparency_goal_progress").select("id, title, target_amount_minor, saved_amount_minor, deadline").order("deadline");

    if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

    return { ok: true as const, items: data ?? [] };
  }

  const { data: goals, error } = await supabase
    .from("fundraising_goals")
    .select("id, title, target_amount_minor, deadline, status")
    .eq("organization_id", context.organizationId)
    .neq("status", "archived")
    .order("deadline");

  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const ids = (goals ?? []).map((goal) => goal.id);

  const emptyContributions: Array<{ goal_id: string; allocated_amount_minor: number }> = [];

  const { data: contributions } = ids.length
    ? await supabase.from("goal_contributions").select("goal_id, allocated_amount_minor").in("goal_id", ids)
    : { data: emptyContributions };

  const saved = new Map<string, bigint>();

  for (const contribution of contributions ?? []) saved.set(contribution.goal_id, (saved.get(contribution.goal_id) ?? BigInt(0)) + BigInt(String(contribution.allocated_amount_minor)));

  return {
    ok: true as const,
    items: (goals ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      target_amount_minor: String(goal.target_amount_minor),
      saved_amount_minor: (saved.get(goal.id) ?? BigInt(0)).toString(),
      deadline: goal.deadline,
    })),
  };
}
