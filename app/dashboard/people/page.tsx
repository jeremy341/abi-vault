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
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import styles from "./people.module.css";
import phoneStyles from "./people-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";

type Person = {
  id: number;
  name: string;
  role: string;
  access: string;
  status: "Aktiv" | "Einladung offen";
  initials: string;
};

const initialPeople: Person[] = [
  {
    id: 1,
    name: "Jeremy",
    role: "Administrator",
    access: "Vollzugriff",
    status: "Aktiv",
    initials: "J",
  },
  {
    id: 2,
    name: "Lena Müller",
    role: "Kassenwartin",
    access: "Finanzen verwalten",
    status: "Aktiv",
    initials: "LM",
  },
  {
    id: 3,
    name: "Max Schneider",
    role: "Kassenwart",
    access: "Finanzen verwalten",
    status: "Aktiv",
    initials: "MS",
  },
  {
    id: 4,
    name: "Sophie Weber",
    role: "Mitglied",
    access: "Nur ansehen",
    status: "Aktiv",
    initials: "SW",
  },
  {
    id: 5,
    name: "Jonas Klein",
    role: "Mitglied",
    access: "Nur ansehen",
    status: "Einladung offen",
    initials: "JK",
  },
];

function PhonePeopleView({
  people,
  query,
  onQueryChange,
  onAdd,
}: {
  people: Person[];
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
}) {
  const active = people.filter((person) => person.status === "Aktiv").length;
  const admins = people.filter(
    (person) => person.role === "Administrator",
  ).length;
  const treasurers = people.filter((person) =>
    person.role.includes("Kassenwart"),
  ).length;
  const members = people.filter((person) => person.role === "Mitglied").length;

  return (
    <div className={phoneStyles.root}>
      <section className={phoneStyles.summary} aria-label="Mitgliederstatus">
        <div>
          <span>Mitglieder</span>
          <strong>{people.length}</strong>
        </div>
        <div>
          <span>Aktiv</span>
          <strong>{active}</strong>
        </div>
        <div>
          <span>Administratoren</span>
          <strong>{admins}</strong>
        </div>
      </section>

      <div className={phoneStyles.toolbar}>
        <label className={phoneStyles.search}>
          <Search aria-hidden="true" />
          <span className="sr-only">Mitglieder suchen</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Name oder Rolle …"
          />
        </label>
        <button
          type="button"
          className={phoneStyles.addButton}
          onClick={onAdd}
          aria-label="Person hinzufügen"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      <header className={phoneStyles.sectionHeader}>
        <h2>Mitglieder</h2>
        <span>Abi 2026</span>
      </header>
      <div className={phoneStyles.people}>
        {people.map((person) => (
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
        ))}
      </div>

      <section className={phoneStyles.roles} aria-label="Rollenübersicht">
        <div className={phoneStyles.role}>
          <strong>Admin</strong>
          <b>{admins}</b>
          <span>Vollzugriff</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Kassenwart</strong>
          <b>{treasurers}</b>
          <span>Finanzen</span>
        </div>
        <div className={phoneStyles.role}>
          <strong>Mitglied</strong>
          <b>{members}</b>
          <span>Nur ansehen</span>
        </div>
      </section>
    </div>
  );
}

export default function PeoplePage() {
  const mode = usePresentationMode();
  const [people, setPeople] = useState(initialPeople);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Mitglied");
  const [message, setMessage] = useState("");
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
    setNewName("");
    setNewRole("Mitglied");
  }

  function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    const initials = newName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setPeople((current) => [
      ...current,
      {
        id: Date.now(),
        name: newName.trim(),
        role: newRole,
        access:
          newRole === "Administrator"
            ? "Vollzugriff"
            : newRole === "Kassenwart"
              ? "Finanzen verwalten"
              : "Nur ansehen",
        status: "Einladung offen",
        initials,
      },
    ]);
    setMessage("Einladung vorbereitet.");
    closeModal();
  }

  return (
    <section className={mode === "phone" ? phoneStyles.root : styles.page}>
      {mode === "phone" ? (
        <PhonePeopleView
          people={filteredPeople}
          query={query}
          onQueryChange={setQuery}
          onAdd={() => setModalOpen(true)}
        />
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Users aria-hidden="true" />
              </span>
              <div>
                <span>Mitglieder</span>
                <strong>{people.length}</strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.greenCard}`}>
              <span className={styles.summaryIcon}>
                <Check aria-hidden="true" />
              </span>
              <div>
                <span>Aktiv</span>
                <strong>
                  {people.filter((person) => person.status === "Aktiv").length}
                </strong>
              </div>
            </article>
            <article className={`${styles.summaryCard} ${styles.violetCard}`}>
              <span className={styles.summaryIcon}>
                <ShieldCheck aria-hidden="true" />
              </span>
              <div>
                <span>Administratoren</span>
                <strong>
                  {
                    people.filter((person) => person.role === "Administrator")
                      .length
                  }
                </strong>
              </div>
            </article>
          </div>

          <div className={styles.contentGrid}>
            <article className={styles.peoplePanel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Mitglieder</h2>
                  <p>Personen und Rollen in eurem Arbeitsbereich.</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setModalOpen(true)}
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
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nach Name oder Rolle suchen …"
                />
              </div>
              <div className={styles.peopleList}>
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
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              {!filteredPeople.length ? (
                <div className={styles.emptyState}>
                  Keine Mitglieder gefunden.
                </div>
              ) : null}
            </article>

            <aside className={styles.sideColumn}>
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
                      <strong>Kassenwart</strong>
                      <small>Finanzen verwalten</small>
                    </span>
                    <b>
                      {
                        people.filter((person) =>
                          person.role.includes("Kassenwart"),
                        ).length
                      }
                    </b>
                  </div>
                  <div>
                    <span className={styles.roleIcon}>
                      <Users aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Mitglied</strong>
                      <small>Nur ansehen</small>
                    </span>
                    <b>
                      {
                        people.filter((person) => person.role === "Mitglied")
                          .length
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
                    <strong>Heute, 14:32 Uhr</strong>
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
                <h2>Person hinzufügen</h2>
                <p>Lade ein Mitglied in euren Abi-Arbeitsbereich ein.</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Dialog schließen"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.formField}>
                <span>Name</span>
                <input
                  autoFocus
                  name="personName"
                  autoComplete="off"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Vor- und Nachname …"
                />
              </label>
              <label className={styles.formField}>
                <span>Rolle</span>
                <select
                  name="personRole"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value)}
                >
                  <option>Mitglied</option>
                  <option>Kassenwart</option>
                  <option>Administrator</option>
                </select>
              </label>
            </div>
            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeModal}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton}>
                Einladung vorbereiten
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </section>
  );
}
