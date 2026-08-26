import "server-only";

const defaultBaseUrl = "https://bankaccountdata.gocardless.com";
type JsonRecord = Record<string, unknown>;

function baseUrl() {
  return process.env.GOCARDLESS_BANK_DATA_BASE_URL ?? defaultBaseUrl;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { accept: "application/json", "content-type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok) {
    const message = typeof body?.detail === "string" ? body.detail : `GoCardless request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export type GoCardlessToken = { access: string; access_expires: number; refresh: string };

export async function createGoCardlessToken() {
  const secretId = process.env.GOCARDLESS_BANK_DATA_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_BANK_DATA_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error("GoCardless credentials are not configured");
  return request<GoCardlessToken>("/api/v2/token/new/", {
    method: "POST",
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
}

export async function refreshGoCardlessToken(refresh: string) {
  return request<Omit<GoCardlessToken, "refresh">>("/api/v2/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

async function authenticatedRequest<T>(accessToken: string, path: string, init: RequestInit = {}) {
  return request<T>(path, { ...init, headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) } });
}

export type GoCardlessInstitution = {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
};

export function listGoCardlessInstitutions(accessToken: string, country = "de") {
  return authenticatedRequest<GoCardlessInstitution[]>(accessToken, `/api/v2/institutions/?country=${encodeURIComponent(country.toLowerCase())}`);
}

export function createEndUserAgreement(accessToken: string, input: { institutionId: string; maxHistoricalDays?: number; accessValidForDays?: number }) {
  return authenticatedRequest<JsonRecord>(accessToken, "/api/v2/agreements/enduser/", {
    method: "POST",
    body: JSON.stringify({
      institution_id: input.institutionId,
      max_historical_days: input.maxHistoricalDays ?? 90,
      access_valid_for_days: input.accessValidForDays ?? 90,
      access_scope: ["balances", "details", "transactions"],
    }),
  });
}

export function createRequisition(accessToken: string, input: { institutionId: string; agreementId: string; reference: string; redirect: string }) {
  return authenticatedRequest<JsonRecord>(accessToken, "/api/v2/requisitions/", {
    method: "POST",
    body: JSON.stringify({ institution_id: input.institutionId, agreement: input.agreementId, reference: input.reference, redirect: input.redirect, user_language: "de" }),
  });
}

export function getRequisition(accessToken: string, requisitionId: string) {
  return authenticatedRequest<JsonRecord>(accessToken, `/api/v2/requisitions/${encodeURIComponent(requisitionId)}/`);
}

export function getAccountDetails(accessToken: string, accountId: string) {
  return authenticatedRequest<JsonRecord>(accessToken, `/api/v2/accounts/${encodeURIComponent(accountId)}/details/`);
}

export function getAccountBalances(accessToken: string, accountId: string) {
  return authenticatedRequest<JsonRecord>(accessToken, `/api/v2/accounts/${encodeURIComponent(accountId)}/balances/`);
}

export function getAccountTransactions(accessToken: string, accountId: string, dateFrom?: string) {
  const query = dateFrom ? `?date_from=${encodeURIComponent(dateFrom)}` : "";
  return authenticatedRequest<JsonRecord>(accessToken, `/api/v2/accounts/${encodeURIComponent(accountId)}/transactions/${query}`);
}
