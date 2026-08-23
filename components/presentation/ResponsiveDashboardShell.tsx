"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Settings,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import AbiLogo from "@/components/AbiLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import dashboardStyles from "@/app/dashboard/dashboard.module.css";
import styles from "./presentation.module.css";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((module) => module.UserButton),
  { ssr: false },
);

const navigationItems = [
  { label: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Transaktionen",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  { label: "Belege", href: "/dashboard/receipts", icon: FileText },
  { label: "Ziele", href: "/dashboard/goals", icon: Target },
  { label: "Kasse", href: "/dashboard/funds", icon: WalletCards },
  { label: "Berichte", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Personen", href: "/dashboard/people", icon: Users },
  { label: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

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

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href;
}

function TabletRail({ pathname }: { pathname: string }) {
  return (
    <aside className={styles.tabletRail} aria-label="Hauptnavigation">
      <div className={styles.tabletBrand}>
        <AbiLogo compact />
      </div>
      <nav className={styles.tabletNav}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrentRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${styles.tabletNavLink} ${active ? styles.tabletNavLinkActive : ""}`}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.tabletRailFooter}>
        <ThemeToggle />
      </div>
    </aside>
  );
}

function TabletTopbar({ pathname }: { pathname: string }) {
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  return (
    <header className={styles.tabletTopbar}>
      <div className={styles.tabletTitle}>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      <div className={styles.tabletActions}>
        <button type="button" className={styles.tabletCohort}>
          <CalendarDays aria-hidden="true" />
          Abi 2026
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Benachrichtigungen"
        >
          <Bell aria-hidden="true" />
        </button>
        <ClerkUserButton />
      </div>
    </header>
  );
}

function PhoneTopbar({ pathname }: { pathname: string }) {
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  return (
    <header className={styles.phoneTopbar}>
      <div className={styles.phoneTitle}>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      <div className={styles.phoneActions}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Benachrichtigungen"
        >
          <Bell aria-hidden="true" />
        </button>
        <ClerkUserButton />
      </div>
    </header>
  );
}

function PhoneNavigation({ pathname }: { pathname: string }) {
  const primary = navigationItems.slice(0, 3).concat(navigationItems[4]);
  const secondary = [navigationItems[3], ...navigationItems.slice(5)];
  const secondaryActive = secondary.some((item) => item.href === pathname);

  return (
    <nav className={styles.phoneNav} aria-label="Hauptnavigation">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = isCurrentRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${styles.phoneNavLink} ${active ? styles.phoneNavLinkActive : ""}`}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          className={`${styles.phoneMoreButton} ${secondaryActive ? styles.phoneNavLinkActive : ""}`}
        >
          <MoreHorizontal aria-hidden="true" />
          <span>Mehr</span>
        </SheetTrigger>
        <SheetContent side="bottom" className={styles.phoneSheet}>
          <div className={styles.phoneSheetHandle} aria-hidden="true" />
          <SheetHeader>
            <SheetTitle>Weitere Bereiche</SheetTitle>
            <SheetDescription>
              Ziele, Auswertungen und Verwaltung öffnen.
            </SheetDescription>
          </SheetHeader>
          <div className={styles.phoneSheetGrid}>
            {secondary.map((item) => {
              const Icon = item.icon;
              const active = isCurrentRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.phoneSheetLink} ${active ? styles.phoneSheetLinkActive : ""}`}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <SheetFooter className={styles.phoneSheetFooter}>
            <ThemeToggle />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dashboardStyles.shell} bg-canvas dark:bg-background`}>
      <a className={styles.skipLink} href="#dashboard-content">
        Zum Inhalt springen
      </a>
      <SidebarProvider
        className={`${dashboardStyles.frame} relative mx-auto w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm dark:border-white/10 dark:bg-card`}
        style={
          {
            "--sidebar-width": "var(--dashboard-sidebar-width)",
          } as React.CSSProperties
        }
      >
        <Sidebar />
        <SidebarInset
          id="dashboard-content"
          className={`${dashboardStyles.main} min-w-0 bg-white dark:bg-background`}
        >
          <DashboardHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function ResponsiveDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = usePresentationMode();
  const pathname = usePathname();

  if (mode === "desktop") return <DesktopShell>{children}</DesktopShell>;

  if (mode === "tablet") {
    return (
      <div className={`${styles.adaptiveShell} ${styles.tabletShell}`}>
        <a className={styles.skipLink} href="#dashboard-content">
          Zum Inhalt springen
        </a>
        <TabletRail pathname={pathname} />
        <section className={styles.tabletWorkspace}>
          <TabletTopbar pathname={pathname} />
          <main id="dashboard-content" className={styles.tabletContent}>
            {children}
          </main>
        </section>
      </div>
    );
  }

  return (
    <div className={`${styles.adaptiveShell} ${styles.phoneShell}`}>
      <a className={styles.skipLink} href="#dashboard-content">
        Zum Inhalt springen
      </a>
      <PhoneTopbar pathname={pathname} />
      <main id="dashboard-content" className={styles.phoneContent}>
        {children}
      </main>
      <PhoneNavigation pathname={pathname} />
    </div>
  );
}
