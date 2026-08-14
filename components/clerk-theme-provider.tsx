"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";

export default function ClerkThemeProvider({ children }: { children: ReactNode }) {
  const { dark } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: dark ? "#1d1d1f" : "#ffffff",
          colorPrimary: dark ? "#f5f5f5" : "#1d1d1f",
        },
        elements: {
          modalContent: dark ? "!bg-[#1d1d1f] !text-white" : "!bg-white !text-ink",
          userProfileRootBox: dark ? "!bg-[#1d1d1f] !text-white" : "!bg-white !text-ink",
          userProfilePage: dark ? "!bg-[#1d1d1f] !text-white" : "!bg-white !text-ink",
          userProfileNavbar: dark ? "!border-white/15 !bg-[#1d1d1f]" : "!border-black/10 !bg-white",
          userProfileSection: dark ? "!border-white/15 !text-white" : "!border-black/10 !text-ink",
          userProfileSection__profile: dark ? "!border-white/15 !text-white" : "!border-black/10 !text-ink",
          userProfileSection__emailAddresses: dark ? "!border-white/15 !text-white" : "!border-black/10 !text-ink",
          userProfileSection__phoneNumbers: dark ? "!border-white/15 !text-white" : "!border-black/10 !text-ink",
          userProfileSection__connectedAccounts: dark ? "!border-white/15 !text-white" : "!border-black/10 !text-ink",
          footer: dark ? "!border-white/25 !bg-[#1d1d1f] !text-white/75" : "!bg-white",
          footerAction: dark ? "!text-white/80" : "!text-black/55",
          footerActionText: dark ? "!text-white/80" : "!text-black/55",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}