"use server";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TransactionListItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  amountMinor: string;
  type: "income" | "expense" | "transfer";
  receipt: boolean;
  reviewStatus: "Geprüft" | "Zu prüfen";
  account: string;
  walletId: string | null;
  fromWalletId?: string | null;
  toWalletId?: string | null;
};

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
        reviewStatus: "Geprüft",
        account: item.wallet_label ?? "Nicht zugeordnet",
        walletId: null,
        fromWalletId: null,
        toWalletId: null,
      })),
    };
  }

  const { data: cashWallets, error: cashWalletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash");
  if (cashWalletError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const cashWalletIds = new Set((cashWallets ?? []).map((wallet) => wallet.id));
  if (!cashWalletIds.size) return { ok: true as const, items: [] };

  const { data, error } = await supabase
    .from("transactions")
    .select("id, title, type, booked_at, amount_minor, category_id, from_wallet_id, to_wallet_id")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null)
    .order("booked_at", { ascending: false });
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const cashTransactions = (data ?? []).filter((item) => cashWalletIds.has(item.from_wallet_id ?? item.to_wallet_id ?? ""));
  const categoryIds = [...new Set(cashTransactions.map((item) => item.category_id).filter(Boolean))];
  const walletIds = [...new Set(cashTransactions.flatMap((item) => [item.from_wallet_id, item.to_wallet_id]).filter(Boolean))];
  const [
    { data: categories, error: categoryError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
  ] = await Promise.all([
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    walletIds.length ? supabase.from("wallets").select("id, name").in("id", walletIds) : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    supabase.from("receipts").select("transaction_id, review_status").eq("organization_id", context.organizationId),
  ]);
  if (categoryError || walletError || receiptError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const categoryMap = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const walletMap = new Map((wallets ?? []).map((item) => [item.id, item.name]));
  const receiptMap = new Map(
    (receipts ?? [])
      .filter((item) => item.transaction_id)
      .map((item) => [item.transaction_id as string, item.review_status]),
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
      reviewStatus: receiptMap.get(item.id) === "approved" ? "Geprüft" : "Zu prüfen",
      account: walletMap.get(item.type === "income" ? item.to_wallet_id : item.from_wallet_id) ?? "Nicht zugeordnet",
      walletId: item.type === "income" ? item.to_wallet_id : item.from_wallet_id,
      fromWalletId: item.from_wallet_id,
      toWalletId: item.to_wallet_id,
    })),
  };
}

export async function listReceiptsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("id, file_name, mime_type, file_size_bytes, transaction_id, review_status, created_at")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const transactionIds = [...new Set((data ?? []).map((item) => item.transaction_id).filter(Boolean))];
  const { data: transactions } = transactionIds.length
    ? await supabase.from("transactions").select("id, title, type, booked_at, amount_minor").in("id", transactionIds)
    : { data: [] as { id: string; title: string; type: string; booked_at: string | null; amount_minor: number }[] };
  const transactionMap = new Map((transactions ?? []).map((item) => [item.id, item]));
  return {
    ok: true as const,
    items: (data ?? []).map((item) => {
      const transaction = item.transaction_id ? transactionMap.get(item.transaction_id) : undefined;
      return {
        id: item.id,
        file: item.file_name,
        type: item.mime_type === "application/pdf" ? "PDF" : item.mime_type === "image/png" ? "PNG" : "JPG",
        sizeBytes: item.file_size_bytes,
        transaction: transaction?.title ?? "Nicht zugeordnet",
        assigned: Boolean(item.transaction_id),
        date: transaction?.booked_at ?? item.created_at.slice(0, 10),
        amountMinor: transaction ? String(transaction.type === "expense" ? -transaction.amount_minor : transaction.amount_minor) : "0",
        status: item.review_status,
      };
    }),
  };
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
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const transactions = options?.includeBalances === false
    ? { data: [] as Array<{ amount_minor: number; type: string; from_wallet_id: string | null; to_wallet_id: string | null }>, error: null }
    : await supabase
      .from("transactions")
      .select("amount_minor, type, from_wallet_id, to_wallet_id")
      .eq("organization_id", context.organizationId)
      .eq("status", "posted")
      .is("deleted_at", null);
  if (transactions.error) return { ok: false as const, error: "DATABASE_ERROR" as const };
  const transactionRows = transactions.data ?? [];
  const balances = new Map((wallets ?? []).map((wallet) => [wallet.id, BigInt(String(wallet.opening_balance_minor ?? 0))]));
  for (const transaction of transactionRows) {
    const amount = BigInt(String(transaction.amount_minor));
    if (transaction.type === "income" && transaction.to_wallet_id) balances.set(transaction.to_wallet_id, (balances.get(transaction.to_wallet_id) ?? BigInt(0)) + amount);
    if (transaction.type === "expense" && transaction.from_wallet_id) balances.set(transaction.from_wallet_id, (balances.get(transaction.from_wallet_id) ?? BigInt(0)) - amount);
    if (transaction.type === "transfer") {
      if (transaction.from_wallet_id) balances.set(transaction.from_wallet_id, (balances.get(transaction.from_wallet_id) ?? BigInt(0)) - amount);
      if (transaction.to_wallet_id) balances.set(transaction.to_wallet_id, (balances.get(transaction.to_wallet_id) ?? BigInt(0)) + amount);
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
  const { data: contributions } = ids.length
    ? await supabase.from("goal_contributions").select("goal_id, allocated_amount_minor").in("goal_id", ids)
    : { data: [] as { goal_id: string; allocated_amount_minor: number }[] };
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

export async function getCommitteeSettingsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("committee_settings")
    .select("school_name, graduation_year, notifications")
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };
  return { ok: true as const, data };
}

