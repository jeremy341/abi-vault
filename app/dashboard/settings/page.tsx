"use client";

import {
  Bell,
  Building2,
  Check,
  Coins,
  Database,
  Download,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./settings.module.css";
import { LoadingStatus } from "@/components/ui/loading-state";
import phoneStyles from "./settings-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { getCommitteeSettingsForCurrentOrganization } from "@/features/finance/actions/queries";
import { updateCommitteeSettings } from "@/features/settings/actions/settings";

type Section = "general" | "notifications" | "permissions" | "data";

const sections = [
  {
    id: "general" as const,
    label: "Allgemein",
    description: "Arbeitsbereich und Jahrgang",
    icon: Building2,
  },
  {
    id: "notifications" as const,
    label: "Benachrichtigungen",
    description: "Hinweise und Erinnerungen",
    icon: Bell,
  },
  {
    id: "permissions" as const,
    label: "Berechtigungen",
    description: "Mitglieder und Rollen",
    icon: ShieldCheck,
  },
  {
    id: "data" as const,
    label: "Daten & Export",
    description: "Sicherung und Datenschutz",
    icon: Database,
  },
];

function PhoneSettingsView({
  loading,
  activeSection,
  onSectionChange,
  workspaceName,
  onWorkspaceNameChange,
  school,
  onSchoolChange,
  notifications,
  onToggleNotification,
  statusMessage,
  onStatusMessage,
  onSave,
  saving,
}: {
  loading: boolean;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  workspaceName: string;
  onWorkspaceNameChange: (value: string) => void;
  school: string;
  onSchoolChange: (value: string) => void;
  notifications: { receipts: boolean; payments: boolean; goals: boolean };
  onToggleNotification: (key: "receipts" | "payments" | "goals") => void;
  statusMessage: string;
  onStatusMessage: (message: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const active =
    sections.find((section) => section.id === activeSection) ?? sections[0];
  const ActiveIcon = active.icon;

  return (
    <section className={phoneStyles.root} aria-busy={loading}>
      <nav className={phoneStyles.nav} aria-label="Einstellungsbereiche" data-ui-slot="toolbar">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              type="button"
              key={section.id}
              className={activeSection === section.id ? phoneStyles.active : ""}
              onClick={() => onSectionChange(section.id)}
              disabled={loading}
              aria-label={section.label}
              title={section.label}
            >
              <Icon aria-hidden="true" />
              <span>
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <header className={phoneStyles.header} data-ui-slot="summary">
        <div>
          <h2>{active.label}</h2>
          <p>{active.description}</p>
        </div>
        <ActiveIcon aria-hidden="true" />
      </header>

      {activeSection === "general" ? (
        <>
          <section className={phoneStyles.section} data-ui-slot="primary-panel">
            <div className={phoneStyles.sectionTitle}>
              <h3>Arbeitsbereich</h3>
              <p>Grundlegende Angaben für euren Abi-Jahrgang.</p>
            </div>
            <div className={phoneStyles.fields}>
              <label>
                <span>Name des Arbeitsbereichs</span>
                <input
                  name="workspaceName"
                  autoComplete="off"
                  value={workspaceName}
                  disabled={loading}
                  onChange={(event) =>
                    onWorkspaceNameChange(event.target.value)
                  }
                />
              </label>
              <label>
                <span>Schule</span>
                <input
                  name="school"
                  autoComplete="organization"
                  value={school}
                  disabled={loading}
                  onChange={(event) => onSchoolChange(event.target.value)}
                />
              </label>
              <label>
                <span>Abiturjahr</span>
                <input
                  name="graduationYear"
                  inputMode="numeric"
                  value="2026"
                  readOnly
                />
              </label>
              <label>
                <span>Währung</span>
                <span className={phoneStyles.readonly}>Euro (EUR)</span>
              </label>
            </div>
          </section>
          <section className={phoneStyles.section} data-ui-slot="secondary-panel">
            <div className={phoneStyles.sectionTitle}>
              <h3>Verantwortliche Person</h3>
              <p>Primärer Kontakt für Finanzfragen.</p>
            </div>
            <div className={phoneStyles.member}>
              <span className={phoneStyles.avatar}>J</span>
              <span>
                <strong>Jeremy</strong>
                <small>Administrator</small>
              </span>
              <b>Aktiv</b>
            </div>
          </section>
        </>
      ) : null}

      {activeSection === "notifications" ? (
        <section className={phoneStyles.section}>
          <div className={phoneStyles.sectionTitle}>
            <h3>Benachrichtigungen</h3>
            <p>Wähle, welche Ereignisse euch informieren.</p>
          </div>
          <div className={phoneStyles.switches}>
            {[
              ["receipts", "Neue Belege", "Uploads und offene Prüfungen"],
              [
                "payments",
                "Fehlende Zahlungen",
                "Offene Bargeld- oder Kontozahlungen",
              ],
              ["goals", "Ziel-Fortschritt", "Wichtige Fortschrittsmarken"],
            ].map(([key, label, description]) => {
              const checked = notifications[key as keyof typeof notifications];
              return (
                <div className={phoneStyles.switchRow} key={key}>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={`${label} ${checked ? "deaktivieren" : "aktivieren"}`}
                    className={`${phoneStyles.switch} ${checked ? phoneStyles.switchOn : ""}`}
                    onClick={() =>
                      onToggleNotification(
                        key as "receipts" | "payments" | "goals",
                      )
                    }
                  >
                    <i />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {activeSection === "permissions" ? (
        <section className={phoneStyles.section}>
          <div className={phoneStyles.sectionTitle}>
            <h3>Rollen & Zugriffe</h3>
            <p>Wer Daten bearbeiten oder ansehen darf.</p>
          </div>
          <div className={phoneStyles.permissionList}>
            <div className={phoneStyles.permission}>
              <span>
                <strong>Administratoren</strong>
                <small>Vollständiger Zugriff</small>
              </span>
              <b>2 Personen</b>
            </div>
            <div className={phoneStyles.permission}>
              <span>
                <strong>Kassenwarte</strong>
                <small>Finanzen verwalten</small>
              </span>
              <b>3 Personen</b>
            </div>
            <div className={phoneStyles.permission}>
              <span>
                <strong>Mitglieder</strong>
                <small>Nur ansehen</small>
              </span>
              <b>18 Personen</b>
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === "data" ? (
        <section className={phoneStyles.section}>
          <div className={phoneStyles.sectionTitle}>
            <h3>Daten & Sicherung</h3>
            <p>Exportiere eine Kopie eurer Finanzdaten.</p>
          </div>
          <div className={phoneStyles.dataList}>
            <button
              type="button"
              className={phoneStyles.dataButton}
              onClick={() => onStatusMessage("Datenexport vorbereitet.")}
            >
              <span>
                <strong>Alle Daten exportieren</strong>
                <small>Transaktionen, Belege und Ziele</small>
              </span>
              <Download aria-hidden="true" />
            </button>
            <button
              type="button"
              className={phoneStyles.dataButton}
              onClick={() => onStatusMessage("Belegarchiv vorbereitet.")}
            >
              <span>
                <strong>Belegarchiv exportieren</strong>
                <small>Alle hochgeladenen Dateien</small>
              </span>
              <Download aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}

      <footer className={phoneStyles.footer} data-ui-slot="footer">
        <p aria-live="polite">{statusMessage || "\u00a0"}</p>
        <button
          type="button"
          className={phoneStyles.saveButton}
          onClick={onSave}
          disabled={loading || saving}
          data-ui-slot="primary-action"
        >
          <Save aria-hidden="true" /> {saving ? "Wird gespeichert …" : "Änderungen speichern"}
        </button>
      </footer>
    </section>
  );
}

export default function SettingsPage() {
  const mode = usePresentationMode();
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [workspaceName, setWorkspaceName] = useState("Abi 2026");
  const [school, setSchool] = useState("Musterschule Berlin");
  const [notifications, setNotifications] = useState({
    receipts: true,
    payments: true,
    goals: false,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getCommitteeSettingsForCurrentOrganization()
      .then((result) => {
        if (!active) return;
        if (!result.ok || !result.data) {
          setLoadError("Die Einstellungen konnten nicht geladen werden.");
          return;
        }
        setSchool(result.data.school_name);
        setWorkspaceName(`Abi ${result.data.graduation_year}`);
        const stored = result.data.notifications;
        if (stored && typeof stored === "object") {
          setNotifications((current) => ({
            receipts: typeof stored.receipts === "boolean" ? stored.receipts : current.receipts,
            payments: typeof stored.payments === "boolean" ? stored.payments : current.payments,
            goals: typeof stored.goals === "boolean" ? stored.goals : current.goals,
          }));
        }
      })
      .catch(() => {
        if (active) setLoadError("Die Einstellungen konnten nicht geladen werden.");
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
        graduationYear: Number(workspaceName.replace(/\D/g, "")) || 2026,
        notifications,
      });
      setStatusMessage(result.ok ? "Änderungen gespeichert." : "Änderungen konnten nicht gespeichert werden.");
    } catch {
      setStatusMessage("Änderungen konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
    setStatusMessage("");
  }

  const active =
    sections.find((section) => section.id === activeSection) ?? sections[0];
  const ActiveIcon = active.icon;

  if (mode === "phone") {
    return (
      <PhoneSettingsView
        loading={loading}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setStatusMessage("");
        }}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        school={school}
        onSchoolChange={setSchool}
        notifications={notifications}
        onToggleNotification={toggleNotification}
        statusMessage={statusMessage}
        onStatusMessage={setStatusMessage}
        onSave={saveSettings}
        saving={saving}
      />
    );
  }

  return (
    <section className={styles.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Einstellungen werden geladen…" />
      {loadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p> : null}
      <aside className={styles.settingsNav} data-ui-slot="toolbar">
        <div className={styles.workspaceCard}>
          <span className={styles.workspaceMark}>A</span>
          <div>
            <strong>Abi 2026</strong>
            <span>Finanz-Arbeitsbereich</span>
          </div>
        </div>
        <nav aria-label="Einstellungsbereiche">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                type="button"
                className={
                  activeSection === section.id
                    ? styles.activeNavItem
                    : styles.navItem
                }
                onClick={() => {
                  setActiveSection(section.id);
                  setStatusMessage("");
                }}
                disabled={loading}
                key={section.id}
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
              </button>
            );
          })}
        </nav>
        <div className={styles.navInfo}>
          <ShieldCheck aria-hidden="true" />
          <span>
            <strong>Sicher verwaltet</strong>
            <small>Änderungen gelten für den gesamten Arbeitsbereich.</small>
          </span>
        </div>
      </aside>

      <article className={styles.settingsPanel} data-ui-slot="content">
        <header className={styles.panelHeader} data-ui-slot="summary">
          <div>
            <h2>{active.label}</h2>
            <p>{active.description}</p>
          </div>
          <ActiveIcon aria-hidden="true" />
        </header>

        {activeSection === "general" ? (
          <div className={styles.panelBody} data-ui-slot="primary-panel">
            <section className={styles.settingSection}>
              <div className={styles.sectionTitle}>
                <Building2 aria-hidden="true" />
                <div>
                  <h3>Arbeitsbereich</h3>
                  <p>Grundlegende Angaben für euren Abi-Jahrgang.</p>
                </div>
              </div>
              <div className={styles.formGrid}>
                <label>
                  <span>Name des Arbeitsbereichs</span>
                  <input
                    name="workspaceName"
                    value={workspaceName}
                    disabled={loading}
                    maxLength={40}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                  />
                </label>
                <label>
                  <span>Schule</span>
                  <input
                    name="school"
                    value={school}
                    disabled={loading}
                    maxLength={60}
                    onChange={(event) => setSchool(event.target.value)}
                  />
                </label>
                <label>
                  <span>Abiturjahr</span>
                  <input
                    name="graduationYear"
                    inputMode="numeric"
                    value="2026"
                    readOnly
                  />
                </label>
                <label>
                  <span>Währung</span>
                  <div className={styles.readonlyField}>
                    <Coins aria-hidden="true" />
                    Euro (EUR)
                  </div>
                </label>
              </div>
            </section>
            <section className={styles.settingSection}>
              <div className={styles.sectionTitle}>
                <Users aria-hidden="true" />
                <div>
                  <h3>Verantwortliche Person</h3>
                  <p>Primärer Kontakt für Finanzfragen.</p>
                </div>
              </div>
              <div className={styles.memberRow}>
                <span className={styles.avatar}>J</span>
                <div>
                  <strong>Jeremy</strong>
                  <span>Administrator</span>
                </div>
                <span className={styles.roleBadge}>
                  <Check aria-hidden="true" />
                  Aktiv
                </span>
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === "notifications" ? (
          <div className={styles.panelBody}>
            <section className={styles.settingSection}>
              <div className={styles.sectionTitle}>
                <Bell aria-hidden="true" />
                <div>
                  <h3>Benachrichtigungen</h3>
                  <p>Wähle, welche Ereignisse euch automatisch informieren.</p>
                </div>
              </div>
              <div className={styles.switchList}>
                <SwitchRow
                  label="Neue Belege"
                  description="Hinweis, wenn ein Beleg hochgeladen oder geprüft werden muss."
                  checked={notifications.receipts}
                  onChange={() => toggleNotification("receipts")}
                />
                <SwitchRow
                  label="Fehlende Zahlungen"
                  description="Erinnerung bei offenen Bargeld- oder Kontozahlungen."
                  checked={notifications.payments}
                  onChange={() => toggleNotification("payments")}
                />
                <SwitchRow
                  label="Ziel-Fortschritt"
                  description="Benachrichtigung bei wichtigen Fortschrittsmarken."
                  checked={notifications.goals}
                  onChange={() => toggleNotification("goals")}
                />
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === "permissions" ? (
          <div className={styles.panelBody}>
            <section className={styles.settingSection}>
              <div className={styles.sectionTitle}>
                <ShieldCheck aria-hidden="true" />
                <div>
                  <h3>Rollen & Zugriffe</h3>
                  <p>
                    Lege fest, wer Finanzdaten bearbeiten oder nur ansehen darf.
                  </p>
                </div>
              </div>
              <div className={styles.permissionGrid}>
                <article>
                  <strong>Administratoren</strong>
                  <span>
                    Vollständiger Zugriff auf Daten und Einstellungen.
                  </span>
                  <b>2 Personen</b>
                </article>
                <article>
                  <strong>Kassenwarte</strong>
                  <span>Transaktionen, Belege und Konten verwalten.</span>
                  <b>3 Personen</b>
                </article>
                <article>
                  <strong>Mitglieder</strong>
                  <span>Finanzübersichten und Berichte ansehen.</span>
                  <b>18 Personen</b>
                </article>
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === "data" ? (
          <div className={styles.panelBody}>
            <section className={styles.settingSection}>
              <div className={styles.sectionTitle}>
                <Database aria-hidden="true" />
                <div>
                  <h3>Daten & Sicherung</h3>
                  <p>Exportiere eine Kopie eurer Finanzdaten.</p>
                </div>
              </div>
              <div className={styles.dataActions}>
                <button
                  type="button"
                  onClick={() => setStatusMessage("Datenexport vorbereitet.")}
                >
                  <Download aria-hidden="true" />
                  <span>
                    <strong>Alle Daten exportieren</strong>
                    <small>Transaktionen, Belege und Ziele als ZIP-Datei</small>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusMessage("Belegarchiv vorbereitet.")}
                >
                  <Download aria-hidden="true" />
                  <span>
                    <strong>Belegarchiv exportieren</strong>
                    <small>
                      Alle hochgeladenen Dateien gesammelt herunterladen
                    </small>
                  </span>
                </button>
              </div>
            </section>
          </div>
        ) : null}

        <footer className={styles.panelFooter} data-ui-slot="footer">
          <p aria-live="polite">{statusMessage || "\u00a0"}</p>
          <button
            type="button"
            className={styles.saveButton}
            onClick={saveSettings}
            disabled={loading || saving}
            data-ui-slot="primary-action"
          >
            <Save aria-hidden="true" />
            {saving ? "Wird gespeichert …" : "Änderungen speichern"}
          </button>
        </footer>
      </article>
    </section>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className={styles.switchRow}>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label} ${checked ? "deaktivieren" : "aktivieren"}`}
        className={checked ? styles.switchOn : styles.switchOff}
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  );
}
