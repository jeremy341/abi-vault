import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/security/encryption";
import {
  getAccountBalances,
  getAccountDetails,
  getRequisition,
  refreshGoCardlessToken,
} from "@/lib/banking/gocardless";
import { importGoCardlessTransactions } from "@/lib/banking/gocardless-transactions";

function amountToMinor(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).replace(",", ".");
  const [whole = "0", decimals = ""] = normalized.replace(/^-/, "").split(".");
  const minor = BigInt(whole || "0") * BigInt(100) + BigInt((decimals + "00").slice(0, 2));
  return normalized.startsWith("-") ? -minor : minor;
}

export async function GET(request: NextRequest) {
  if (process.env.ABI_VAULT_ENABLE_BANK_RUNTIME !== "true") {
    return NextResponse.json({ error: "BANK_INTEGRATION_DISABLED" }, { status: 410 });
  }
  const state = request.nextUrl.searchParams.get("state");
  const requisitionId = request.nextUrl.searchParams.get("ref");
  if (!state || !requisitionId) return NextResponse.json({ error: "INVALID_CALLBACK" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const stateHash = createHash("sha256").update(state).digest("hex");
  const { data: authorization, error } = await admin
    .from("bank_authorization_states")
    .update({ used_at: new Date().toISOString() })
    .eq("state_hash", stateHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("organization_id, clerk_user_id, redirect_path")
    .maybeSingle();
  if (error || !authorization) return NextResponse.json({ error: "INVALID_OR_EXPIRED_STATE" }, { status: 400 });

  const { data: connection } = await admin
    .from("bank_connections")
    .select("id, refresh_token_encrypted")
    .eq("organization_id", authorization.organization_id)
    .eq("provider_connection_id", requisitionId)
    .maybeSingle();
  if (!connection?.refresh_token_encrypted) return NextResponse.json({ error: "CONNECTION_NOT_FOUND" }, { status: 400 });

  try {
    const token = await refreshGoCardlessToken(decryptSecret(connection.refresh_token_encrypted));
    const requisition = await getRequisition(token.access, requisitionId);
    const accountIds = Array.isArray(requisition.accounts)
      ? requisition.accounts.filter((value): value is string => typeof value === "string")
      : [];

    for (const accountId of accountIds) {
      const details = await getAccountDetails(token.access, accountId);
      const account = (details.account ?? details) as Record<string, unknown>;
      const iban = typeof account.iban === "string" ? account.iban : "";
      const name = typeof account.name === "string" ? account.name : "Bankkonto";
      const { data: existingAccount } = await admin
        .from("connected_accounts")
        .select("wallet_id")
        .eq("bank_connection_id", connection.id)
        .eq("provider_account_id", accountId)
        .maybeSingle();
      let walletId = existingAccount?.wallet_id ?? null;
      if (!walletId) {
        const { data: wallet } = await admin
          .from("wallets")
          .insert({
            organization_id: authorization.organization_id,
            name: name.slice(0, 120),
            type: "bank_connected",
            bank_connection_id: connection.id,
            created_by: authorization.clerk_user_id,
          })
          .select("id")
          .single();
        walletId = wallet?.id ?? null;
      }
      if (!walletId) continue;
      const { data: connectedAccount } = await admin.from("connected_accounts").upsert(
        {
          organization_id: authorization.organization_id,
          bank_connection_id: connection.id,
          wallet_id: walletId,
          provider_account_id: accountId,
          display_name: name,
          iban_last4: iban.slice(-4) || null,
          bic: typeof account.bic === "string" ? account.bic : null,
          account_holder: typeof account.ownerName === "string" ? account.ownerName : null,
          currency: "EUR",
        },
        { onConflict: "bank_connection_id,provider_account_id" },
      ).select("id").single();
      const balances = await getAccountBalances(token.access, accountId);
      const balanceRows = Array.isArray(balances.balances) ? balances.balances : [];
      const booked = balanceRows.find((row) => (row as Record<string, unknown>).balanceType === "closingBooked") as Record<string, unknown> | undefined;
      const available = balanceRows.find((row) => String((row as Record<string, unknown>).balanceType).toLowerCase().includes("available")) as Record<string, unknown> | undefined;
      const bookedAmount = amountToMinor((booked?.balanceAmount as Record<string, unknown> | undefined)?.amount);
      const availableAmount = amountToMinor((available?.balanceAmount as Record<string, unknown> | undefined)?.amount);
      if (connectedAccount && bookedAmount !== null) {
        await admin.from("balance_snapshots").insert({
          organization_id: authorization.organization_id,
          connected_account_id: connectedAccount.id,
          current_amount_minor: bookedAmount.toString(),
          available_amount_minor: availableAmount?.toString() ?? null,
          booked_amount_minor: bookedAmount.toString(),
          currency: "EUR",
          observed_at: new Date().toISOString(),
        });
      }
      await importGoCardlessTransactions({
        accessToken: token.access,
        organizationId: authorization.organization_id,
        walletId,
        accountId,
      });
    }
  } catch {
    await admin.from("bank_connections").update({ status: "failed", last_error_code: "DISCOVERY_FAILED" }).eq("id", connection.id);
    return NextResponse.json({ error: "ACCOUNT_DISCOVERY_FAILED" }, { status: 502 });
  }

  await admin.from("bank_connections").update({
    status: "active",
    last_attempted_at: new Date().toISOString(),
    last_succeeded_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return NextResponse.redirect(new URL(authorization.redirect_path, request.url));
}
