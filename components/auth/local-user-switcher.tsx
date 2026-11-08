"use client";

import { useState, type FormEvent } from "react";
import { createLocalPerson, switchLocalUser, type LocalPerson } from "@/features/classes/actions/local-users";

export type LocalPeopleState = {
  currentUserId: string;
  canManageMembers: boolean;
  people: LocalPerson[];
};

type NewRole = "admin" | "supervisor" | "student";

const ROLE_LABELS: Record<NewRole, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  student: "Student",
};

const ADD_ERRORS: Record<string, string> = {
  FORBIDDEN: "Only administrators can add people.",
  INVALID_INPUT: "Enter a name with 2 to 120 characters.",
  PERSON_CREATE_FAILED: "The person could not be added. Try again.",
  UNAVAILABLE: "Adding people is only available in the demo.",
};

/** Demo-only person switcher. Lists the active class's people; administrators can add one. */
export function LocalPersonPanel({ state }: { state: LocalPeopleState }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<NewRole>("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(personId: string) {
    if (personId === state.currentUserId) return;
    setBusy(true);
    setError("");
    const result = await switchLocalUser(personId).catch(() => ({ ok: false as const, error: "PERSON_NOT_FOUND" }));
    if (!result.ok) {
      setError("That person could not be selected.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await createLocalPerson({ name, role }).catch(() => ({ ok: false as const, error: "PERSON_CREATE_FAILED" }));
    if (!result.ok) {
      setError(ADD_ERRORS[result.error] ?? "The person could not be added.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <>
      <strong>Demo people</strong>
      {state.people.map((person) => (
        <button
          key={person.id}
          type="button"
          role="menuitemradio"
          aria-checked={person.id === state.currentUserId}
          disabled={busy}
          onClick={() => void choose(person.id)}
        >
          {person.name} <small>{ROLE_LABELS[person.role as NewRole] ?? person.role}</small>
        </button>
      ))}
      {state.canManageMembers && !adding ? (
        <button type="button" role="menuitem" onClick={() => { setAdding(true); setError(""); }}>
          Add a person
        </button>
      ) : null}
      {state.canManageMembers && adding ? (
        <form onSubmit={(event) => void addPerson(event)}>
          <label>
            <span>Name</span>
            <input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} placeholder="Jane Example" />
          </label>
          <label>
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as NewRole)} disabled={busy}>
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <button type="submit" disabled={busy || name.trim().length < 2} aria-busy={busy}>
            {busy ? "Adding…" : "Add and switch"}
          </button>
        </form>
      ) : null}
      {!state.canManageMembers ? <p>Only administrators can add people.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
