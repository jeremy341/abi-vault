"use client";

import {
  Check,
  CircleUserRound,
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import styles from "./people.module.css";
import phoneStyles from "./people-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { listMembersForCurrentOrganization } from "@/features/finance/actions/queries";
import { createRoleInviteLink, revokeRoleInviteLink } from "@/features/people/actions/invite-links";
import { removeMember, updateMemberRole } from "@/features/people/actions/memberships";

type Person = {
  id: number | string;
  name: string;
  role: string;
  access: string;
  status: "Aktiv" | "Einladung offen" | "Nicht aktiv";
  initials: string;
};

type RoleInviteLink = {
  id: string;
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
  const active = people.filter((person) => person.status === "Aktiv").length;
  const admins = people.filter(
    (person) => person.role === "Administrator",
  ).length;
  const supervisors = people.filter((person) =>
    person.role === "Supervisor",
  ).length;
  const students = people.filter((person) => person.role === "Mitglied").length;

  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section className={phoneStyles.summary} aria-label="Mitgliederstatus" data-ui-slot="summary">
        <div>
          <span>Mitglieder</span>
          <strong><LoadingText loading={loading}>{people.length}</LoadingText></strong>
        </div>
        <div>
          <span>Aktiv</span>
          <strong><LoadingText loading={loading}>{active}</LoadingText></strong>
        </div>
        <div>
          <span>Administratoren</span>
          <strong><LoadingText loading={loading}>{admins}</LoadingText></strong>
        </div>
      </section>

      <div className={phoneStyles.toolbar} data-ui-slot="toolbar">
        <label className={phoneStyles.search}>
          <Search aria-hidden="true" />
          <span className="sr-only">Mitglieder suchen</span>
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
          aria-label="Person hinzufügen"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      <header className={phoneStyles.sectionHeader} data-ui-slot="list-header">
        <h2>Mitglieder</h2>
        <span>Abi 2026</span>
      </header>
      <div className={phoneStyles.people} data-ui-slot="list-body">
        <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="12rem" label="Mitglieder werden geladen…">
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
                className={`${phoneStyles.status} ${person.status === "Aktiv" ? phoneStyles.active : ""}`}
              >
                {person.status}
              </span>
            </article>
          )) : <div className={phoneStyles.empty}>Keine Mitglieder gefunden.</div>}
        </LoadingCollection>
      </div>

      <section className={phoneStyles.roles} aria-label="Rollenübersicht" data-ui-slot="secondary-panel">
        <div className={phoneStyles.role}>
          <strong>Admin</strong>
          <b><LoadingText loading={loading}>{admins}</LoadingText></b>
          <span>Vollzugriff</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Supervisor</strong>
          <b><LoadingText loading={loading}>{supervisors}</LoadingText></b>
          <span>Finanzen</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Mitglied</strong>
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
  const [linkRole, setLinkRole] = useState<RoleInviteLink["role"]>("supervisor");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [busyPersonId, setBusyPersonId] = useState<number | string | null>(null);
  const [linkSaving, setLinkSaving] = useState<"admin" | "supervisor" | null>(null);
  const [roleLinks, setRoleLinks] = useState<Partial<Record<RoleInviteLink["role"], RoleInviteLink>>>({});
  useEffect(() => {
    let active = true;
    listMembersForCurrentOrganization()
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setLoadError("Die Mitglieder konnten nicht geladen werden.");
          return;
        }
        setPeople(result.items.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role === "admin" ? "Administrator" : member.role === "supervisor" ? "Supervisor" : "Mitglied",
          access: member.role === "admin" ? "Vollzugriff" : member.role === "supervisor" ? "Finanzen verwalten" : "Transparenz",
          status: member.status === "active" ? "Aktiv" : member.status === "invited" ? "Einladung offen" : "Nicht aktiv",
          initials: member.name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
        })));
      })
      .catch(() => {
        if (active) setLoadError("Die Mitglieder konnten nicht geladen werden.");
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
    setLinkRole("supervisor");
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
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
        reason: "Rolle über die Mitgliederverwaltung geändert",
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
              : "Finanzen verwalten",
        };
      }),
    );
    setMessage("Rolle aktualisiert.");
    setOpenMenuId(null);
  }

  async function handleRemovePerson(personId: number | string) {
    if (busyPersonId !== null || typeof personId !== "string") return;
    setBusyPersonId(personId);
    try {
      const result = await removeMember({
        clerkUserId: personId,
        reason: "Mitglied über die Mitgliederverwaltung entfernt",
      });
      if (!result.ok) {
        setMessage(
          result.error === "LAST_ADMIN_REQUIRED"
            ? "Der letzte Administrator kann nicht entfernt werden."
            : "Die Person konnte nicht entfernt werden.",
        );
        setOpenMenuId(null);
        return;
      }
      setPeople((current) => current.filter((entry) => entry.id !== personId));
      setMessage("Person entfernt.");
      setOpenMenuId(null);
    } catch {
      setMessage("Die Person konnte nicht entfernt werden.");
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
        setMessage("Der Einladungslink konnte nicht erstellt werden.");
        return;
      }
      setRoleLinks((current) => ({ ...current, [role]: result }));
      setMessage(`${role === "admin" ? "Admin" : "Supervisor"}-Link erstellt.`);
    } catch {
      setMessage("Der Einladungslink konnte nicht erstellt werden.");
    } finally {
      setLinkSaving(null);
    }
  }

  async function copyRoleLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    setMessage("Einladungslink kopiert.");
  }

  async function shareRoleLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];
    if (!link) return;
    if (navigator.share) {
      await navigator.share({
        title: `${role === "admin" ? "Admin" : "Supervisor"} invite link`,
        text: "Join the Abi workspace with this role-specific link.",
        url: link.url,
      });
      return;
    }
    await copyRoleLink(role);
  }

  async function revokeRoleLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];
    if (!link || linkSaving) return;
    setLinkSaving(role);
    const result = await revokeRoleInviteLink(link.id);
    if (!result.ok) {
      setMessage("Der Einladungslink konnte nicht widerrufen werden.");
    } else {
      setRoleLinks((current) => ({ ...current, [role]: undefined }));
      setMessage("Einladungslink widerrufen.");
    }
    setLinkSaving(null);
  }

  return (
    <section className={mode === "phone" ? phoneStyles.pageShell : styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Mitglieder werden geladen…" />
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
                <span>Mitglieder</span>
                <strong><LoadingText loading={loading}>{people.length}</LoadingText></strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.greenCard}`}>
              <span className={styles.summaryIcon}>
                <Check aria-hidden="true" />
              </span>
              <div>
                <span>Aktiv</span>
                <strong><LoadingText loading={loading}>
                  {people.filter((person) => person.status === "Aktiv").length}
                </LoadingText></strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.violetCard}`}>
              <span className={styles.summaryIcon}>
                <ShieldCheck aria-hidden="true" />
              </span>
              <div>
                <span>Administratoren</span>
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
                  <h2>Mitglieder</h2>
                  <p>Personen und Rollen in eurem Arbeitsbereich.</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={openInviteModal}
                  disabled={loading}
                  data-ui-slot="primary-action"
                >
                  <Plus aria-hidden="true" />
                  Person hinzufügen
                </button>
              </header>
              <div className={styles.searchBar}>
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="people-search">
                  Mitglieder suchen
                </label>
                <input
                  id="people-search"
                  value={query}
                  disabled={loading}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nach Name oder Rolle suchen …"
                />
              </div>
              <div className={styles.peopleList} data-ui-slot="list-body">
                <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="16rem" label="Mitglieder werden geladen…">
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
                          person.status === "Aktiv"
                            ? styles.activeStatus
                            : styles.pendingStatus
                        }
                      >
                        {person.status === "Aktiv" ? (
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
                            Person entfernen
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </LoadingCollection>
              </div>
              {!loading && !filteredPeople.length ? (
                <div className={styles.emptyState}>
                  Keine Mitglieder gefunden.
                </div>
              ) : null}
            </article>

            <aside className={styles.sideColumn} data-ui-slot="secondary-panel">
              <article className={styles.rolePanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Rollen</h2>
                    <p>Übersicht der Berechtigungen.</p>
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
                      <small>Finanzen verwalten</small>
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
                      <strong>Mitglied</strong>
                      <small>Transparenz</small>
                    </span>
                    <b>
                      {
                        people.filter((person) => person.role === "Mitglied").length
                      }
                    </b>
                  </div>
                </div>
              </article>
              <article className={styles.inviteLinksPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Einladungslinks</h2>
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
                          <small>{role === "admin" ? "Vollzugriff auf Arbeitsbereich und Einstellungen." : "Finanzen verwalten und Berichte prüfen."}</small>
                          {link ? <code>{link.url}</code> : null}
                        </div>
                        <div className={styles.inviteLinkActions}>
                          {link ? (
                            <>
                              <button type="button" onClick={() => void copyRoleLink(role)} aria-label={`${role} Link kopieren`}><Copy aria-hidden="true" /> Kopieren</button>
                              <button type="button" onClick={() => void shareRoleLink(role)} aria-label={`${role} Link teilen`}><Share2 aria-hidden="true" /> Teilen</button>
                              <button type="button" onClick={() => void revokeRoleLink(role)} disabled={linkSaving !== null} aria-label={`${role} Link widerrufen`}><Trash2 aria-hidden="true" /> Widerrufen</button>
                            </>
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
                    <h2>Arbeitsbereich</h2>
                    <p>Abi 2026</p>
                  </div>
                  <CircleUserRound aria-hidden="true" />
                </header>
                <div className={styles.activityBody}>
                  <div>
                    <strong>Gemeinsam organisiert</strong>
                    <span>
                      Alle Mitglieder arbeiten im selben Finanzbereich.
                    </span>
                  </div>
                  <div className={styles.activityStat}>
                    <span>Letzte Aktivität</span>
                    <strong>Keine Aktivität verfügbar</strong>
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
          label="Create invite link"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <div>
            <header className={styles.modalHeader}>
              <div>
              <h2>Create invite link</h2>
              <p>Share a role-specific link. The recipient signs up with Clerk without sharing their email with you.</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Dialog schließen"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.formField}>
                <span>Role</span>
                <select
                  value={linkRole}
                  onChange={(event) => setLinkRole(event.target.value as RoleInviteLink["role"])}
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              {roleLinks[linkRole] ? (
                <div className={styles.formMessage} role="status">
                  <strong>Link ready</strong>
                  <code>{roleLinks[linkRole]?.url}</code>
                  <small>Expires {new Date(roleLinks[linkRole]!.expiresAt).toLocaleDateString("en-GB")}.</small>
                </div>
              ) : <p className={styles.formMessage}>Links expire automatically and cannot be used beyond their server-enforced limit.</p>}
              {message ? <p className={styles.formMessage} role="status">{message}</p> : null}
            </div>
            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeModal}
              >
                Abbrechen
              </button>
              {roleLinks[linkRole] ? <><button type="button" className={styles.secondaryButton} onClick={() => void revokeRoleLink(linkRole)} disabled={linkSaving !== null}><Trash2 aria-hidden="true" /> Revoke</button><button type="button" className={styles.primaryButton} onClick={() => void shareRoleLink(linkRole)}><Share2 aria-hidden="true" /> Share link</button></> : <button type="button" className={styles.primaryButton} onClick={() => void generateRoleLink(linkRole)} disabled={linkSaving !== null} aria-busy={linkSaving === linkRole}>{linkSaving === linkRole ? "Creating …" : "Create link"}</button>}
            </footer>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
