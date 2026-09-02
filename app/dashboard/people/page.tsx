"use client";

import {
  Check,
  CircleUserRound,
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import styles from "./people.module.css";
import phoneStyles from "./people-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { listMembersForCurrentOrganization } from "@/features/finance/actions/queries";
import { inviteMember } from "@/features/people/actions/invitations";
import { createRoleInviteLink } from "@/features/people/actions/invite-links";
import { removeMember, updateMemberRole } from "@/features/people/actions/memberships";

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

function PhonePeopleView({
  loading,
  people,
  query,
  onQueryChange,
  onAdd,
}: {
  loading: boolean;
  people: Person[];
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
}) {
  const active = people.filter((person) => person.status === "Active").length;
  const admins = people.filter(
    (person) => person.role === "Administrator",
  ).length;
  const supervisors = people.filter((person) =>
    person.role === "Supervisor",
  ).length;
  const students = people.filter((person) => person.role === "Member").length;

  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section className={phoneStyles.summary} aria-label="Membererstatus" data-ui-slot="summary">
        <div>
          <span>Memberer</span>
          <strong><LoadingText loading={loading}>{people.length}</LoadingText></strong>
        </div>
        <div>
          <span>Active</span>
          <strong><LoadingText loading={loading}>{active}</LoadingText></strong>
        </div>
        <div>
          <span>Administrators</span>
          <strong><LoadingText loading={loading}>{admins}</LoadingText></strong>
        </div>
      </section>

      <div className={phoneStyles.toolbar} data-ui-slot="toolbar">
        <label className={phoneStyles.search}>
          <Search aria-hidden="true" />
          <span className="sr-only">Memberer suchen</span>
          <input
            value={query}
            disabled={loading}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Name oder Rolle …"
          />
        </label>
        <button
          type="button"
          className={phoneStyles.addButton}
          onClick={onAdd}
          disabled={loading}
          aria-label="Add person"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      <header className={phoneStyles.sectionHeader} data-ui-slot="list-header">
        <h2>Memberer</h2>
        <span>Abi 2026</span>
      </header>
      <div className={phoneStyles.people} data-ui-slot="list-body">
        <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="12rem" label="Memberer werden geladen…">
          {people.length ? people.map((person) => (
            <article className={phoneStyles.person} key={person.id}>
              <span className={phoneStyles.avatar}>{person.initials}</span>
              <span className={phoneStyles.identity}>
                <strong>{person.name}</strong>
                <span>
                  {person.role}, {person.access}
                </span>
              </span>
              <span
                className={`${phoneStyles.status} ${person.status === "Active" ? phoneStyles.active : ""}`}
              >
                {person.status}
              </span>
            </article>
          )) : <div className={phoneStyles.empty}>No Memberer gefunden.</div>}
        </LoadingCollection>
      </div>

      <section className={phoneStyles.roles} aria-label="Role overview" data-ui-slot="secondary-panel">
        <div className={phoneStyles.role}>
          <strong>Admin</strong>
          <b><LoadingText loading={loading}>{admins}</LoadingText></b>
          <span>Vollzugriff</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Supervisor</strong>
          <b><LoadingText loading={loading}>{supervisors}</LoadingText></b>
          <span>Finance</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Member</strong>
          <b><LoadingText loading={loading}>{students}</LoadingText></b>
          <span>Transparenz</span>
        </div>
      </section>
    </div>
  );
}

