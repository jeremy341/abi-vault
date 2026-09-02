"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enGB } from "@clerk/localizations/en-GB";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
import { ClerkAuthBridge, LocalAuthProvider } from "@/components/auth/app-auth";
import { getClerkAppearance } from "@/components/clerk-appearance";

export default function ClerkThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { dark } = useTheme();

  // Demo/local mode intentionally has no external identity provider.
  // Production keeps the normal Clerk provider and authentication flow.
  if (process.env.NEXT_PUBLIC_ABI_VAULT_LOCAL_MODE === "true") {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }

  return (
    <ClerkProvider
      localization={enGB}
      appearance={getClerkAppearance(dark)}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
