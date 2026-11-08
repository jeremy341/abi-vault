"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { createLocalClass, renameLocalClass } from "@/features/classes/actions/classes";
import styles from "./demo-class-manager.module.css";

/** Create and rename for the Supabase-backed local demo. */
export function LocalClassManager({ activeClassId, activeClassName }: { activeClassId: string; activeClassName: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "rename">("create");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openDialog(nextMode: "create" | "rename") {
    setMode(nextMode);
    setName(nextMode === "rename" ? activeClassName : "");
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "create") await createLocalClass(name);
      else await renameLocalClass(activeClassId, name);
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The class could not be saved.");
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" role="menuitem" onClick={() => openDialog("create")}>Create a class</button>
      <button type="button" role="menuitem" onClick={() => openDialog("rename")}>Rename active class</button>
      {open ? (
        <Dialog
          onClose={() => { if (!saving) setOpen(false); }}
          label={mode === "create" ? "Create a class" : "Rename the active class"}
          overlayClassName={styles.overlay}
          dialogClassName={styles.dialog}
        >
          <form onSubmit={(event) => void submit(event)}>
            <h2>{mode === "create" ? "Create a class" : "Rename the active class"}</h2>
            <p>Each class has its own finances, members and settings.</p>
            <label>
              <span>Class name</span>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Class of 2027"
                disabled={saving}
              />
            </label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <footer>
              <button type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" disabled={saving || name.trim().length < 2} aria-busy={saving}>
                {saving ? "Saving…" : mode === "create" ? "Create class" : "Save name"}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