export default function PeoplePage() {
  const mode = usePresentationMode();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("Supervisor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [busyPersonId, setBusyPersonId] = useState<number | string | null>(null);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState<"admin" | "supervisor" | null>(null);
  const [roleLinks, setRoleLinks] = useState<Partial<Record<RoleInviteLink["role"], RoleInviteLink>>>({});
  useEffect(() => {
    let active = true;
    listMembersForCurrentOrganization()
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setLoadError("Die Memberer konnten nicht geladen werden.");
          return;
        }
        setPeople(result.items.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role === "admin" ? "Administrator" : member.role === "supervisor" ? "Supervisor" : "Member",
          access: member.role === "admin" ? "Vollzugriff" : member.role === "supervisor" ? "Finance verwalten" : "Transparenz",
          status: member.status === "active" ? "Active" : member.status === "invited" ? "Invitation pending" : "Inactive",
          initials: member.name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
        })));
      })
      .catch(() => {
        if (active) setLoadError("Die Memberer konnten nicht geladen werden.");
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
    if (busyPersonId !== null || typeof personId !== "string") return;
    const selected = people.find((person) => person.id === personId);
    if (!selected) return;
    const nextRole = selected.role === "Administrator" ? "supervisor" : "admin";
    if (/^[^\s]+$/.test(personId)) {
      setBusyPersonId(personId);
      try {
      const result = await updateMemberRole({
        clerkUserId: personId,
        role: nextRole,
        reason: "Role changed through member management",
      });
      if (!result.ok) {
        setMessage("Die Rolle konnte nicht aktualisiert werden.");
        setOpenMenuId(null);
        return;
      }
      } catch {
        setMessage("Die Rolle konnte nicht aktualisiert werden.");
        setOpenMenuId(null);
      } finally {
        setBusyPersonId(null);
      }
    }
    setPeople((current) =>
      current.map((person) => {
        if (person.id !== personId) return person;
        const role = person.role === "Administrator" ? "Supervisor" : "Administrator";
        return {
          ...person,
          role,
          access:
            role === "Administrator"
              ? "Vollzugriff"
              : "Finance verwalten",
        };
      }),
    );
    setMessage("Rolle aktualisiert.");
    setOpenMenuId(null);
  }

  async function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSaving) return;
    if (!inviteEmail.trim()) {
      setMessage("Please eine E-Mail-Adresse eingeben.");
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
      const invitation = await inviteMember({ email: inviteEmail.trim(), role });
      if (!invitation.ok) {
        setMessage(
          invitation.error === "INVALID_INPUT"
            ? "Please enter a valid email address and choose a role."
            : "The invitation could not be sent.",
        );
        return;
      }
      setInviteEmail("");
      setMessage(
        `Invitation sent to ${inviteEmail.trim()}.`,
      );
    } catch {
      setMessage("The invitation could not be sent.");
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleRemovePerson(personId: number | string) {
    if (busyPersonId !== null || typeof personId !== "string") return;
    setBusyPersonId(personId);
    try {
      const result = await removeMember({
        clerkUserId: personId,
        reason: "Member removed through member management",
      });
      if (!result.ok) {
        setMessage(
          result.error === "LAST_ADMIN_REQUIRED"
            ? "Der letzte Administrator kann nicht entfernt werden."
            : "The person could not be removed.",
        );
        setOpenMenuId(null);
        return;
      }
      setPeople((current) => current.filter((entry) => entry.id !== personId));
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
      setRoleLinks((current) => ({ ...current, [role]: result }));
      setMessage(`${role === "admin" ? "Admin" : "Supervisor"}-Link erstellt.`);
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
    <section className={mode === "phone" ? phoneStyles.pageShell : styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Memberer werden geladen…" />
      {loadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p> : null}
      {mode === "phone" ? (
        <PhonePeopleView
          loading={loading}
          people={filteredPeople}
          query={query}
          onQueryChange={setQuery}
          onAdd={openInviteModal}
        />
      ) : (
        <>
          <div className={styles.summaryGrid} data-ui-slot="summary">
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Users aria-hidden="true" />
              </span>
              <div>
                <span>Memberer</span>
                <strong><LoadingText loading={loading}>{people.length}</LoadingText></strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.greenCard}`}>
              <span className={styles.summaryIcon}>
                <Check aria-hidden="true" />
              </span>
              <div>
                <span>Active</span>
                <strong><LoadingText loading={loading}>
                  {people.filter((person) => person.status === "Active").length}
                </LoadingText></strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.violetCard}`}>
              <span className={styles.summaryIcon}>
                <ShieldCheck aria-hidden="true" />
              </span>
              <div>
                <span>Administrators</span>
                <strong><LoadingText loading={loading}>
                  {
                    people.filter((person) => person.role === "Administrator")
                      .length
                  }
                </LoadingText></strong>
              </div>
            </article>
          </div>

          <div className={styles.contentGrid} data-ui-slot="content">
            <article className={styles.peoplePanel} data-ui-slot="primary-panel">
              <header className={styles.panelHeader}>
                <div>
                  <h2>Memberer</h2>
                  <p>People und Rollen in eurem Workspace.</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={openInviteModal}
                  disabled={loading}
                  data-ui-slot="primary-action"
                >
                  <Plus aria-hidden="true" />
                  Add person
                </button>
              </header>
              <div className={styles.searchBar}>
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="people-search">
                  Memberer suchen
                </label>
                <input
                  id="people-search"
                  value={query}
                  disabled={loading}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or role …"
                />
              </div>
              <div className={styles.peopleList} data-ui-slot="list-body">
                <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="16rem" label="Memberer werden geladen…">
                  {filteredPeople.map((person) => (
                    <div className={styles.personRow} key={person.id}>
                      <span className={styles.avatar}>{person.initials}</span>
                      <div className={styles.personIdentity}>
                        <strong>{person.name}</strong>
                        <span>{person.role}</span>
                      </div>
                      <span className={styles.access}>{person.access}</span>
                      <span
                        className={
                          person.status === "Active"
                            ? styles.activeStatus
                            : styles.pendingStatus
                        }
                      >
                        {person.status === "Active" ? (
                          <Check aria-hidden="true" />
                        ) : null}
                        {person.status}
                      </span>
                      <button
                        type="button"
                        className={styles.moreButton}
                        aria-label={`${person.name} Optionen`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === person.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((current) =>
                            current === person.id ? null : person.id,
                          );
                        }}
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </button>
                      {openMenuId === person.id ? (
                        <div
                          className={styles.personMenu}
                          role="menu"
                          aria-label={`${person.name} verwalten`}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => cycleRole(person.id)}
                          disabled={busyPersonId === person.id}
                          >
                            Rolle wechseln
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={styles.destructiveMenuItem}
                            onClick={() => void handleRemovePerson(person.id)}
                            disabled={busyPersonId === person.id}
                          >
                            Remove person
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </LoadingCollection>
              </div>
              {!loading && !filteredPeople.length ? (
                <div className={styles.emptyState}>
                  No Memberer gefunden.
                </div>
              ) : null}
            </article>

            <aside className={styles.sideColumn} data-ui-slot="secondary-panel">
              <article className={styles.rolePanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Rollen</h2>
                    <p>Overview der Permissions.</p>
                  </div>
                  <ShieldCheck aria-hidden="true" />
                </header>
                <div className={styles.roleList}>
                  <div>
                    <span className={`${styles.roleIcon} ${styles.admin}`}>
                      <ShieldCheck aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Administrator</strong>
                      <small>Vollzugriff auf alles</small>
                    </span>
                    <b>
                      {
                        people.filter(
                          (person) => person.role === "Administrator",
                        ).length
                      }
                    </b>
                  </div>
                  <div>
                    <span className={`${styles.roleIcon} ${styles.treasurer}`}>
                      <CircleUserRound aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Supervisor</strong>
                      <small>Finance verwalten</small>
                    </span>
                    <b>
                      {
                        people.filter((person) => person.role === "Supervisor").length
                      }
                    </b>
                  </div>
                  <div>
                    <span className={styles.roleIcon}>
                      <Users aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Member</strong>
                      <small>Transparenz</small>
                    </span>
                    <b>
                      {
                        people.filter((person) => person.role === "Member").length
                      }
                    </b>
                  </div>
                </div>
              </article>
              <article className={styles.inviteLinksPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Invitation links</h2>
                    <p>Teile einen Link, ohne E-Mail-Adressen zu sammeln.</p>
                  </div>
                  <Link2 aria-hidden="true" />
                </header>
                <div className={styles.inviteLinkList}>
                  {(["supervisor", "admin"] as const).map((role) => {
                    const link = roleLinks[role];
                    return (
                      <div className={styles.inviteLinkCard} key={role}>
                        <span className={styles.inviteLinkIcon}><Link2 aria-hidden="true" /></span>
                        <div>
                          <strong>{role === "admin" ? "Admin-Link" : "Supervisor-Link"}</strong>
                          <small>{role === "admin" ? "Full access to the workspace and settings." : "Manage finances and review reports."}</small>
                          {link ? <code>{link.url}</code> : null}
                        </div>
                        <div className={styles.inviteLinkActions}>
                          {link ? (
                            <button type="button" onClick={() => void copyRoleLink(role)} aria-label={`${role} Link kopieren`}><Copy aria-hidden="true" /> Kopieren</button>
                          ) : (
                            <button type="button" onClick={() => void generateRoleLink(role)} disabled={linkSaving !== null} aria-busy={linkSaving === role}>
                              {linkSaving === role ? "Erstelle …" : "Link erstellen"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
              <article className={styles.activityPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Workspace</h2>
                    <p>Abi 2026</p>
                  </div>
                  <CircleUserRound aria-hidden="true" />
                </header>
                <div className={styles.activityBody}>
                  <div>
                    <strong>Gemeinsam organisiert</strong>
                    <span>
                      All Memberer arbeiten im selben Finanzbereich.
                    </span>
                  </div>
                  <div className={styles.activityStat}>
                    <span>Recent activity</span>
                    <strong>No activity available</strong>
                  </div>
                  <p aria-live="polite">{message || "\u00a0"}</p>
                </div>
              </article>
            </aside>
          </div>
        </>
      )}

      {modalOpen ? (
        <Dialog
          label="Add person"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <form onSubmit={addPerson}>
            <header className={styles.modalHeader}>
              <div>
              <h2>Member einladen</h2>
              <p>The person will receive a secure invitation by email and be added to your Abi workspace.</p>
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
                <span>E-Mail-Adresse</span>
                <input
                  name="inviteEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@beispiel.de"
                />
              </label>
              <label className={styles.formField}>
                <span>Rolle</span>
                <select
                  name="personRole"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value)}
                >
                  <option>Supervisor</option>
                  <option>Administrator</option>
                </select>
              </label>
              {message ? <p className={styles.formMessage} role="status">{message}</p> : null}
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
              <button type="submit" className={styles.primaryButton} disabled={inviteSaving} aria-busy={inviteSaving}>
                {inviteSaving ? "Sending …" : "Send invitation"}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </section>
  );
}
