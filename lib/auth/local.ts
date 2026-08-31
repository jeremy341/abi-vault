import "server-only";

import { createHmac } from "node:crypto";

export const LOCAL_USER_ID = "user_local_admin";
export const LOCAL_ORGANIZATION_ID = "org_local_demo";

export function isLocalMode() {
  return process.env.ABI_VAULT_LOCAL_MODE === "true";
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export function createLocalSupabaseJwt() {
  const secret = process.env.SUPABASE_JWT_SECRET ?? "super-secret-jwt-token-with-at-least-32-characters-long";
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    aud: "authenticated",
    role: "authenticated",
    sub: LOCAL_USER_ID,
    org_id: LOCAL_ORGANIZATION_ID,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
