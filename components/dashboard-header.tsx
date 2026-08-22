"use client";

import { Bell, CalendarDays, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import styles from "@/app/dashboard/dashboard.module.css";
import { useTheme } from "@/components/theme-provider";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((module) => module.UserButton),
  { ssr: false },
);

const pageInformation: Record<string, { title: string; description: string }> =
  {
    "/dashboard": {
      title: "Finanzübersicht",
      description: "Klassenfinanzen auf einen Blick.",
    },
    "/dashboard/transactions": {
      title: "Transaktionen",
      description: "Alle Einnahmen und Ausgaben im Überblick.",
    },
    "/dashboard/receipts": {
      title: "Belege",
      description: "Belege hochladen, prüfen und zuordnen.",
    },
    "/dashboard/goals": {
      title: "Ziele",
      description: "Sparziele planen und Fortschritte verfolgen.",
    },
    "/dashboard/funds": {
      title: "Kasse & Konten",
      description: "Bankkonto und Bargeldbestand verwalten.",
    },
    "/dashboard/reports": {
      title: "Berichte",
      description: "Finanzdaten transparent auswerten.",
    },
    "/dashboard/people": {
      title: "Personen",
      description: "Mitglieder und Rollen verwalten.",
    },
    "/dashboard/settings": {
      title: "Einstellungen",
      description: "Arbeitsbereich und Zugriffe konfigurieren.",
    },
  };

export default function DashboardHeader() {
  const pathname = usePathname();
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  const { dark } = useTheme();

  return (
    <header
      className={`${styles.header} flex min-h-14 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.14] px-4 md:min-h-28 md:border-b-0 md:px-8 md:pb-4 md:pt-7`}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:block">
          <h1
            className={`${styles.headerTitle} text-4xl font-semibold tracking-tight text-ink`}
          >
            {page.title}
          </h1>
          <p
            className={`${styles.headerDescription} mt-1.5 text-base text-muted-foreground`}
          >
            {page.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-5">
        <button
          type="button"
          className={`${styles.cohortButton} hidden h-14 items-center gap-3 rounded-xl border border-black/10 bg-white px-5 text-base font-medium text-ink shadow-sm transition-colors hover:bg-black/[0.03] md:inline-flex dark:border-white/10 dark:bg-card dark:hover:bg-white/[0.08]`}
          aria-label="Abiturjahrgang auswählen"
        >
          <CalendarDays className="size-5" />
          Abi 2026
          <ChevronDown className="size-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          aria-label="Benachrichtigungen"
          className="rounded-lg p-2 hover:bg-black/[0.04] md:size-11 dark:hover:bg-white/[0.08]"
        >
          <Bell className="size-6" />
        </button>

        <ClerkUserButton
          appearance={{
            variables: {
              colorBackground: dark ? "#1d1d1f" : "#ffffff",
            },
            elements: {
              avatarBox: "size-8 md:size-11",
              userButtonPopoverCard: dark
                ? "rounded-2xl !border-white/10 !bg-[#1d1d1f] !text-white shadow-xl"
                : "rounded-2xl !border-black/10 !bg-white !text-ink shadow-xl",
              userButtonPopoverMain: dark ? "!text-white" : "!text-ink",
              userPreviewMainIdentifier: dark ? "!text-white" : "!text-ink",
              userPreviewSecondaryIdentifier: dark
                ? "!text-white/60"
                : "!text-black/55",
              userButtonPopoverActionButton: dark
                ? "rounded-lg !text-white hover:!bg-white/10"
                : "rounded-lg !text-ink hover:!bg-black/5",
              userButtonPopoverActionButtonText: dark
                ? "!text-white"
                : "!text-ink",
              userButtonPopoverFooter: dark
                ? "!border-white/25 !bg-[#1d1d1f] !text-white/75"
                : "!bg-white",
              userButtonPopoverFooterAction: dark
                ? "!text-white/80"
                : "!text-black/55",
              userButtonPopoverFooterActionText: dark
                ? "!text-white/80"
                : "!text-black/55",
            },
          }}
        />
      </div>
    </header>
  );
}
