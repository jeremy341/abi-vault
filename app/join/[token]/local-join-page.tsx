"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AbiLogo from "@/components/AbiLogo";
import { joinLocalClassWithInvite } from "@/features/people/actions/local-join";
import styles from "@/app/welcome-page.module.css";

const ERROR_MESSAGES: Record<string, string> = {
  LINK_EXPIRED: "This invitation link is no longer valid.",
  LINK_ALREADY_USED: "This invitation link is no longer valid.",
  INVALID_LINK: "This invitation link is not valid.",
  INVALID_NAME: "Please enter a name with at least 2 characters.",
  PERSON_CREATE_FAILED: "The demo person could not be created. Try again.",
  UNAVAILABLE: "Joining is only available in the demo.",
};

export default function LocalJoinPage({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await joinLocalClassWithInvite({ token, name });
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error] ?? "The invitation link could not be accepted.");
        setSaving(false);
        return;
      }
      // Full navigation so the layout re-reads the new person and class.
      window.location.assign("/dashboard");
    } catch {
      setError("The invitation link could not be accepted.");
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <AbiLogo />
      </header>
      <section className={styles.panel}>
        <form onSubmit={(event) => void submit(event)}>
          <h1>Join the class</h1>
          <p>
            Enter your name. The demo creates a separate person for you, so you can switch between people from the header.
          </p>
          <label>
            <span>Your name</span>
            <input
              required
              minLength={2}
              maxLength={120}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              placeholder="Jane Example"
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.button}>Cancel</Link>
            <button type="submit" className={styles.button} disabled={saving || name.trim().length < 2} aria-busy={saving}>
              {saving ? "Joining…" : "Join class"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
