import ledger from "../ledger.module.css";
import type { RoleInviteLink, RoleLinks } from "./people-types";

type InviteLinksProps = {
  roleLinks: RoleLinks;
  linkSaving: RoleInviteLink["role"] | null;
  onCreateLink: (role: RoleInviteLink["role"]) => void;
  onCopyLink: (role: RoleInviteLink["role"]) => void;
};

export function InviteLinks({ roleLinks, linkSaving, onCreateLink, onCopyLink }: InviteLinksProps) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Invitation links</h2>
        <p>Share a link instead of an email invitation.</p>
      </header>
      <ul className={ledger.list}>
        {(["supervisor", "admin"] as const).map((role) => {
          const link = roleLinks[role];

          return (
            <li key={role} className={ledger.row} data-columns="link">
              <span className={ledger.rowTitle}>
                <span>{role === "admin" ? "Admin link" : "Supervisor link"}</span>
                <span className={ledger.rowMeta}>
                  {role === "admin" ? "Full access to the workspace and settings." : "Manage finances and review reports."}
                </span>
                {link ? <code className={ledger.code}>{link.url}</code> : null}
              </span>
              {link ? (
                <button type="button" className={ledger.secondaryButton} onClick={() => void onCopyLink(role)} aria-label={`Copy ${role} link`}>
                  Copy
                </button>
              ) : (
                <button type="button" className={ledger.secondaryButton} onClick={() => void onCreateLink(role)} disabled={linkSaving !== null} aria-busy={linkSaving === role}>
                  {linkSaving === role ? "Creating" : "Create link"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
