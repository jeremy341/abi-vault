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

export default function PeoplePage() {
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
    <section className={styles.page}>
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
            <div className={styles.emptyState}>Keine Mitglieder gefunden.</div>
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
                    people.filter((person) => person.role === "Administrator")
                      .length
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
                  {people.filter((person) => person.role === "Mitglied").length}
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
                <span>Alle Mitglieder arbeiten im selben Finanzbereich.</span>
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

      {modalOpen ? (
        <Dialog
          label="Person hinzufügen"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
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
