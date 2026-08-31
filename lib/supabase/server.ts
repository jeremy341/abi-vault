import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";
import { createLocalSupabaseJwt, isLocalMode } from "@/lib/auth/local";

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createClient(url, publishableKey, {
    accessToken: async () => {
      if (isLocalMode()) return createLocalSupabaseJwt();
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
