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
        account: item.wallet_label ?? "Barkasse",
        walletId: null,
      })),
    };
  }

  const { data: cashWallets } = await supabase
    .from("wallets")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active");
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
  const [{ data: categories }, { data: wallets }, { data: receipts }] = await Promise.all([
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    walletIds.length ? supabase.from("wallets").select("id, name").in("id", walletIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("receipts").select("transaction_id, review_status").eq("organization_id", context.organizationId),
  ]);
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
      account: walletMap.get(item.type === "income" ? item.to_wallet_id : item.from_wallet_id) ?? "Barkasse",
      walletId: item.type === "income" ? item.to_wallet_id : item.from_wallet_id,
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
        date: transaction?.booked_at ?? item.created_at.slice(0, 10),
        amountMinor: transaction ? String(transaction.type === "expense" ? -transaction.amount_minor : transaction.amount_minor) : "0",
        status: item.review_status,
      };
    }),
  };
}

export async function listWalletsForCurrentOrganization() {
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, name, type, status, responsible_clerk_user_id, opening_balance_minor")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) return { ok: false as const, error: "DATABASE_ERROR" as const };

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount_minor, type, from_wallet_id, to_wallet_id")
    .eq("organization_id", context.organizationId)
    .eq("status", "posted")
    .is("deleted_at", null);
  const balances = new Map((wallets ?? []).map((wallet) => [wallet.id, BigInt(String(wallet.opening_balance_minor ?? 0))]));
  for (const transaction of transactions ?? []) {
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
  const [{ data: transactions, error: transactionError }, { data: wallets }, { data: receipts }, { data: ledgerEntries }] = await Promise.all([
    supabase.from("transactions").select("amount_minor, type").eq("organization_id", context.organizationId).eq("status", "posted").is("deleted_at", null),
    supabase.from("wallets").select("id").eq("organization_id", context.organizationId).eq("status", "active"),
    supabase.from("receipts").select("review_status").eq("organization_id", context.organizationId),
    supabase.from("ledger_entries").select("debit_minor, credit_minor, ledger_accounts(wallet_id)").eq("organization_id", context.organizationId),
  ]);
  if (transactionError) return { ok: false as const, error: "DATABASE_ERROR" as const };
  let income = BigInt(0);
  let expenses = BigInt(0);
  for (const transaction of transactions ?? []) {
    const amount = BigInt(String(transaction.amount_minor));
    if (transaction.type === "income") income += amount;
    if (transaction.type === "expense") expenses += amount;
  }
  const pendingReceipts = (receipts ?? []).filter((receipt) => receipt.review_status === "pending").length;
  let liquid = BigInt(0);
  for (const entry of ledgerEntries ?? []) {
    const account = Array.isArray(entry.ledger_accounts) ? entry.ledger_accounts[0] : entry.ledger_accounts;
    if (account?.wallet_id) liquid += BigInt(String(entry.debit_minor ?? 0)) - BigInt(String(entry.credit_minor ?? 0));
  }
  return {
    ok: true as const,
    incomeMinor: income.toString(),
    expenseMinor: expenses.toString(),
    netMinor: (income - expenses).toString(),
    liquidMinor: liquid.toString(),
    walletCount: wallets?.length ?? 0,
    reviewCount: pendingReceipts,
  };
}

export async function getDashboardSnapshot() {
  const [wallets, transactions, goals] = await Promise.all([
    listWalletsForCurrentOrganization(),
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
  return { ok: true as const, wallets: wallets.items, transactions: transactions.items, goals: goals.items, categories };
}

export async function getReportSnapshot() {
  const [transactions, goals] = await Promise.all([
    listTransactionsForCurrentOrganization(),
    listGoalsForCurrentOrganization(),
  ]);
  if (!transactions.ok || !goals.ok) return { ok: false as const };

  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"];
  const monthly = new Map(months.map((month) => [month, { income: 0, expenses: 0 }]));
  const categoryTotals = new Map<string, number>();
  for (const transaction of transactions.items) {
    const monthIndex = transaction.date ? Number(transaction.date.slice(5, 7)) - 1 : -1;
    const month = months[monthIndex];
    const amount = Math.abs(Number(transaction.amountMinor)) / 100;
    if (month && monthly.has(month)) {
      const row = monthly.get(month)!;
      if (transaction.type === "income") row.income += amount;
      if (transaction.type === "expense") row.expenses += amount;
    }
    if (transaction.type === "expense") categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) ?? 0) + amount);
  }
  const cashflow = months.map((month) => ({ month, ...(monthly.get(month) ?? { income: 0, expenses: 0 }) }));
  const totalExpenses = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const categories = [...categoryTotals.entries()].map(([name, amount]) => ({
    name,
    amount,
    share: totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0,
  }));
  let balance = 0;
  const analysisBalance = cashflow.map((month) => {
    balance += month.income - month.expenses;
    return { month: `${month.month} 2026`, balance };
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
