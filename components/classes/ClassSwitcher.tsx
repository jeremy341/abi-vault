"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Check, ChevronDown, Plus } from "lucide-react";
import { useAppAuth } from "@/components/auth/app-auth";
import { Dialog } from "@/components/ui/dialog";
import {
  createLocalClass,
  listLocalClasses,
  renameLocalClass,
  selectLocalClass,
  type ClassOption,
} from "@/features/classes/actions/classes";
import styles from "@/components/presentation/presentation.module.css";

const ClerkOrganizationSwitcher = dynamic(
  () => import("@clerk/nextjs").then((module) => module.OrganizationSwitcher),
  { ssr: false },
);

type Variant = "desktop" | "tablet" | "phone";

export default function ClassSwitcher({
  localMode,
  pathname,
  variant,
}: {
  localMode: boolean;
  pathname: string;
  variant: Variant;
}) {
  const { orgId } = useAppAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [newClassName, setNewClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classesLoaded, setClassesLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localMode) return;
    let alive = true;
    listLocalClasses()
      .then((result) => { if (alive) setClasses(result); })
      .catch(() => { if (alive) setError("Classes could not be loaded. Try again later."); })
      .finally(() => { if (alive) setClassesLoaded(true); });
    return () => { alive = false; };
  }, [localMode]);

  useEffect(() => {
    if (!open) return;
    function closeFromOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeFromEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  if (!localMode) {
    return (
      <ClerkOrganizationSwitcher
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl={pathname}
        afterLeaveOrganizationUrl="/dashboard"
        hidePersonal
        organizationProfileMode="modal"
        createOrganizationMode="modal"
        appearance={{
          elements: {
            rootBox: styles.clerkSwitcherRoot,
            organizationSwitcherTrigger: variant === "desktop" ? styles.clerkSwitcherDesktopTrigger : variant === "tablet" ? styles.clerkSwitcherTabletTrigger : styles.clerkSwitcherPhoneTrigger,
          },
        }}
      />
    );
  }

  const activeClass = classes.find((item) => item.id === orgId);
  const buttonClass = variant === "desktop" ? styles.desktopCohort : variant === "tablet" ? styles.tabletCohort : styles.phoneCohort;

  async function chooseClass(classId: string) {
    if (classId === orgId) { setOpen(false); return; }
    setLoading(true);
    setError("");
    try {
      await selectLocalClass(classId);
      window.location.assign(pathname || "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Class could not be selected.");
      setLoading(false);
    }
  }

  async function submitNewClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createLocalClass(newClassName);
      window.location.assign("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Class could not be created.");
      setLoading(false);
    }
  }

  async function submitRenameClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClass) return;
    setLoading(true);
    setError("");
    try {
      await renameLocalClass(activeClass.id, newClassName);
      window.location.assign(pathname || "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Class could not be renamed.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.desktopActionControl} ref={containerRef}>
      <button
        type="button"
        className={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch class. Current class: ${activeClass?.name ?? "Loading"}`}
        onClick={() => setOpen((value) => !value)}
        disabled={loading}
      >
        <CalendarDays aria-hidden="true" />
        <span>{activeClass?.name ?? (classesLoaded ? (error ? "Classes unavailable" : "Select class") : "Loading classes…")}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.desktopActionMenu} role="menu" aria-label="Manage classes">
          <strong className={styles.classMenuHeading}>Your classes</strong>
          {!classesLoaded ? <p className={styles.classMenuInfo} role="status">Loading classes…</p> : null}
          {classesLoaded && classes.length === 0 && !error ? <p className={styles.classMenuInfo}>No classes yet.</p> : null}
          {classes.map((item) => (
            <button key={item.id} type="button" role="menuitem" onClick={() => void chooseClass(item.id)} disabled={loading}>
              {item.id === orgId ? <Check aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}
              <span><strong>{item.name}</strong>{item.id === orgId ? <small>Active class</small> : null}</span>
            </button>
          ))}
          {activeClass ? <button type="button" role="menuitem" onClick={() => { setOpen(false); setDialogMode("rename"); setNewClassName(activeClass.name); setCreateOpen(true); setError(""); }}>
            <CalendarDays aria-hidden="true" /><span><strong>Rename active class</strong></span>
          </button> : null}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setDialogMode("create"); setNewClassName(""); setCreateOpen(true); setError(""); }}>
            <Plus aria-hidden="true" /><span><strong>Create a class</strong></span>
          </button>
          {error ? <p className={styles.classMenuError} role="alert">{error}</p> : null}
        </div>
      ) : null}
      {createOpen ? (
        <Dialog
          onClose={() => { if (!loading) setCreateOpen(false); }}
          label={dialogMode === "create" ? "Create a class" : "Rename a class"}
          overlayClassName={styles.classDialogOverlay}
          dialogClassName={styles.classDialog}
        >
          <form onSubmit={(event) => void (dialogMode === "create" ? submitNewClass(event) : submitRenameClass(event))}>
            <h2>{dialogMode === "create" ? "Create a class" : "Rename a class"}</h2>
            <p>{dialogMode === "create" ? "Each class has separate finances, members, and settings." : "The new name appears anywhere this class is selected."}</p>
            <label className={styles.classNameField}>
              <span>Class name</span>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={120}
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="Class of 2027"
                disabled={loading}
              />
            </label>
            {error ? <p className={styles.classMenuError} role="alert">{error}</p> : null}
            <footer>
              <button type="button" onClick={() => setCreateOpen(false)} disabled={loading}>Cancel</button>
              <button type="submit" disabled={loading || newClassName.trim().length < 2} aria-busy={loading}>
                {loading ? (dialogMode === "create" ? "Creating…" : "Saving…") : (dialogMode === "create" ? "Create class" : "Save name")}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