export async function listMembersForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("committee_memberships")
    .select("clerk_user_id, role, status, profiles(display_name, email)")
    .eq("organization_id", context.organizationId)
    .order("created_at");
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };
  return {
    ok: true as const,
    items: (data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      return {
        id: item.clerk_user_id,
        name: profile?.display_name || profile?.email || "Unbekannt",
        role: item.role,
        status: item.status,
      };
    }),
  };
}

export async function getReportKpisForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const [
    { data: transactions, error: transactionError },
    { data: wallets, error: walletError },
    { data: receipts, error: receiptError },
    { data: ledgerEntries, error: ledgerError },
    { data: cashCounts, error: cashCountError },
  ] = await Promise.all([
    supabase.from("transactions").select("amount_minor, type").eq("organization_id", context.organizationId).eq("status", "posted").is("deleted_at", null),
    supabase.from("wallets").select("id").eq("organization_id", context.organizationId).eq("type", "cash").eq("status", "active"),
    supabase.from("receipts").select("review_status, transaction_id").eq("organization_id", context.organizationId),
    supabase.from("ledger_entries").select("debit_minor, credit_minor, ledger_accounts(wallet_id)").eq("organization_id", context.organizationId),
    supabase.from("cash_counts").select("wallet_id, difference_minor, created_at").eq("organization_id", context.organizationId).order("created_at", { ascending: false }),
  ]);
  if (transactionError || walletError || receiptError || ledgerError || cashCountError) {
    return { ok: false as const, error: "DATABASE_ERROR" as const };
  }
  let income = BigInt(0);
  let expenses = BigInt(0);
  for (const transaction of transactions ?? []) {
    const amount = BigInt(String(transaction.amount_minor));
    if (transaction.type === "income") income += amount;
    if (transaction.type === "expense") expenses += amount;
  }
  const pendingReceipts = (receipts ?? []).filter((receipt) => receipt.review_status === "pending").length;
  const reviewedReceiptCount = (receipts ?? []).filter((receipt) => receipt.review_status === "approved").length;
  const unassignedReceiptCount = (receipts ?? []).filter((receipt) => !receipt.transaction_id).length;
  let liquid = BigInt(0);
  for (const entry of ledgerEntries ?? []) {
    const account = Array.isArray(entry.ledger_accounts) ? entry.ledger_accounts[0] : entry.ledger_accounts;
    if (account?.wallet_id) liquid += BigInt(String(entry.debit_minor ?? 0)) - BigInt(String(entry.credit_minor ?? 0));
  }
  const activeWalletIds = new Set((wallets ?? []).map((wallet) => wallet.id));
  const latestCounts = new Map<string, { difference_minor: number }>();
  for (const count of cashCounts ?? []) {
    if (activeWalletIds.has(count.wallet_id) && !latestCounts.has(count.wallet_id)) {
      latestCounts.set(count.wallet_id, { difference_minor: count.difference_minor });
    }
  }
  const reconciliationPercent = activeWalletIds.size > 0 && latestCounts.size === activeWalletIds.size
    ? Math.round((([...latestCounts.values()].filter((count) => Number(count.difference_minor) === 0).length / activeWalletIds.size) * 100))
    : null;
  return {
    ok: true as const,
    incomeMinor: income.toString(),
    expenseMinor: expenses.toString(),
    netMinor: (income - expenses).toString(),
    liquidMinor: liquid.toString(),
    walletCount: wallets?.length ?? 0,
    reviewCount: pendingReceipts,
    reviewedReceiptCount,
    unassignedReceiptCount,
    reconciliationPercent,
  };
}

