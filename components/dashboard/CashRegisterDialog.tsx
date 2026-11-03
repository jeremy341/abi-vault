"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "./dialog.module.css";

type CashRegisterDialogProps = {
  mode: "add" | "edit";
  initialName?: string;
  initialHolder?: string;
  onClose: () => void;
  onSave: (values: { name: string; holder: string }, idempotencyKey: string) => Promise<boolean>;
  onArchive?: () => void;
};

export default function CashRegisterDialog({
  mode,
  initialName = "",
  initialHolder = "",
  onClose,
  onSave,
  onArchive,
}: CashRegisterDialogProps) {
  const [name, setName] = useState(initialName);
  const [holder, setHolder] = useState(initialHolder);
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef(`wallet-${crypto.randomUUID()}`);
  const adding = mode === "add";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!name.trim()) {
      setNameError("Enter a name for the cash register.");

      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const saved = await onSave({ name: name.trim(), holder: holder.trim() }, idempotencyKey.current);

      if (!saved) setSubmitError("The cash register could not be saved.");
    } catch {
      setSubmitError("The cash register could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      label={adding ? "Add cash register" : "Edit cash register"}
      onClose={onClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
    >
      <form onSubmit={submit} noValidate>
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2>{adding ? "Add cash register" : "Edit cash register"}</h2>
            <p>
              {adding
                ? "Give the cash register a name and say who looks after it."
                : "Change the name or the person who looks after it."}
            </p>
          </div>
          <button type="button" className={dlg.closeButton} onClick={onClose} disabled={saving} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={dlg.body}>
          <label className={dlg.field}>
            <span>Cash register name</span>
            <input
              name="accountName"
              autoComplete="off"
              maxLength={40}
              value={name}
              aria-invalid={Boolean(nameError)}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder="For example, drinks"
              autoFocus
            />
            <span className={dlg.fieldError} aria-live="polite">{nameError}</span>
          </label>
          <label className={dlg.field}>
            <span>Responsible person</span>
            <input
              name="holder"
              autoComplete="name"
              maxLength={40}
              value={holder}
              onChange={(event) => setHolder(event.target.value)}
              placeholder="First and last name"
            />
          </label>
          {submitError ? <p className={dlg.error} role="alert">{submitError}</p> : null}
        </div>

        <footer className={`${dlg.footer} ${onArchive ? dlg.footerSplit : ""}`}>
          {onArchive ? (
            <button type="button" className={dlg.destructiveButton} onClick={onArchive} disabled={saving}>
              Archive
            </button>
          ) : null}
          <div className={dlg.footerActions}>
            <button type="button" className={dlg.secondaryButton} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
              {saving ? "Saving" : adding ? "Add cash register" : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </Dialog>
  );
}
