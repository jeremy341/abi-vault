"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { inviteMember } from "@/features/people/actions/invitations";
import { createRoleInviteLink } from "@/features/people/actions/invite-links";
import {
  removeMember,
  updateMemberRole,
} from "@/features/people/actions/memberships";

type Person = {
  id: number | string;
  name: string;
  role: string;
  access: string;
  status: "Active" | "Invitation pending" | "Inactive";
  initials: string;
};

type RoleInviteLink = {
  role: "admin" | "supervisor";
  url: string;
  expiresAt: string;
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("Supervisor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

  const [busyPersonId, setBusyPersonId] = useState<number | string | null>(
    null,
  );

  const [inviteSaving, setInviteSaving] = useState(false);

  const [linkSaving, setLinkSaving] = useState<"admin" | "supervisor" | null>(
    null,
  );

  const [roleLinks, setRoleLinks] = useState<
    Partial<Record<RoleInviteLink["role"], RoleInviteLink>>
  >({});

  useEffect(() => {
    let active = true;
    listMembersForCurrentOrganization()
      .then((memberList) => {
        if (!active) return;

        if (!memberList.ok) {
          setLoadError("The members could not be loaded.");

          return;
        }

        setPeople(
          memberList.items.map((member) => ({
            id: member.id,
            name: member.name,
            role:
              member.role === "admin"
                ? "Administrator"
                : member.role === "supervisor"
                  ? "Supervisor"
                  : "Member",
            access:
              member.role === "admin"
                ? "Full access"
                : member.role === "supervisor"
                  ? "Manages finances"
                  : "Read-only",
            status:
              member.status === "active"
                ? "Active"
                : member.status === "invited"
                  ? "Invitation pending"
                  : "Inactive",
            initials: member.name
              .split(/\s+/)
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          })),
        );
      })
      .catch(() => {
        if (active) setLoadError("The members could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        `${person.name} ${person.role}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [people, query],
  );

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

  useEffect(() => {
    if (openMenuId === null) return;

    function closeMenu(event: KeyboardEvent | PointerEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      setOpenMenuId(null);
    }

    document.addEventListener("keydown", closeMenu);
    document.addEventListener("pointerdown", closeMenu);

    return () => {
      document.removeEventListener("keydown", closeMenu);
      document.removeEventListener("pointerdown", closeMenu);
    };
  }, [openMenuId]);

  async function cycleRole(personId: number | string) {
    if (busyPersonId !== null) return;
    const selected = people.find((person) => person.id === personId);

    if (!selected) return;
    const nextRole = selected.role === "Administrator" ? "supervisor" : "admin";

    const personKey = String(personId);

    if (/^[^\s]+$/.test(personKey)) {
      setBusyPersonId(personKey);

      try {
        const result = await updateMemberRole({
          clerkUserId: personKey,
          role: nextRole,
          reason: "Role changed through member management",
        });

        if (!result.ok) {
          setMessage("The role could not be updated.");
          setOpenMenuId(null);

          return;
        }
      } catch {
        setMessage("The role could not be updated.");
        setOpenMenuId(null);
      } finally {
        setBusyPersonId(null);
      }
    }

    setPeople((current) =>
      current.map((person) => {
        if (person.id !== personId) return person;

        const role =
          person.role === "Administrator" ? "Supervisor" : "Administrator";

        return {
          ...person,
          role,
          access:
            role === "Administrator" ? "Full access" : "Manages finances",
        };
      }),
    );
    setMessage("Role updated.");
    setOpenMenuId(null);
  }

  async function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inviteSaving) return;

    if (!inviteEmail.trim()) {
      setMessage("Enter an email address.");

      return;
    }

    setInviteSaving(true);

    const role =
      newRole === "Administrator"
        ? "admin"
        : newRole === "Supervisor"
          ? "supervisor"
          : "supervisor";

    try {
      const invitation = await inviteMember({
        email: inviteEmail.trim(),
        role,
      });

      if (!invitation.ok) {
        setMessage(
          invitation.error.code === "INVALID_INPUT"
            ? "Enter a valid email address and choose a role."
            : "The invitation could not be sent.",
        );

        return;
      }

      setInviteEmail("");
      setMessage(`Invitation sent to ${inviteEmail.trim()}.`);
    } catch {
      setMessage("The invitation could not be sent.");
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleRemovePerson(personId: number | string) {
    if (busyPersonId !== null) return;
    const personKey = String(personId);
    setBusyPersonId(personKey);

    try {
      const result = await removeMember({
        clerkUserId: personKey,
        reason: "Member removed through member management",
      });

      if (!result.ok) {
        setMessage(
          result.error.code === "LAST_ADMIN_REQUIRED"
            ? "The last administrator cannot be removed."
            : "The person could not be removed.",
        );
        setOpenMenuId(null);

        return;
      }

      setPeople((current) => current.filter((person) => person.id !== personId));
      setMessage("Person removed.");
      setOpenMenuId(null);
    } catch {
      setMessage("The person could not be removed.");
      setOpenMenuId(null);
    } finally {
      setBusyPersonId(null);
    }
  }

  async function generateRoleLink(role: RoleInviteLink["role"]) {
    if (linkSaving) return;
    setLinkSaving(role);
    setMessage("");

    try {
      const result = await createRoleInviteLink({ role });

      if (!result.ok) {
        setMessage("The invitation link could not be created.");

        return;
      }

      setRoleLinks((current) => ({ ...current, [role]: result.data }));
      setMessage(`${role === "admin" ? "Admin" : "Supervisor"} link created.`);
    } catch {
      setMessage("The invitation link could not be created.");
    } finally {
      setLinkSaving(null);
    }
  }

  async function copyRoleLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];

    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    setMessage("Invitation link copied.");
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
            <dd><LoadingText loading={loading}>{people.filter((person) => person.status === "Active").length}</LoadingText></dd>
          </div>
          <div>
            <dt>Administrators</dt>
            <dd><LoadingText loading={loading}>{people.filter((person) => person.role === "Administrator").length}</LoadingText></dd>
          </div>
        </dl>
        <button type="button" className={ledger.primaryButton} onClick={openInviteModal} disabled={loading}>
          Add person
        </button>
      </div>

      <div className={ledger.cols}>
      <div className={ledger.col}>
      <div>
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
                      <span className={ledger.inlineActions}>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => cycleRole(person.id)} disabled={busyPersonId === person.id} aria-label={`Change role for ${person.name}`}>
                          Change role
                        </button>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => void handleRemovePerson(person.id)} disabled={busyPersonId === person.id} aria-label={`Remove ${person.name}`}>
                          Remove
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </LoadingCollection>
      </div>
      <p className={`${ledger.notice} ${styles.notice}`} aria-live="polite">{message}</p>
      </div>
      </div>

      <div className={ledger.col}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Roles</h2>
          </header>
          <dl className={`${ledger.definitions} ${styles.roles}`}>
            <div>
              <dt>Administrator ({people.filter((person) => person.role === "Administrator").length})</dt>
              <dd>Full access to everything</dd>
            </div>
            <div>
              <dt>Supervisor ({people.filter((person) => person.role === "Supervisor").length})</dt>
              <dd>Manages finances and reviews receipts</dd>
            </div>
            <div>
              <dt>Member ({people.filter((person) => person.role === "Member").length})</dt>
              <dd>Read-only view of totals and goals</dd>
            </div>
          </dl>
        </section>

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
                    <button type="button" className={ledger.secondaryButton} onClick={() => void copyRoleLink(role)} aria-label={`Copy ${role} link`}>
                      Copy
                    </button>
                  ) : (
                    <button type="button" className={ledger.secondaryButton} onClick={() => void generateRoleLink(role)} disabled={linkSaving !== null} aria-busy={linkSaving === role}>
                      {linkSaving === role ? "Creating" : "Create link"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      </div>

      {modalOpen ? (
        <Dialog
          label="Add person"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal}`}
        >
          <form onSubmit={addPerson}>
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
                onClick={closeModal}
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
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </label>
              <label className={styles.formField}>
                <span>Role</span>
                <select
                  name="personRole"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value)}
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
                onClick={closeModal}
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
      ) : null}
    </section>
  );
}
