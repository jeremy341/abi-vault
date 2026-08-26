"use client";

import {
  Check,
  CircleUserRound,
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
import { createRoleInviteLink } from "@/features/people/actions/invite-links";
import { removeMember, updateMemberRole } from "@/features/people/actions/memberships";

type Person = {
  id: number | string;
  name: string;
  role: string;
  access: string;
  status: "Aktiv" | "Einladung offen" | "Nicht aktiv";
  initials: string;
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
          <strong>Rollen</strong>
          <b><LoadingText loading={loading}>{admins + supervisors}</LoadingText></b>
          <span>Admin und Supervisor</span>
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
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [busyPersonId, setBusyPersonId] = useState<number | string | null>(null);
  const [inviteSaving, setInviteSaving] = useState(false);
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
          role: member.role === "admin" ? "Administrator" : "Supervisor",
          access: member.role === "admin" ? "Vollzugriff" : "Finanzen verwalten",
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

  function closeModal() {
    setModalOpen(false);
    setNewRole("Supervisor");
    setInviteLink("");
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

  async function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSaving) return;
    setInviteSaving(true);
    const role =
      newRole === "Administrator"
        ? "admin"
        : newRole === "Supervisor"
          ? "supervisor"
        : "supervisor";
    try {
      const invitation = await createRoleInviteLink({ role });
      if (!invitation.ok) {
        setMessage(
          invitation.error === "INVALID_INPUT"
            ? "Bitte eine gültige Rolle auswählen."
            : "Der Einladungslink konnte nicht erstellt werden.",
        );
        return;
      }
      setInviteLink(invitation.url);
      setMessage(
        newRole === "Supervisor"
          ? "Supervisor-Link erstellt: 30 Verwendungen, 30 Tage gültig."
          : "Administrator-Link erstellt: einmalig, 7 Tage gültig.",
      );
    } catch {
      setMessage("Der Einladungslink konnte nicht erstellt werden.");
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

  async function copyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setMessage("Einladungslink kopiert.");
  }

  return (
    <section className={mode === "phone" ? phoneStyles.root : styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Mitglieder werden geladen…" />
      {loadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p> : null}
      {mode === "phone" ? (
        <PhonePeopleView
          loading={loading}
          people={filteredPeople}
          query={query}
          onQueryChange={setQuery}
          onAdd={() => setModalOpen(true)}
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
                  onClick={() => setModalOpen(true)}
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
          label="Person hinzufügen"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <form onSubmit={addPerson}>
            <header className={styles.modalHeader}>
              <div>
              <h2>Einladungslink erstellen</h2>
              <p>Teile den Link, damit ein Mitglied eurem Abi-Arbeitsbereich beitritt.</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                disabled={inviteSaving}
                aria-label="Dialog schließen"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className={styles.modalBody}>
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
              {inviteLink ? (
                <div className={styles.inviteLinkBox}>
                  <span>Link für {newRole}</span>
                  <input readOnly value={inviteLink} aria-label="Einladungslink" />
                  <button type="button" className={styles.secondaryButton} onClick={copyInviteLink}>
                    Link kopieren
                  </button>
                </div>
              ) : null}
            </div>
            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeModal}
                disabled={inviteSaving}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton} disabled={inviteSaving} aria-busy={inviteSaving}>
                {inviteSaving ? "Wird erstellt …" : inviteLink ? "Neuen Link erstellen" : "Link erstellen"}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </section>
  );
}
