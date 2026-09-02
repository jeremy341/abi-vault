"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  Bell,
  CalendarClock,
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

const subscribeToHydration = () => () => {};
const getClientHydrationState = () => true;
const getServerHydrationState = () => false;

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((module) => module.UserButton),
  { ssr: false },
);

function ShellUserButton({ localMode }: { localMode: boolean }) {
  if (localMode) {
    return (
      <span className={styles.localUserButton} aria-label="Demo-Benutzer">
        A
      </span>
    );
  }

  return <ClerkUserButton />;
}

const navigationItems = [
  {
    label: "Overview",
    shortLabel: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    shortLabel: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  {
    label: "Receipts",
    shortLabel: "Receipts",
    href: "/dashboard/receipts",
    icon: FileText,
  },
  {
    label: "Goals",
    shortLabel: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    label: "Cash registers",
    shortLabel: "Cash register",
    href: "/dashboard/funds",
    icon: WalletCards,
  },
  {
    label: "Reports",
    shortLabel: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "People",
    shortLabel: "People",
    href: "/dashboard/people",
    icon: Users,
  },
  {
    label: "Settings",
    shortLabel: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Periods",
    shortLabel: "Periods",
    href: "/dashboard/periods",
    icon: CalendarClock,
  },
];

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
      title: "Cash registers",
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

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href;
}

function TabletRail({ pathname, isAdmin }: { pathname: string; isAdmin: boolean }) {
  return (
    <aside className={`${styles.tabletRail} ${isAdmin ? "" : styles.nonAdminNavigation}`} aria-label="Hauptnavigation">
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

function TabletTopbar({ pathname, localMode }: { pathname: string; localMode: boolean }) {
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
          Class of 2026
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Notifications"
        >
          <Bell aria-hidden="true" />
        </button>
        <ShellUserButton localMode={localMode} />
      </div>
    </header>
  );
}

function PhoneTopbar({ pathname, localMode }: { pathname: string; localMode: boolean }) {
  const page = pageInformation[pathname] ?? pageInformation["/dashboard"];
  return (
    <header className={styles.phoneTopbar}>
      <div className={styles.phoneTitle}>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      <div className={styles.phoneActions}>
        <Sheet>
          <SheetTrigger
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <Bell aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="bottom" className={styles.phoneSheet}>
            <div className={styles.phoneSheetHandle} aria-hidden="true" />
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>No new notifications.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <ShellUserButton localMode={localMode} />
      </div>
    </header>
  );
}

function PhoneNavigation({ pathname, isAdmin }: { pathname: string; isAdmin: boolean }) {
  const primary = navigationItems.slice(0, 3).concat(navigationItems[4]);
  const secondary = [navigationItems[3], ...navigationItems.slice(5)];
  const secondaryActive = secondary.some((item) => item.href === pathname);

  return (
    <nav className={`${styles.phoneNav} ${isAdmin ? "" : styles.nonAdminNavigation}`} aria-label="Hauptnavigation">
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
            <SheetTitle>More areas</SheetTitle>
            <SheetDescription>
              Open goals, reports, and administration.
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
  isAdmin,
  localMode,
}: {
  children: React.ReactNode;
  pathname: string;
  isAdmin: boolean;
  localMode: boolean;
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
    <div className={`${styles.desktopShell} ${isAdmin ? "" : styles.nonAdminNavigation}`} data-presentation="desktop">
      <a className={styles.skipLink} href="#dashboard-content">
        Zum Inhalt springen
      </a>
      <aside className={styles.desktopSidebar} aria-label="Hauptnavigation">
        <div className={styles.desktopBrand}>
          <AbiLogo />
        </div>
        <nav className={styles.desktopNavigation}>
          <DesktopNavGroup
            label="Finance"
            items={navigationItems.slice(0, 6)}
            pathname={pathname}
          />
          <DesktopNavGroup
            label="Administration"
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
                Class of 2026
                <ChevronDown aria-hidden="true" />
              </button>
              {openMenu === "cohort" ? (
                <div
                  className={styles.desktopActionMenu}
                  role="menu"
                  aria-label="Select cohort"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                  >
                    <CalendarDays aria-hidden="true" />
                    <span>
                      <strong>Abi 2026</strong>
                      <small>Activeer Cohort</small>
                    </span>
                  </button>
                  <Link href="/dashboard/settings" role="menuitem">
                    <Settings aria-hidden="true" /> Cohort verwalten
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
                aria-label="Notifications"
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
                  aria-label="Notifications"
                >
                  <strong>Notifications</strong>
                  <p>No new notifications.</p>
                </div>
              ) : null}
            </div>
            <ShellUserButton localMode={localMode} />
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
  isAdmin = false,
  localMode = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  localMode?: boolean;
}) {
  const mode = usePresentationMode();
  const pathname = usePathname();
  const shellReady = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationState,
    getServerHydrationState,
  );

  if (!shellReady) {
    return (
      <div className={styles.presentationFallback} aria-hidden="true">
        <div className={styles.presentationFallbackRail}>
          <span className={styles.presentationFallbackLogo} />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className={styles.presentationFallbackWorkspace}>
          <div className={styles.presentationFallbackTopbar}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.presentationFallbackContent}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (mode === "desktop") {
    return <DesktopShell pathname={pathname} isAdmin={isAdmin} localMode={localMode}>{children}</DesktopShell>;
  }

  if (mode === "tablet") {
    return (
      <div className={`${styles.adaptiveShell} ${styles.tabletShell}`}>
        <a className={styles.skipLink} href="#dashboard-content">
          Zum Inhalt springen
        </a>
        <TabletRail pathname={pathname} isAdmin={isAdmin} />
        <section className={styles.tabletWorkspace}>
          <TabletTopbar pathname={pathname} localMode={localMode} />
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
      <PhoneTopbar pathname={pathname} localMode={localMode} />
      <main id="dashboard-content" className={styles.phoneContent}>
        {children}
      </main>
      <PhoneNavigation pathname={pathname} isAdmin={isAdmin} />
    </div>
  );
}
