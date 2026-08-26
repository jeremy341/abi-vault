"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";
import { getClerkAppearance } from "@/components/clerk-appearance";

export default function ClerkThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { dark } = useTheme();

  return (
    <ClerkProvider appearance={getClerkAppearance(dark)}>
      {children}
    </ClerkProvider>
  );
}
