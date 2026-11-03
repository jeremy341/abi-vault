import { queryFailure, querySuccess } from "@/lib/finance/query-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { financeSnapshotSchema, type FinanceReadSnapshot } from "../schemas/finance-snapshot";

type FinanceSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function mapFinanceSnapshotWallet(wallet: FinanceReadSnapshot["wallets"][number]) {
  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    balanceMinor: wallet.balanceMinor,
    openingBalanceMinor: wallet.openingBalanceMinor,
    cardNumberVisual: wallet.cardNumberVisual,
    cardHolderVisual: wallet.cardHolderVisual,
    cardExpiryVisual: wallet.cardExpiryVisual,
    cardColorVisual: wallet.cardColorVisual,
    lastCountAt: wallet.lastCountAt,
    lastCountedAmountMinor: wallet.lastCountedAmountMinor,
    lastCountDifferenceMinor: wallet.lastCountDifferenceMinor,
    lastCountedByName: wallet.lastCountedByName,
    connected: {
      display_name: null,
      iban_last4: null,
      bic: null,
      account_holder: null,
    },
  };
}

export async function readFinanceSnapshot(supabase: FinanceSupabaseClient) {
  const { data, error } = await supabase.rpc("get_finance_read_snapshot");

  if (error) return queryFailure("DATABASE_ERROR");

  const parsed = financeSnapshotSchema.safeParse(data);

  return parsed.success
    ? querySuccess(parsed.data)
    : queryFailure("DATABASE_ERROR");
}
