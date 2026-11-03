import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./people.module.css";
import type { InviteRole, Person } from "./people-types";

const roleOptions: { role: InviteRole; description: string }[] = [
  { role: "Administrator", description: "Full access to everything, including members and settings." },
  { role: "Supervisor", description: "Manages finances and reviews receipts." },
];

type ChangeRoleDialogProps = {
  person: Person;
  saving: boolean;
  error: string;
  onSave: (role: InviteRole) => void;
  onClose: () => void;
};

export function ChangeRoleDialog({ person, saving, error, onSave, onClose }: ChangeRoleDialogProps) {
  const [role, setRole] = useState<InviteRole>(person.role === "Administrator" ? "Administrator" : "Supervisor");
  const unchanged = role === person.role;

  return (
    <Dialog
      label="Change role"
      onClose={onClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!unchanged && !saving) onSave(role);
        }}
      >
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2>Change role</h2>
            <p>{person.name} is currently listed as {person.role}.</p>
          </div>
          <button type="button" className={dlg.closeButton} onClick={onClose} disabled={saving} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <fieldset className={`${dlg.body} ${styles.roleChoices}`} disabled={saving}>
          <legend className="sr-only">New role</legend>
          {roleOptions.map((option) => (
            <label key={option.role} className={styles.roleOption}>
              <input
                type="radio"
                name="role"
                value={option.role}
                checked={role === option.role}
                onChange={() => setRole(option.role)}
              />
              <span>
                <b>{option.role}</b>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
          {error ? <p className={dlg.error} role="alert">{error}</p> : null}
        </fieldset>
        <footer className={dlg.footer}>
          <button type="button" className={dlg.secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={dlg.primaryButton} disabled={unchanged || saving} aria-busy={saving}>
            {saving ? "Saving" : "Save role"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
