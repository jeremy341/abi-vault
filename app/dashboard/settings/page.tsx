"use client";

import { useEffect, useState } from "react";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import styles from "./settings.module.css";
import ThemeToggle from "@/components/ThemeToggle";
import { LoadingStatus } from "@/components/ui/loading-state";
import { getCommitteeSettingsForCurrentOrganization } from "@/features/finance/actions/queries";
import { updateCommitteeSettings } from "@/features/settings/actions/settings";
import { updateCommitteeSettingsSchema } from "@/features/settings/schemas/settings";

const notificationOptions = [
  {
    key: "receipts" as const,
    label: "New receipts",
    description: "A receipt needs to be uploaded or reviewed.",
  },
  {
    key: "payments" as const,
    label: "Missing payments",
    description: "Pending cash or account payments.",
  },
  {
    key: "goals" as const,
    label: "Goal progress",
    description: "Important progress milestones.",
  },
];

type Notifications = Record<(typeof notificationOptions)[number]["key"], boolean>;

type Form = {
  workspaceName: string;
  school: string;
  notifications: Notifications;
};

const defaultForm: Form = {
  workspaceName: "Abi 2026",
  school: "",
  notifications: { receipts: true, payments: true, goals: false },
};

function keepDigits(value: string) {
  return value.replace(/\D/g, "");
}

function sameForm(a: Form, b: Form) {
  return (
    a.workspaceName === b.workspaceName &&
    a.school === b.school &&
    notificationOptions.every((option) => a.notifications[option.key] === b.notifications[option.key])
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(defaultForm);
  const [saved, setSaved] = useState<Form>(defaultForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const graduationYearDigits = keepDigits(form.workspaceName);
  const dirty = !sameForm(form, saved);

  useEffect(() => {
    let active = true;
    getCommitteeSettingsForCurrentOrganization()
      .then((committeeSettings) => {
        if (!active) return;

        if (!committeeSettings.ok || !committeeSettings.data) {
          setLoadError("Settings could not be loaded.");

          return;
        }

        const parsedNotifications = updateCommitteeSettingsSchema.shape.notifications.safeParse(
          committeeSettings.data.notifications,
        );
        const loaded: Form = {
          workspaceName: `Abi ${committeeSettings.data.graduation_year}`,
          school: committeeSettings.data.school_name,
          notifications: parsedNotifications.success ? parsedNotifications.data : defaultForm.notifications,
        };

        setForm(loaded);
        setSaved(loaded);
      })
      .catch(() => {
        if (active) setLoadError("Settings could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function change(changes: Partial<Form>) {
    setForm((current) => ({ ...current, ...changes }));
    setStatusMessage("");
  }

  async function saveSettings() {
    if (saving || !dirty) return;
    setSaving(true);

    try {
      const result = await updateCommitteeSettings({
        schoolName: form.school,
        graduationYear: Number(graduationYearDigits) || 2026,
        notifications: form.notifications,
      });

      if (result.ok) setSaved(form);
      setStatusMessage(result.ok ? "Changes saved." : "Changes could not be saved.");
    } catch {
      setStatusMessage("Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setForm(saved);
    setStatusMessage("");
  }

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading settings" />
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={styles.layout}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Workspace</h2>
            <p>Basic details for your class.</p>
          </header>
          <div className={styles.fields}>
            <label className={ledger.field}>
              <span>Workspace name</span>
              <input
                name="workspaceName"
                value={form.workspaceName}
                disabled={loading}
                maxLength={40}
                onChange={(event) => change({ workspaceName: event.target.value })}
              />
            </label>
            <label className={ledger.field}>
              <span>School</span>
              <input
                name="school"
                value={form.school}
                disabled={loading}
                maxLength={60}
                onChange={(event) => change({ school: event.target.value })}
              />
            </label>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Graduation year</dt>
              <dd>{graduationYearDigits || "2026"}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>US dollars (USD)</dd>
            </div>
          </dl>
        </section>

        <div className={styles.side}>
          <section className={ledger.section}>
            <header className={ledger.sectionHeader}>
              <h2>Notifications</h2>
              <p>Choose which events notify the committee.</p>
            </header>
            <ul className={ledger.list}>
              {notificationOptions.map((option) => (
                <li key={option.key}>
                  <label className={styles.option}>
                    <input
                      type="checkbox"
                      checked={form.notifications[option.key]}
                      disabled={loading}
                      onChange={() =>
                        change({
                          notifications: { ...form.notifications, [option.key]: !form.notifications[option.key] },
                        })
                      }
                    />
                    <span className={ledger.rowTitle}>
                      <span>{option.label}</span>
                      <span className={ledger.rowMeta}>{option.description}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={ledger.section}>
            <header className={ledger.sectionHeader}>
              <h2>Appearance</h2>
              <p>Follows your system setting until you change it.</p>
            </header>
            <div className={styles.theme}>
              <ThemeToggle />
            </div>
          </section>
        </div>
      </div>

      <footer className={styles.footer}>
        <p aria-live="polite">{statusMessage || (dirty ? "You have unsaved changes." : "")}</p>
        <div className={ledger.inlineActions}>
          <button type="button" className={ledger.secondaryButton} onClick={discardChanges} disabled={!dirty || saving}>
            Discard
          </button>
          <button type="button" className={ledger.primaryButton} onClick={saveSettings} disabled={loading || saving || !dirty}>
            {saving ? "Saving" : "Save changes"}
          </button>
        </div>
      </footer>
    </section>
  );
}
