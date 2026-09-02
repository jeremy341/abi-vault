"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { deDE } from "@clerk/localizations/de-DE";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
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
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      localization={deDE}
      appearance={getClerkAppearance(dark)}
    >
      {children}
    </ClerkProvider>
  );
}
