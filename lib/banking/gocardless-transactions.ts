import "server-only";

import { createHash } from "node:crypto";
import { getAccountTransactions } from "@/lib/banking/gocardless";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeGoCardlessTransaction, type ProviderTransaction } from "@/lib/banking/normalize";

export async function importGoCardlessTransactions(input: {
  accessToken: string;
  organizationId: string;
  walletId: string;
  accountId: string;
  dateFrom?: string;
}) {
  if (process.env.ABI_VAULT_ENABLE_BANK_RUNTIME !== "true") {
    throw new Error("BANK_INTEGRATION_DISABLED");
  }
  const result = await getAccountTransactions(input.accessToken, input.accountId, input.dateFrom);
  const booked = Array.isArray((result.transactions as { booked?: ProviderTransaction[] } | undefined)?.booked)
    ? (result.transactions as { booked: ProviderTransaction[] }).booked
    : [];
  const pending = Array.isArray((result.transactions as { pending?: ProviderTransaction[] } | undefined)?.pending)
    ? (result.transactions as { pending: ProviderTransaction[] }).pending
    : [];
  const admin = createSupabaseAdminClient();
  const { data: connectedAccount } = await admin
    .from("connected_accounts")
    .select("id")
    .eq("wallet_id", input.walletId)
    .eq("provider_account_id", input.accountId)
    .maybeSingle();
  if (!connectedAccount) throw new Error("CONNECTED_ACCOUNT_NOT_FOUND");

  for (const providerTransaction of pending) {
    const transaction = normalizeGoCardlessTransaction(providerTransaction);
    if (!transaction) continue;
    await admin.from("provider_transaction_staging").upsert({
      organization_id: input.organizationId,
      connected_account_id: connectedAccount.id,
      provider: "gocardless_bank_account_data",
      external_transaction_id: transaction.externalTransactionId,
      status: "pending",
      amount_minor: transaction.amountMinor.toString(),
      title: transaction.title,
      booked_at: null,
      value_at: transaction.valueAt,
      payload: providerTransaction,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider,external_transaction_id" });
  }

  let imported = 0;
  for (const providerTransaction of booked) {
    const transaction = normalizeGoCardlessTransaction(providerTransaction);
    if (!transaction) continue;
    const payloadHash = createHash("sha256").update(JSON.stringify(providerTransaction)).digest("hex");
    await admin.from("provider_transaction_staging").upsert({
      organization_id: input.organizationId,
      connected_account_id: connectedAccount.id,
      provider: "gocardless_bank_account_data",
      external_transaction_id: transaction.externalTransactionId,
      status: "booked",
      amount_minor: transaction.amountMinor.toString(),
      title: transaction.title,
      booked_at: transaction.bookedAt,
      value_at: transaction.valueAt,
      payload: providerTransaction,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider,external_transaction_id" });
    const { error } = await admin.rpc("import_provider_transaction", {
      p_organization_id: input.organizationId,
      p_wallet_id: input.walletId,
      p_provider: "gocardless_bank_account_data",
      p_external_transaction_id: transaction.externalTransactionId,
      p_amount_minor: transaction.amountMinor.toString(),
      p_title: transaction.title,
      p_booked_at: transaction.bookedAt,
      p_value_at: transaction.valueAt,
      p_payload_hash: payloadHash,
    });
    if (error) throw error;
    await admin.from("provider_transaction_staging").update({
      transaction_id: (await admin.from("transactions").select("id").eq("organization_id", input.organizationId).eq("provider", "gocardless_bank_account_data").eq("external_transaction_id", transaction.externalTransactionId).maybeSingle()).data?.id ?? null,
    }).eq("organization_id", input.organizationId).eq("provider", "gocardless_bank_account_data").eq("external_transaction_id", transaction.externalTransactionId);
    imported += 1;
  }
  return { imported };
}
