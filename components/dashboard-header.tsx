"use client";

import { Bell, CalendarDays, ChevronDown } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import styles from "@/app/dashboard/dashboard.module.css";

const pageInformation: Record<string, { title: string; description: string }> = {
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

    return (
        <header className={`${styles.header} flex min-h-14 items-center justify-between border-b border-black/[0.06] px-4 md:min-h-28 md:border-b-0 md:px-8 md:pb-4 md:pt-7`}>
            <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />

                <div className="hidden md:block">
                    <h1 className={`${styles.headerTitle} text-4xl font-semibold tracking-tight text-ink`}>
                        {page.title}
                    </h1>
                    <p className={`${styles.headerDescription} mt-1.5 text-base text-muted-foreground`}>
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
                    className="rounded-lg p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                >
                    <Bell className="size-6" />
                </button>

                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "size-8 md:size-11",
                        },
                    }}
                />
            </div>
        </header>
    );
}
