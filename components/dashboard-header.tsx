"use client";

import { Bell, CalendarDays, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import styles from "@/app/dashboard/dashboard.module.css";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((module) => module.UserButton),
  { ssr: false },
);

const pageInformation: Record<string, { title: string; description: string }> =
  {
    "/dashboard": {
      title: "Financial overview",
      description: "Class finances at a glance.",
    },
    "/dashboard/transactions": {
      title: "Transactions",
      description: "All income and expenses in one view.",
    },
    "/dashboard/receipts": {
      title: "Receipts",
      description: "Upload, review, and assign receipts.",
    },
    "/dashboard/goals": {
      title: "Goals",
      description: "Plan savings goals and track progress.",
    },
    "/dashboard/funds": {
      title: "Cash register & Konten",
      description: "Manage cash registers and balances.",
    },
    "/dashboard/reports": {
      title: "Reports",
      description: "Review financial data with clarity.",
    },
    "/dashboard/people": {
      title: "People",
      description: "Manage members and roles.",
    },
    "/dashboard/settings": {
      title: "Settings",
      description: "Configure workspace and access.",
    },
    "/dashboard/periods": {
      title: "Periods",
      description: "Open and safely close accounting periods.",
    },
  };

export default function DashboardHeader() {
  const pathname = usePathname();
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  return (
    <header
      className={`${styles.header} flex min-h-14 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.14] px-4 md:min-h-28 md:border-b-0 md:px-8 md:pb-4 md:pt-7`}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div className={`${styles.pageHeading} md:block`}>
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
          aria-label="Select graduation year"
        >
          <CalendarDays className="size-5" />
          Class of 2026
          <ChevronDown className="size-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 hover:bg-black/[0.04] md:size-11 dark:hover:bg-white/[0.08]"
        >
          <Bell className="size-6" />
        </button>

        <ClerkUserButton />
      </div>
    </header>
  );
}
