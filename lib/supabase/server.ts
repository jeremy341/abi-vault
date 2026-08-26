import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";
import { ensureCurrentOrganizationData } from "@/lib/auth/bootstrap";

export async function createSupabaseServerClient() {
  await ensureCurrentOrganizationData();
  const { url, publishableKey } = getSupabasePublicConfig();

  return createClient(url, publishableKey, {
    accessToken: async () => {
      const { getToken } = await auth();
      return getToken();
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
