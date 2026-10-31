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

function keepDigits(value: string) {
  return value.replace(/\D/g, "");
}

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Abi 2026");
  const [school, setSchool] = useState("");

  const [notifications, setNotifications] = useState({
    receipts: true,
    payments: true,
    goals: false,
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const graduationYearDigits = keepDigits(workspaceName);

  useEffect(() => {
    let active = true;

    getCommitteeSettingsForCurrentOrganization()
      .then((committeeSettings) => {
        if (!active) return;

        if (!committeeSettings.ok || !committeeSettings.data) {
          setLoadError("Settings could not be loaded.");

          return;
        }

        setSchool(committeeSettings.data.school_name);
        setWorkspaceName(`Abi ${committeeSettings.data.graduation_year}`);

        const parsedNotifications = updateCommitteeSettingsSchema.shape.notifications.safeParse(
          committeeSettings.data.notifications,
        );

        if (parsedNotifications.success) setNotifications(parsedNotifications.data);
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

  async function saveSettings() {
    if (saving) return;

    setSaving(true);

    try {
      const result = await updateCommitteeSettings({
        schoolName: school,
        graduationYear: Number(graduationYearDigits) || 2026,
        notifications,
      });

      setStatusMessage(result.ok ? "Changes saved." : "Changes could not be saved.");
    } catch {
      setStatusMessage("Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
    setStatusMessage("");
  }

  return (
    <section className={`${ledger.page} ${ledger.narrow} ${ledger.form}`} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading settings" />
      {loadError ? <LoadError message={loadError} /> : null}

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
              value={workspaceName}
              disabled={loading}
              maxLength={40}
              onChange={(event) => {
                setWorkspaceName(event.target.value);
                setStatusMessage("");
              }}
            />
          </label>
          <label className={ledger.field}>
            <span>School</span>
            <input
              name="school"
              value={school}
              disabled={loading}
              maxLength={60}
              onChange={(event) => {
                setSchool(event.target.value);
                setStatusMessage("");
              }}
            />
          </label>
          <label className={ledger.field}>
            <span>Graduation year</span>
            <input
              name="graduationYear"
              inputMode="numeric"
              value={graduationYearDigits || "2026"}
              readOnly
            />
          </label>
          <label className={ledger.field}>
            <span>Currency</span>
            <input value="US dollars (USD)" readOnly />
          </label>
        </div>
      </section>

      <section className={`${ledger.section} ${ledger.spaced}`}>
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
                  checked={notifications[option.key]}
                  disabled={loading}
                  onChange={() => toggleNotification(option.key)}
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

      <section className={`${ledger.section} ${ledger.spaced}`}>
        <header className={ledger.sectionHeader}>
          <h2>Appearance</h2>
          <p>Follows your system setting until you change it.</p>
        </header>
        <div className={styles.theme}>
          <ThemeToggle />
        </div>
      </section>

      <footer className={styles.footer}>
        <p aria-live="polite">{statusMessage}</p>
        <button
          type="button"
          className={ledger.primaryButton}
          onClick={saveSettings}
          disabled={loading || saving}
        >
          {saving ? "Saving" : "Save changes"}
        </button>
      </footer>
    </section>
  );
}
