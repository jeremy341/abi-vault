"use server";

import { createHash, randomBytes } from "node:crypto";
import { requirePermission } from "@/lib/auth/permissions-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/security/encryption";
import { createEndUserAgreement, createGoCardlessToken, createRequisition } from "@/lib/banking/gocardless";
import { startBankConnectionSchema } from "@/features/banking/schemas/connections";

export type BankConnectionActionResult =
  | { ok: true; authorizationUrl: string; connectionId: string }
  | { ok: false; error: string };

function hashState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export async function startBankConnection(input: unknown): Promise<BankConnectionActionResult> {
  if (process.env.ABI_VAULT_ENABLE_BANK_RUNTIME !== "true") {
    return { ok: false, error: "BANK_INTEGRATION_DISABLED" };
  }
  const parsed = startBankConnectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const context = await requirePermission("manageWallets");
  const rawState = randomBytes(32).toString("base64url");
  const token = await createGoCardlessToken();
  const agreement = await createEndUserAgreement(token.access, { institutionId: parsed.data.institutionId });
  const requisition = await createRequisition(token.access, {
    institutionId: parsed.data.institutionId,
    agreementId: String(agreement.id),
    reference: `abi-vault-${context.organizationId}-${Date.now()}`,
    redirect: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/banking/gocardless/callback?state=${encodeURIComponent(rawState)}`,
  });

  const link = typeof requisition.link === "string" ? requisition.link : "";
  if (!link) return { ok: false, error: "PROVIDER_LINK_MISSING" };

  const admin = createSupabaseAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("bank_connections")
    .insert({
      organization_id: context.organizationId,
      provider: "gocardless_bank_account_data",
      provider_connection_id: String(requisition.id),
      institution_id: parsed.data.institutionId,
      status: "pending",
      refresh_token_encrypted: encryptSecret(token.refresh),
      token_obtained_at: new Date().toISOString(),
      access_valid_for_days: 90,
      created_by: context.clerkUserId,
    })
    .select("id")
    .single();
  if (connectionError || !connection) return { ok: false, error: "CONNECTION_CREATE_FAILED" };

  const { error: stateError } = await admin.from("bank_authorization_states").insert({
    organization_id: context.organizationId,
    clerk_user_id: context.clerkUserId,
    state_hash: hashState(rawState),
    institution_id: parsed.data.institutionId,
    redirect_path: parsed.data.redirectPath,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (stateError) {
    await admin.from("bank_connections").delete().eq("id", connection.id).eq("organization_id", context.organizationId);
    return { ok: false, error: "AUTH_STATE_CREATE_FAILED" };
  }

  return {
    ok: true,
    authorizationUrl: link,
    connectionId: connection.id,
  };
}
