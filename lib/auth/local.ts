import "server-only";

import { createHmac } from "node:crypto";
import { getLocalSession } from "@/lib/auth/local-class-context";
import { localAuthIdentity, localJwtIdentity } from "@/lib/auth/local-identity";

export function isLocalMode() {
  return process.env.ABI_VAULT_LOCAL_MODE === "true";
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export async function createLocalSupabaseJwt() {
  const secret = process.env.SUPABASE_JWT_SECRET ?? "super-secret-jwt-token-with-at-least-32-characters-long";
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const session = await getLocalSession();
  const identity = localJwtIdentity(localAuthIdentity(session.userId, session.organizationId));

  const payload = base64Url(JSON.stringify({
    aud: "authenticated",
    role: "authenticated",
    ...identity,
    iat: now,
    exp: now + 3600,
  }));

  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");

  return `${unsigned}.${signature}`;
}
