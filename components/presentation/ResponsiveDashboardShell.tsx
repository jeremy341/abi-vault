"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import AbiLogo from "@/components/AbiLogo";
import { DemoClassManager } from "@/components/classes/DemoClassManager";
import { LocalClassManager } from "@/components/classes/LocalClassManager";
import { LocalPersonPanel, type LocalPeopleState } from "@/components/auth/local-user-switcher";
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
import { selectDemoClass } from "@/lib/demo/select-class";
import { selectLocalClass } from "@/features/classes/actions/classes";
import styles from "./presentation.module.css";

type DemoClassSwitch = {
  classes: readonly { id: string; name: string }[];
  activeId: string;
};

const ClerkUserButton = dynamic(
  () => import("@clerk/nextjs").then((clerkModule) => clerkModule.UserButton),
  { ssr: false },
);

type NavigationRoute = (typeof navigationRoutes)[number];

type MenuKind = "dialog" | "menu";

const phonePrimaryCount = 3;

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isAdminOnlyRoute(route: NavigationRoute) {
  return adminOnlyRoutes.some((adminRoute) => adminRoute === route.href);
}

function ShellUserButton({
  localMode,
  localPeople,
}: {
  localMode: boolean;
  localPeople?: LocalPeopleState;
}) {
  if (localPeople) {
    const current = localPeople.people.find((person) => person.id === localPeople.currentUserId);
    return (
      <TopbarMenu
        anchorClassName={styles.menuAnchor}
        label={current?.name ?? "Demo person"}
        showChevron
        kind="menu"
        popupLabel="Switch demo person"
        renderPopup={() => <LocalPersonPanel state={localPeople} />}
      />
    );
  }

  if (localMode) {
    return (
      <span className={styles.localUser} aria-label="Demo User">
        D
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
  let linkClassName = className;

  if (active) {
    linkClassName = joinClasses(className, activeClassName);
  }

  return (
    <Link
      href={route.href}
      aria-current={active ? "page" : undefined}
      className={linkClassName}
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

function TopbarMenu({
  anchorClassName,
  label,
  showChevron = false,
  kind,
  popupLabel,
  renderPopup,
}: {
  anchorClassName: string;
  label: string;
  showChevron?: boolean;
  kind: MenuKind;
  popupLabel: string;
  renderPopup: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, setOpen, trigger);

  function close() {
    setOpen(false);
  }

  function toggle() {
    setOpen((isOpen) => !isOpen);
  }

  return (
    <div
      className={anchorClassName}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.textButton}
        aria-haspopup={kind}
        aria-expanded={open}
        onClick={toggle}
      >
        {label}
        {showChevron ? (
          <ChevronDown aria-hidden="true" className={styles.chevron} />
        ) : null}
      </button>
      {open ? (
        <div className={styles.menu} role={kind} aria-label={popupLabel}>
          {renderPopup(close)}
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
  const moreClassName = joinClasses(
    styles.phoneNavLink,
    secondaryActive && styles.phoneNavLinkActive,
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
        <SheetTrigger className={moreClassName}>More</SheetTrigger>
        <SheetContent
          side="bottom"
          className={styles.sheet}
          dragDismiss
          dragHandleClassName={styles.sheetHandle}
        >
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
  demoClasses,
  localClasses,
  localPeople,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  localMode?: boolean;
  demoClasses?: DemoClassSwitch;
  localClasses?: DemoClassSwitch;
  localPeople?: LocalPeopleState;
}) {
  const classSwitch = demoClasses ?? localClasses;
  const activeClass = classSwitch?.classes.find((item) => item.id === classSwitch.activeId);
  const pathname = usePathname();
  const page = pageInformationFor(pathname);
  const visibleRoutes = navigationRoutes.filter((route) => {
    if (isAdmin) {
      return true;
    }

    return !isAdminOnlyRoute(route);
  });

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#dashboard-content">
        Skip to content
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <AbiLogo size="large" />
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {visibleRoutes.map((route) => (
            <NavigationLink
              key={route.href}
              route={route}
              pathname={pathname}
              className={styles.navLink}
              activeClassName={styles.navLinkActive}
            />
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <p className={styles.sidebarNote}>count twice, write once</p>
          <ThemeToggle />
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <AbiLogo className={styles.phoneLogo} />
          <div className={styles.pageHead}>
            <h1 className={styles.title}>{page.title}</h1>
            <p className={styles.note}>{page.description}</p>
          </div>
          <div className={styles.actions}>
            <TopbarMenu
              anchorClassName={styles.menuAnchor}
              label={activeClass?.name ?? "Class"}
              showChevron
              kind="menu"
              popupLabel="Select class"
              renderPopup={(close) => (
                <>
                  {classSwitch
                    ? classSwitch.classes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={item.id === classSwitch.activeId}
                          onClick={() => {
                            if (item.id === classSwitch.activeId) return close();

                            const select = demoClasses ? selectDemoClass(item.id) : selectLocalClass(item.id).then(() => true);
                            void select.then((saved) => {
                              if (saved) window.location.reload();
                            });
                          }}
                        >
                          {item.name}
                        </button>
                      ))
                    : null}
                  {demoClasses ? (
                    <DemoClassManager activeClassId={demoClasses.activeId} />
                  ) : localClasses ? (
                    <LocalClassManager activeClassId={localClasses.activeId} activeClassName={activeClass?.name ?? ""} />
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      role="menuitem"
                      onClick={close}
                    >
                      Manage classes
                    </Link>
                  )}
                </>
              )}
            />
            <TopbarMenu
              anchorClassName={joinClasses(
                styles.menuAnchor,
                styles.notifications,
              )}
              label="Notifications"
              kind="dialog"
              popupLabel="Notifications"
              renderPopup={() => (
                <p className={styles.menuNote}>No new notifications.</p>
              )}
            />
            <ShellUserButton localMode={localMode} localPeople={localPeople} />
          </div>
        </header>

        <main id="dashboard-content" className={styles.content}>
          <div className={styles.paper}>{children}</div>
        </main>
      </div>

      <PhoneNavigation routes={visibleRoutes} pathname={pathname} />
    </div>
  );
}
