"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { Dialog } from "@/components/ui/dialog";
import {
  LoadingCollection,
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import styles from "./people.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { listMembersForCurrentOrganization } from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { inviteMember } from "@/features/people/actions/invitations";
import { createRoleInviteLink } from "@/features/people/actions/invite-links";
import {
  removeMember,
  updateMemberRole,
} from "@/features/people/actions/memberships";
import { financeScope } from "@/lib/finance/client-cache";

type PersonRole = "Administrator" | "Supervisor" | "Member";

type InviteRole = "Administrator" | "Supervisor";

type Person = {
  id: string;
  name: string;
  role: PersonRole;
  access: string;
  status: "Active" | "Invitation pending" | "Inactive";
};

const nextRoleFor: Record<
  PersonRole,
  { databaseRole: "admin" | "supervisor"; displayRole: PersonRole; access: string }
> = {
  Member: {
    databaseRole: "supervisor",
    displayRole: "Supervisor",
    access: "Manages finances",
  },
  Supervisor: {
    databaseRole: "admin",
    displayRole: "Administrator",
    access: "Full access",
  },
  Administrator: {
    databaseRole: "supervisor",
    displayRole: "Supervisor",
    access: "Manages finances",
  },
};

type RoleInviteLink = {
  role: "admin" | "supervisor";
  url: string;
  expiresAt: string;
};

type RoleLinks = Partial<Record<RoleInviteLink["role"], RoleInviteLink>>;

type RoleLinksState = {
  scope: string;
  links: RoleLinks;
};

type RoleCounts = {
  administrators: number;
  supervisors: number;
  members: number;
};

type MemberListData = Extract<Awaited<ReturnType<typeof listMembersForCurrentOrganization>>, { ok: true }>;

const emptyPeople: Person[] = [];

function roleNameFor(databaseRole: string): PersonRole {
  if (databaseRole === "admin") {
    return "Administrator";
  }

  if (databaseRole === "supervisor") {
    return "Supervisor";
  }

  return "Member";
}

function accessFor(databaseRole: string): string {
  if (databaseRole === "admin") {
    return "Full access";
  }

  if (databaseRole === "supervisor") {
    return "Manages finances";
  }

  return "Read-only";
}

function statusNameFor(databaseStatus: string): Person["status"] {
  if (databaseStatus === "active") {
    return "Active";
  }

  if (databaseStatus === "invited") {
    return "Invitation pending";
  }

  return "Inactive";
}

function peopleFromMemberList(data: MemberListData): Person[] {
  return data.items.map((member) => ({
    id: member.id,
    name: member.name,
    role: roleNameFor(member.role),
    access: accessFor(member.role),
    status: statusNameFor(member.status),
  }));
}

type MemberTableProps = {
  loading: boolean;
  people: Person[];
  filteredPeople: Person[];
  busyPersonId: string | null;
  onChangeRole: (personId: string) => void;
  onRemove: (personId: string) => void;
};

function MemberTable({
  loading,
  people,
  filteredPeople,
  busyPersonId,
  onChangeRole,
  onRemove,
}: MemberTableProps) {
  return (
    <div className={ledger.tableWrap}>
      <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="12rem" label="Loading members">
        {!loading && !filteredPeople.length ? (
          <p className={ledger.empty}>No members found.</p>
        ) : (
          <table className={ledger.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className={ledger.hideOnPhone}>Role</th>
                <th scope="col" className={ledger.hideOnPhone}>Access</th>
                <th scope="col">Status</th>
                <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((person) => (
                <tr key={person.id}>
                  <td>
                    <span className={ledger.title}>{person.name}</span>
                    <span className={ledger.phoneMeta}>{person.role}</span>
                  </td>
                  <td className={ledger.hideOnPhone}>{person.role}</td>
                  <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{person.access}</td>
                  <td className={person.status === "Active" ? ledger.muted : ledger.attention}>{person.status}</td>
                  <td className={ledger.actions}>
                    {person.status !== "Active" ? (
                      <span className={ledger.rowMeta} title="Only active members can be managed here.">
                        No actions
                      </span>
                    ) : (
                      <span className={ledger.inlineActions}>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => onChangeRole(person.id)} disabled={busyPersonId === person.id} aria-label={`Change role for ${person.name}`}>
                          Change role
                        </button>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => void onRemove(person.id)} disabled={busyPersonId === person.id} aria-label={`Remove ${person.name}`}>
                          Remove
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LoadingCollection>
    </div>
  );
}

type RolesSummaryProps = {
  counts: RoleCounts;
};

function RolesSummary({ counts }: RolesSummaryProps) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Roles</h2>
      </header>
      <dl className={`${ledger.definitions} ${styles.roles}`}>
        <div>
          <dt>Administrator ({counts.administrators})</dt>
          <dd>Full access to everything</dd>
        </div>
        <div>
          <dt>Supervisor ({counts.supervisors})</dt>
          <dd>Manages finances and reviews receipts</dd>
        </div>
        <div>
          <dt>Member ({counts.members})</dt>
          <dd>Read-only view of totals and goals</dd>
        </div>
      </dl>
    </section>
  );
}

type InviteLinksProps = {
  roleLinks: RoleLinks;
  linkSaving: RoleInviteLink["role"] | null;
  onCreateLink: (role: RoleInviteLink["role"]) => void;
  onCopyLink: (role: RoleInviteLink["role"]) => void;
};

function InviteLinks({ roleLinks, linkSaving, onCreateLink, onCopyLink }: InviteLinksProps) {
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

function InviteDialog({
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

export default function PeoplePage() {
  const { orgId, userId } = useAppAuth();

  const scope = financeScope(orgId, userId);

  const memberQuery = useFinanceQuery(
    "members",
    listMembersForCurrentOrganization,
    scope,
  );

  const [loadedPeople, setPeople] = useQueryBackedState(
    memberQuery.data?.ok ? memberQuery.data : null,
    peopleFromMemberList,
    emptyPeople,
  );

  const loading = memberQuery.loading;

  const loadError = memberQuery.failed ? "The members could not be loaded." : "";

  const people = loading || memberQuery.failed ? emptyPeople : loadedPeople;

  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [newRole, setNewRole] = useState<InviteRole>("Supervisor");

  const [inviteEmail, setInviteEmail] = useState("");

  const [messageState, setMessageState] = useState<{ scope: string; value: string } | null>(null);

  const message = messageState?.scope === scope ? messageState.value : "";

  const [busyPersonId, setBusyPersonId] = useState<string | null>(null);

  const [inviteSaving, setInviteSaving] = useState(false);

  const [linkSaving, setLinkSaving] = useState<"admin" | "supervisor" | null>(null);

  const [roleLinkState, setRoleLinkState] = useState<RoleLinksState | null>(null);

  const roleLinks = roleLinkState?.scope === scope ? roleLinkState.links : {};

  function setMessage(value: string) {
    setMessageState({ scope, value });
  }

  const searchTerm = query.trim().toLowerCase();

  const filteredPeople = people.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(searchTerm),
  );

  const counts = {
    active: people.filter((person) => person.status === "Active").length,
    administrators: people.filter((person) => person.role === "Administrator").length,
    supervisors: people.filter((person) => person.role === "Supervisor").length,
    members: people.filter((person) => person.role === "Member").length,
  };

  function openInviteModal() {
    setInviteEmail("");

    setNewRole("Supervisor");

    setMessage("");

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);

    setNewRole("Supervisor");

    setInviteEmail("");

    setMessage("");
  }

  async function changeRole(personId: string) {
    if (busyPersonId !== null) return;

    const person = people.find((item) => item.id === personId);

    if (!person) return;

    const next = nextRoleFor[person.role];

    setBusyPersonId(personId);

    try {
      const result = await updateMemberRole({
        clerkUserId: personId,
        role: next.databaseRole,
        reason: "Role changed through member management",
      });

      if (!result.ok) {
        setMessage(result.error.message);

        return;
      }
    } catch {
      setMessage("The role could not be updated.");

      return;
    } finally {
      setBusyPersonId(null);
    }

    setPeople((current) =>
      current.map((item) =>
        item.id === personId
          ? { ...item, role: next.displayRole, access: next.access }
          : item,
      ),
    );

    setMessage("Role updated.");
  }

  async function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inviteSaving) return;

    const email = inviteEmail.trim();

    if (!email) {
      setMessage("Enter an email address.");

      return;
    }

    setInviteSaving(true);

    const role = newRole === "Administrator" ? "admin" : "supervisor";

    try {
      const invitation = await inviteMember({ email, role });

      if (!invitation.ok) {
        setMessage(
          invitation.error.code === "INVALID_INPUT"
            ? "Enter a valid email address and choose a role."
            : invitation.error.message,
        );

        return;
      }

      setInviteEmail("");

      setMessage(`Invitation sent to ${email}.`);
    } catch {
      setMessage("The invitation could not be sent.");
    } finally {
      setInviteSaving(false);
    }
  }

  async function removePerson(personId: string) {
    if (busyPersonId !== null) return;

    setBusyPersonId(personId);

    try {
      const result = await removeMember({
        clerkUserId: personId,
        reason: "Member removed through member management",
      });

      if (!result.ok) {
        setMessage(
          result.error.code === "LAST_ADMIN_REQUIRED"
            ? "The last administrator cannot be removed."
            : result.error.message,
        );

        return;
      }

      setPeople((current) => current.filter((person) => person.id !== personId));

      setMessage("Person removed.");
    } catch {
      setMessage("The person could not be removed.");
    } finally {
      setBusyPersonId(null);
    }
  }

  async function createLink(role: RoleInviteLink["role"]) {
    if (linkSaving) return;

    setLinkSaving(role);

    setMessage("");

    try {
      const result = await createRoleInviteLink({ role });

      if (!result.ok) {
        setMessage(result.error.message);

        return;
      }

      setRoleLinkState((current) => {
        const previousLinks = current?.scope === scope ? current.links : {};

        return { scope, links: { ...previousLinks, [role]: result.data } };
      });

      setMessage(`${role === "admin" ? "Admin" : "Supervisor"} link created.`);
    } catch {
      setMessage("The invitation link could not be created.");
    } finally {
      setLinkSaving(null);
    }
  }

  async function copyLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];

    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.url);

      setMessage("Invitation link copied.");
    } catch {
      setMessage("The link could not be copied. Select and copy it manually.");
    }
  }

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading members" />
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Members</dt>
            <dd><LoadingText loading={loading}>{people.length}</LoadingText></dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd><LoadingText loading={loading}>{counts.active}</LoadingText></dd>
          </div>
          <div>
            <dt>Administrators</dt>
            <dd><LoadingText loading={loading}>{counts.administrators}</LoadingText></dd>
          </div>
        </dl>
        <button type="button" className={ledger.primaryButton} onClick={openInviteModal} disabled={loading}>
          Add person
        </button>
      </div>

      <div className={ledger.cols}>
        <div className={ledger.col}>
          <div className={`${ledger.toolbar} ${styles.toolbar}`}>
            <label className={ledger.searchField}>
              <span className="sr-only">Search members</span>
              <input
                id="people-search"
                value={query}
                disabled={loading}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or role"
              />
            </label>
          </div>

          <MemberTable
            loading={loading}
            people={people}
            filteredPeople={filteredPeople}
            busyPersonId={busyPersonId}
            onChangeRole={changeRole}
            onRemove={removePerson}
          />
          <p className={`${ledger.notice} ${styles.notice}`} aria-live="polite">{message}</p>
        </div>

        <div className={ledger.col}>
          <RolesSummary counts={counts} />
          <InviteLinks
            roleLinks={roleLinks}
            linkSaving={linkSaving}
            onCreateLink={createLink}
            onCopyLink={copyLink}
          />
        </div>
      </div>

      {modalOpen ? (
        <InviteDialog
          inviteEmail={inviteEmail}
          newRole={newRole}
          message={message}
          inviteSaving={inviteSaving}
          onEmailChange={setInviteEmail}
          onRoleChange={setNewRole}
          onSubmit={addPerson}
          onClose={closeModal}
        />
      ) : null}
    </section>
  );
}
