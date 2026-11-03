import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import styles from "./people.module.css";
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
      overlayClassName={styles.overlay}
      dialogClassName={styles.modal}
    >
      <form onSubmit={onSubmit}>
        <header className={styles.modalHeader}>
          <div>
            <h2>Invite member</h2>
            <p>
              The person receives an invitation by email and joins your
              Abi Vault workspace.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={inviteSaving}
            aria-label="Close dialog"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles.modalBody}>
          <label className={styles.formField}>
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
          <label className={styles.formField}>
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
            <p className={styles.formMessage} role="status">
              {message}
            </p>
          ) : null}
        </div>
        <footer className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={inviteSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={inviteSaving}
            aria-busy={inviteSaving}
          >
            {inviteSaving ? "Sending" : "Send invitation"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