export async function getDashboardSnapshot() {
  const [wallets, transactions, goals] = await Promise.all([
    listWalletsForCurrentOrganization({ includeBalances: false }),
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
  ]);
  if (!wallets.ok || !transactions.ok || !goals.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard snapshot query failed", {
        wallets: wallets.ok ? "ok" : wallets.error,
        transactions: transactions.ok ? "ok" : transactions.error,
        goals: goals.ok ? "ok" : goals.error,
      });
    }
    return { ok: false as const };
  }
  const totals = new Map<string, number>();
  let totalExpense = 0;
  for (const transaction of transactions.items) {
    if (transaction.type !== "expense") continue;
    const amount = Math.abs(Number(transaction.amountMinor));
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + amount);
    totalExpense += amount;
  }
  const categories = [...totals.entries()].map(([name, amountMinor]) => ({
    name,
    amountMinor: String(amountMinor),
    progress: totalExpense ? Math.round((amountMinor / totalExpense) * 100) : 0,
  }));
  const balances = new Map(wallets.items.map((wallet) => [wallet.id, BigInt(wallet.openingBalanceMinor)]));
  for (const transaction of transactions.items) {
    const amount = BigInt(transaction.amountMinor);
    if (transaction.type === "income" && transaction.toWalletId) balances.set(transaction.toWalletId, (balances.get(transaction.toWalletId) ?? BigInt(0)) + amount);
    if (transaction.type === "expense" && transaction.fromWalletId) balances.set(transaction.fromWalletId, (balances.get(transaction.fromWalletId) ?? BigInt(0)) - amount);
    if (transaction.type === "transfer") {
      const transferAmount = amount < BigInt(0) ? -amount : amount;
      if (transaction.fromWalletId) balances.set(transaction.fromWalletId, (balances.get(transaction.fromWalletId) ?? BigInt(0)) - transferAmount);
      if (transaction.toWalletId) balances.set(transaction.toWalletId, (balances.get(transaction.toWalletId) ?? BigInt(0)) + transferAmount);
    }
  }
  return { ok: true as const, wallets: wallets.items.map((wallet) => ({ ...wallet, balanceMinor: (balances.get(wallet.id) ?? BigInt(0)).toString() })), transactions: transactions.items, goals: goals.items, categories };
}

export async function getReportSnapshot() {
  const [transactions, goals] = await Promise.all([
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
  ]);
  if (!transactions.ok || !goals.ok) return { ok: false as const };

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("de-DE", { month: "short" }).replace(".", "");
    return { key, label, year: date.getFullYear() };
  });
  const monthly = new Map(months.map((month) => [month.key, { income: 0, expenses: 0 }]));
  const categoryTotals = new Map<string, number>();
  for (const transaction of transactions.items) {
    const month = transaction.date ? months.find((item) => item.key === transaction.date.slice(0, 7)) : undefined;
    const amount = Math.abs(Number(transaction.amountMinor)) / 100;
    if (month && monthly.has(month.key)) {
      const row = monthly.get(month.key)!;
      if (transaction.type === "income") row.income += amount;
      if (transaction.type === "expense") row.expenses += amount;
    }
    if (transaction.type === "expense") categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) ?? 0) + amount);
  }
  const cashflow = months.map((month) => ({ month: month.label, ...(monthly.get(month.key) ?? { income: 0, expenses: 0 }) }));
  if (!transactions.items.length) {
    return {
      ok: true as const,
      cashflow: [],
      categories: [],
      goals: goals.items.map((goal) => ({
        name: goal.title,
        saved: Number(goal.saved_amount_minor) / 100,
        target: Number(goal.target_amount_minor) / 100,
      })),
      analysisBalance: [],
      analysisFlow: [],
      reviewItems: [],
    };
  }
  const totalExpenses = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const categories = [...categoryTotals.entries()].map(([name, amount]) => ({
    name,
    amount,
    share: totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0,
  }));
  let balance = 0;
  const analysisBalance = cashflow.map((month, index) => {
    balance += month.income - month.expenses;
    return { month: `${month.month} ${months[index]?.year ?? now.getFullYear()}`, balance };
  });
  return {
    ok: true as const,
    cashflow,
    categories,
    goals: goals.items.map((goal) => ({
      name: goal.title,
      saved: Number(goal.saved_amount_minor) / 100,
      target: Number(goal.target_amount_minor) / 100,
    })),
    analysisBalance,
    analysisFlow: cashflow,
    reviewItems: [],
  };
}
