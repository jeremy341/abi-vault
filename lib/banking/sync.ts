import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/security/encryption";
import { getAccountBalances, refreshGoCardlessToken } from "@/lib/banking/gocardless";
import { importGoCardlessTransactions } from "@/lib/banking/gocardless-transactions";

function amountToMinor(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).replace(",", ".");
  const [whole = "0", decimals = ""] = normalized.replace(/^-/, "").split(".");
  const minor = BigInt(whole || "0") * BigInt(100) + BigInt((decimals + "00").slice(0, 2));
  return normalized.startsWith("-") ? -minor : minor;
}

export async function syncActiveBankConnections() {
  if (process.env.ABI_VAULT_ENABLE_BANK_RUNTIME !== "true") return [];
  const admin = createSupabaseAdminClient();
  const { data: connections, error } = await admin
    .from("bank_connections")
    .select("id, organization_id, refresh_token_encrypted")
    .eq("provider", "gocardless_bank_account_data")
    .eq("status", "active");
  if (error) throw error;

  const results = [];
  for (const connection of connections ?? []) {
    const { data: run } = await admin.from("sync_runs").insert({
      organization_id: connection.organization_id,
      bank_connection_id: connection.id,
      status: "started",
    }).select("id").single();
    try {
      if (!connection.refresh_token_encrypted) throw new Error("MISSING_REFRESH_TOKEN");
      const token = await refreshGoCardlessToken(decryptSecret(connection.refresh_token_encrypted));
      const { data: accounts } = await admin
        .from("connected_accounts")
        .select("id, wallet_id, provider_account_id")
        .eq("bank_connection_id", connection.id);
      let importedCount = 0;
      for (const account of accounts ?? []) {
        const balances = await getAccountBalances(token.access, account.provider_account_id);
        const rows = Array.isArray(balances.balances) ? balances.balances : [];
        const booked = rows.find((row) => (row as Record<string, unknown>).balanceType === "closingBooked") as Record<string, unknown> | undefined;
        const available = rows.find((row) => String((row as Record<string, unknown>).balanceType).toLowerCase().includes("available")) as Record<string, unknown> | undefined;
        const bookedAmount = amountToMinor((booked?.balanceAmount as Record<string, unknown> | undefined)?.amount);
        const availableAmount = amountToMinor((available?.balanceAmount as Record<string, unknown> | undefined)?.amount);
        if (bookedAmount !== null) await admin.from("balance_snapshots").insert({
          organization_id: connection.organization_id,
          connected_account_id: account.id,
          current_amount_minor: bookedAmount.toString(),
          available_amount_minor: availableAmount?.toString() ?? null,
          booked_amount_minor: bookedAmount.toString(),
          currency: "EUR",
        });
        const imported = await importGoCardlessTransactions({
          accessToken: token.access,
          organizationId: connection.organization_id,
          walletId: account.wallet_id,
          accountId: account.provider_account_id,
        });
        importedCount += imported.imported;
      }
      await admin.from("bank_connections").update({ last_attempted_at: new Date().toISOString(), last_succeeded_at: new Date().toISOString(), last_error_code: null, last_error_message: null }).eq("id", connection.id);
      if (run) await admin.from("sync_runs").update({ status: "succeeded", imported_count: importedCount, finished_at: new Date().toISOString() }).eq("id", run.id);
      results.push({ connectionId: connection.id, imported: importedCount });
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message.slice(0, 500) : "SYNC_FAILED";
      await admin.from("bank_connections").update({ status: message.includes("TOKEN") ? "needs_reauthorization" : "failed", last_attempted_at: new Date().toISOString(), last_error_code: "SYNC_FAILED", last_error_message: message }).eq("id", connection.id);
      if (run) await admin.from("sync_runs").update({ status: "failed", error_code: "SYNC_FAILED", error_message: message, finished_at: new Date().toISOString() }).eq("id", run.id);
      results.push({ connectionId: connection.id, error: "SYNC_FAILED" });
    }
  }
  return results;
}
