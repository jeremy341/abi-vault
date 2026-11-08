"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { createDemoClass, renameDemoClass } from "@/lib/demo/select-class";
import styles from "./demo-class-manager.module.css";

export function DemoClassManager({ activeClassId }: { activeClassId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "rename">("create");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openDialog(nextMode: "create" | "rename") {
    setMode(nextMode);
    setName("");
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "create") await createDemoClass(name);
      else await renameDemoClass(activeClassId, name);
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
            <p>Classes in this demo are saved in this browser. Demo finance data remains sample data.</p>
            <label>
              <span>Class name</span>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Class of 2028"
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
