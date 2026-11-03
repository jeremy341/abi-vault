import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import type { InviteRole } from "./people-types";

type InviteDialogProps = {
  inviteEmail: string;
  newRole: InviteRole;
  message: string;
  inviteSaving: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (role: InviteRole) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function InviteDialog({
  inviteEmail,
  newRole,
  message,
  inviteSaving,
  onEmailChange,
  onRoleChange,
  onSubmit,
  onClose,
}: InviteDialogProps) {
  return (
    <Dialog
      label="Add person"
      onClose={onClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
    >
      <form onSubmit={onSubmit}>
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2>Invite member</h2>
            <p>The person receives an invitation by email and joins your Abi Vault workspace.</p>
          </div>
          <button
            type="button"
            className={dlg.closeButton}
            onClick={onClose}
            disabled={inviteSaving}
            aria-label="Close dialog"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={dlg.body}>
          <label className={dlg.field}>
            <span>Email address</span>
            <input
              name="inviteEmail"
              type="email"
              autoComplete="email"
              required
              value={inviteEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label className={dlg.field}>
            <span>Role</span>
            <select
              name="personRole"
              value={newRole}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "Administrator" || value === "Supervisor") {
                  onRoleChange(value);
                }
              }}
            >
              <option>Supervisor</option>
              <option>Administrator</option>
            </select>
          </label>
          {message ? (
            <p className={dlg.message} role="status">
              {message}
            </p>
          ) : null}
        </div>
        <footer className={dlg.footer}>
          <button type="button" className={dlg.secondaryButton} onClick={onClose} disabled={inviteSaving}>
            Cancel
          </button>
          <button type="submit" className={dlg.primaryButton} disabled={inviteSaving} aria-busy={inviteSaving}>
            {inviteSaving ? "Sending" : "Send invitation"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
