"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Settings,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import AbiLogo from "@/components/AbiLogo";
import ThemeToggle from "@/components/ThemeToggle";
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
import styles from "./presentation.module.css";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((module) => module.UserButton),
  { ssr: false },
);

const navigationItems = [
  {
    label: "Übersicht",
    shortLabel: "Übersicht",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transaktionen",
    shortLabel: "Transaktionen",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  {
    label: "Belege",
    shortLabel: "Belege",
    href: "/dashboard/receipts",
    icon: FileText,
  },
  {
    label: "Ziele",
    shortLabel: "Ziele",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    label: "Kasse & Konten",
    shortLabel: "Kasse",
    href: "/dashboard/funds",
    icon: WalletCards,
  },
  {
    label: "Berichte",
    shortLabel: "Berichte",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Personen",
    shortLabel: "Personen",
    href: "/dashboard/people",
    icon: Users,
  },
  {
    label: "Einstellungen",
    shortLabel: "Einstellungen",
    href: "/dashboard/settings",
    icon: Settings,
  },
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
              <span>{item.shortLabel}</span>
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
            <span>{item.shortLabel}</span>
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

function DesktopNavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof navigationItems;
  pathname: string;
}) {
  return (
    <section className={styles.desktopNavGroup}>
      <h2>{label}</h2>
      <div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isCurrentRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${styles.desktopNavLink} ${active ? styles.desktopNavLinkActive : ""}`}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DesktopShell({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  const [openMenu, setOpenMenu] = useState<"cohort" | "notifications" | null>(
    null,
  );

  useEffect(() => {
    if (!openMenu) return;

    function closeMenu(event: KeyboardEvent | PointerEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      setOpenMenu(null);
    }

    document.addEventListener("keydown", closeMenu);
    document.addEventListener("pointerdown", closeMenu);
    return () => {
      document.removeEventListener("keydown", closeMenu);
      document.removeEventListener("pointerdown", closeMenu);
    };
  }, [openMenu]);

  return (
    <div className={styles.desktopShell} data-presentation="desktop">
      <a className={styles.skipLink} href="#dashboard-content">
        Zum Inhalt springen
      </a>
      <aside className={styles.desktopSidebar} aria-label="Hauptnavigation">
        <div className={styles.desktopBrand}>
          <AbiLogo />
        </div>
        <nav className={styles.desktopNavigation}>
          <DesktopNavGroup
            label="Finanzen"
            items={navigationItems.slice(0, 6)}
            pathname={pathname}
          />
          <DesktopNavGroup
            label="Verwaltung"
            items={navigationItems.slice(6)}
            pathname={pathname}
          />
        </nav>
        <div className={styles.desktopSidebarFooter}>
          <ThemeToggle />
        </div>
      </aside>

      <section className={styles.desktopWorkspace}>
        <header className={styles.desktopTopbar}>
          <div className={styles.desktopTitle}>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>
          <div className={styles.desktopActions}>
            <div
              className={styles.desktopActionControl}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.desktopCohort}
                aria-haspopup="menu"
                aria-expanded={openMenu === "cohort"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "cohort" ? null : "cohort",
                  )
                }
              >
                <CalendarDays aria-hidden="true" />
                Abi 2026
                <ChevronDown aria-hidden="true" />
              </button>
              {openMenu === "cohort" ? (
                <div
                  className={styles.desktopActionMenu}
                  role="menu"
                  aria-label="Jahrgang auswählen"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                  >
                    <CalendarDays aria-hidden="true" />
                    <span>
                      <strong>Abi 2026</strong>
                      <small>Aktiver Jahrgang</small>
                    </span>
                  </button>
                  <Link href="/dashboard/settings" role="menuitem">
                    <Settings aria-hidden="true" /> Jahrgang verwalten
                  </Link>
                </div>
              ) : null}
            </div>
            <div
              className={styles.desktopActionControl}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.desktopIconButton}
                aria-label="Benachrichtigungen"
                aria-haspopup="dialog"
                aria-expanded={openMenu === "notifications"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "notifications" ? null : "notifications",
                  )
                }
              >
                <Bell aria-hidden="true" />
              </button>
              {openMenu === "notifications" ? (
                <div
                  className={styles.desktopNotificationPanel}
                  role="dialog"
                  aria-label="Benachrichtigungen"
                >
                  <strong>Benachrichtigungen</strong>
                  <p>Keine neuen Hinweise.</p>
                </div>
              ) : null}
            </div>
            <ClerkUserButton />
          </div>
        </header>
        <main id="dashboard-content" className={styles.desktopContent}>
          {children}
        </main>
      </section>
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

  if (mode === "desktop") {
    return <DesktopShell pathname={pathname}>{children}</DesktopShell>;
  }

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
