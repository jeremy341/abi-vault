"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";
import { mapFinanceSnapshotWallet, readFinanceSnapshot } from "./finance-snapshot";

export async function listWalletsForCurrentOrganization(options?: { includeBalances?: boolean }) {
  if (isDemoData()) return demoData.wallets;
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  if (options?.includeBalances !== false) {
    const snapshot = await readFinanceSnapshot(supabase);

    if (!snapshot.ok) return snapshot;

    return querySuccess({
      items: snapshot.wallets.map(mapFinanceSnapshotWallet),
    });
  }

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, name, type, status, responsible_clerk_user_id, opening_balance_minor::text, card_number_visual, card_holder_visual, card_expiry_visual, card_color_visual")
    .eq("organization_id", context.organizationId)
    .eq("type", "cash")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) return queryFailure("DATABASE_ERROR");

  return querySuccess({
    items: (wallets ?? []).map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balanceMinor: String(wallet.opening_balance_minor ?? 0),
      openingBalanceMinor: String(wallet.opening_balance_minor ?? 0),
      cardNumberVisual: wallet.card_number_visual,
      cardHolderVisual: wallet.card_holder_visual,
      cardExpiryVisual: wallet.card_expiry_visual,
      cardColorVisual: wallet.card_color_visual,
      lastCountAt: null,
      lastCountedAmountMinor: null,
      lastCountDifferenceMinor: null,
      lastCountedByName: null,
      connected: {
        display_name: null,
        iban_last4: null,
        bic: null,
        account_holder: null,
      },
    })),
  });
}
