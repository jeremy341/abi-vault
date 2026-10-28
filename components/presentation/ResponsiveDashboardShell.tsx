"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import AbiLogo from "@/components/AbiLogo";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  adminOnlyRoutes,
  isCurrentRoute,
  navigationRoutes,
  pageInformationFor,
} from "./navigation";
import styles from "./presentation.module.css";

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((clerkModule) => clerkModule.UserButton),
  { ssr: false },
);

type NavigationRoute = (typeof navigationRoutes)[number];

const phonePrimaryCount = 3;

const adminGroupStart = 6;

function ShellUserButton({ localMode }: { localMode: boolean }) {
  if (localMode) {
    return (
      <span className={styles.localUser} aria-label="Demo user">
        A
      </span>
    );
  }

  return <ClerkUserButton />;
}

function NavigationLink({
  route,
  pathname,
  className,
  activeClassName,
}: {
  route: NavigationRoute;
  pathname: string;
  className: string;
  activeClassName: string;
}) {
  const active = isCurrentRoute(pathname, route.href);

  return (
    <Link
      href={route.href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : ""}`}
    >
      {route.label}
    </Link>
  );
}

function useDismiss(
  open: boolean,
  setOpen: (nextOpen: boolean) => void,
  trigger: React.RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }

    function onPointer() {
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen, trigger]);
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, setOpen, trigger);

  return (
    <div
      className={`${styles.menuAnchor} ${styles.notifications}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.textButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        Notifications
      </button>
      {open ? (
        <div className={styles.menu} role="dialog" aria-label="Notifications">
          <p className={styles.menuNote}>No new notifications.</p>
        </div>
      ) : null}
    </div>
  );
}

function CohortMenu() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, setOpen, trigger);

  return (
    <div
      className={styles.menuAnchor}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.textButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        Class of 2026
        <ChevronDown aria-hidden="true" className={styles.chevron} />
      </button>
      {open ? (
        <div className={styles.menu} role="menu" aria-label="Select class">
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>
            <strong>Class of 2026</strong>
            <small>Active</small>
          </button>
          <Link href="/dashboard/settings" role="menuitem" onClick={() => setOpen(false)}>
            Manage classes
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PhoneNavigation({
  routes,
  pathname,
}: {
  routes: readonly NavigationRoute[];
  pathname: string;
}) {
  const primary = routes.slice(0, phonePrimaryCount);
  const secondary = routes.slice(phonePrimaryCount);

  const secondaryActive = secondary.some((route) =>
    isCurrentRoute(pathname, route.href),
  );

  return (
    <nav className={styles.phoneNav} aria-label="Main navigation">
      {primary.map((route) => (
        <NavigationLink
          key={route.href}
          route={route}
          pathname={pathname}
          className={styles.phoneNavLink}
          activeClassName={styles.phoneNavLinkActive}
        />
      ))}
      <Sheet>
        <SheetTrigger
          className={`${styles.phoneNavLink} ${secondaryActive ? styles.phoneNavLinkActive : ""}`}
        >
          More
        </SheetTrigger>
        <SheetContent side="bottom" className={styles.sheet} dragDismiss dragHandleClassName={styles.sheetHandle}>
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className={styles.visuallyHidden}>
              Other areas of the workspace.
            </SheetDescription>
          </SheetHeader>
          <div className={styles.sheetList}>
            {secondary.map((route) => (
              <NavigationLink
                key={route.href}
                route={route}
                pathname={pathname}
                className={styles.sheetLink}
                activeClassName={styles.sheetLinkActive}
              />
            ))}
          </div>
          <div className={styles.sheetFooter}>
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
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
  const pathname = usePathname();
  const page = pageInformationFor(pathname);

  const visibleRoutes = navigationRoutes.filter(
    (route) =>
      isAdmin || !adminOnlyRoutes.some((adminRoute) => adminRoute === route.href),
  );

  const mainRoutes = visibleRoutes.slice(0, adminGroupStart);
  const adminRoutes = visibleRoutes.slice(adminGroupStart);

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#dashboard-content">
        Skip to content
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <AbiLogo />
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {mainRoutes.map((route) => (
            <NavigationLink
              key={route.href}
              route={route}
              pathname={pathname}
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            />
          ))}
          {adminRoutes.length > 0 ? (
            <>
              <hr className={styles.navRule} />
              {adminRoutes.map((route) => (
                <NavigationLink
                  key={route.href}
                  route={route}
                  pathname={pathname}
                  className={styles.navLink}
                  activeClassName={styles.navLinkActive}
                />
              ))}
            </>
          ) : null}
        </nav>
        <div className={styles.sidebarFooter}>
          <ThemeToggle />
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <h1 className={styles.title}>{page.title}</h1>
          <div className={styles.actions}>
            <CohortMenu />
            <NotificationsMenu />
            <ShellUserButton localMode={localMode} />
          </div>
        </header>
        <main id="dashboard-content" className={styles.content}>
          {children}
        </main>
      </div>

      <PhoneNavigation routes={visibleRoutes} pathname={pathname} />
    </div>
  );
}
