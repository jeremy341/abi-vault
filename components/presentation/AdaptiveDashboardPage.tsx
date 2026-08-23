"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  FileText,
  Plus,
  ReceiptText,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import { Dialog } from "@/components/ui/dialog";
import {
  dashboardCategories,
  dashboardGoals,
  dashboardTransactions,
} from "@/components/dashboard/DashboardPanels";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import styles from "@/app/dashboard/dashboard-adaptive.module.css";
import desktopStyles from "@/app/dashboard/dashboard-desktop.module.css";

function DesktopDashboard() {
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);

  return (
    <section className={desktopStyles.page} aria-label="Finanzübersicht">
      <div className={desktopStyles.metrics} aria-label="Finanzkennzahlen">
        <div>
          <span>Gesamt verfügbar</span>
          <strong>3.476,00 €</strong>
          <small>Bank und Barkasse</small>
        </div>
        <div>
          <span>Bankguthaben</span>
          <strong>2.850,75 €</strong>
          <small>Heute synchronisiert</small>
        </div>
        <div>
          <span>Bargeldbestand</span>
          <strong>625,25 €</strong>
          <small>Zuletzt am 15.05. gezählt</small>
        </div>
        <div>
          <span>Offene Prüfung</span>
          <strong>4 Vorgänge</strong>
          <small>3 Belege, 1 Zahlung</small>
        </div>
      </div>

      <div className={desktopStyles.workspace}>
        <div className={desktopStyles.primaryColumn}>
          <article className={desktopStyles.accountPanel}>
            <button
              type="button"
              className={desktopStyles.accountCard}
              aria-label="Bankkonto anzeigen"
              onClick={() => setCardPreviewOpen(true)}
            >
              <AccountCard />
            </button>
            <div className={desktopStyles.accountSummary}>
              <div>
                <span className={desktopStyles.eyebrow}>Klassenkonto</span>
                <strong>2.850,75 €</strong>
                <p>API verbunden · heute um 09:42 synchronisiert</p>
              </div>
              <div className={desktopStyles.accountActions}>
                <Link href="/dashboard/transactions">
                  <Plus aria-hidden="true" /> Transaktion
                </Link>
                <Link href="/dashboard/funds">
                  Konto öffnen <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>

          <article className={desktopStyles.transactionsPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Letzte Transaktionen</h2>
                <p>Aktuelle Bewegungen aus allen Konten</p>
              </div>
              <Link href="/dashboard/transactions">
                Alle anzeigen <ArrowRight aria-hidden="true" />
              </Link>
            </header>
            <div className={desktopStyles.transactionHeader}>
              <span>Transaktion</span>
              <span>Kategorie</span>
              <span>Datum</span>
              <span>Betrag</span>
            </div>
            <div className={desktopStyles.transactionRows}>
              {dashboardTransactions.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className={desktopStyles.transactionRow}
                    key={item.title}
                  >
                    <span className={desktopStyles.transactionName}>
                      <Icon aria-hidden="true" />
                      <strong>{item.title}</strong>
                    </span>
                    <span>{item.category}</span>
                    <span>{item.date}</span>
                    <b
                      className={
                        item.amount.startsWith("+")
                          ? desktopStyles.positive
                          : desktopStyles.negative
                      }
                    >
                      {item.amount}
                    </b>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <aside className={desktopStyles.secondaryColumn}>
          <article className={desktopStyles.goalsPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Ziele</h2>
                <p>Fortschritt der wichtigsten Vorhaben</p>
              </div>
              <Link href="/dashboard/goals">
                Öffnen <ArrowRight aria-hidden="true" />
              </Link>
            </header>
            <div className={desktopStyles.goalRows}>
              {dashboardGoals.map((goal) => (
                <div className={desktopStyles.goalRow} key={goal.title}>
                  <span>
                    <strong>{goal.title}</strong>
                    <small>{goal.saved}</small>
                  </span>
                  <div>
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                  <b>{goal.progress}%</b>
                </div>
              ))}
            </div>
          </article>

          <article className={desktopStyles.spendingPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Ausgaben</h2>
                <p>Nach Kategorie</p>
              </div>
              <span className={desktopStyles.panelValue}>2.503,10 €</span>
            </header>
            <div className={desktopStyles.spendingRows}>
              {dashboardCategories.map((item) => (
                <div className={desktopStyles.spendingRow} key={item.title}>
                  <span>{item.title}</span>
                  <div>
                    <i style={{ width: `${item.progress}%` }} />
                  </div>
                  <b>{item.progress}%</b>
                </div>
              ))}
            </div>
          </article>

          <article className={desktopStyles.reviewPanel}>
            <header className={desktopStyles.panelHeader}>
              <div>
                <h2>Zu prüfen</h2>
                <p>Aufgaben mit Handlungsbedarf</p>
              </div>
              <span className={desktopStyles.reviewCount}>4</span>
            </header>
            <div className={desktopStyles.reviewRows}>
              <Link href="/dashboard/receipts">
                <FileText aria-hidden="true" />
                <span>
                  <strong>3 Belege prüfen</strong>
                  <small>Belegstatus offen</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/dashboard/transactions">
                <Banknote aria-hidden="true" />
                <span>
                  <strong>1 Zahlung ohne Beleg</strong>
                  <small>Bargeldzahlung zuordnen</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/dashboard/funds">
                <CheckCircle2 aria-hidden="true" />
                <span>
                  <strong>Kassenabgleich stimmt</strong>
                  <small>Zuletzt am 15.05. geprüft</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </article>
        </aside>
      </div>

      {cardPreviewOpen ? (
        <Dialog
          label="Bankkonto anzeigen"
          onClose={() => setCardPreviewOpen(false)}
          overlayClassName={desktopStyles.accountOverlay}
          dialogClassName={desktopStyles.accountDialog}
        >
          <header className={desktopStyles.accountDialogHeader}>
            <div>
              <h2>Bankkonto</h2>
              <p>Kartenvorschau</p>
            </div>
            <button
              type="button"
              aria-label="Dialog schließen"
              onClick={() => setCardPreviewOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={desktopStyles.accountDialogCard}>
            <AccountCard />
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

function TabletDashboard() {
  return (
    <section className={styles.tabletPage}>
      <div className={styles.tabletMetricStrip} aria-label="Finanzkennzahlen">
        <div className={styles.tabletMetric}>
          <span>Gesamt verfügbar</span>
          <strong>3.476,00 €</strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Bank</span>
          <strong>2.850,75 €</strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Barkasse</span>
          <strong>625,25 €</strong>
        </div>
        <div className={styles.tabletMetric}>
          <span>Zu prüfen</span>
          <strong>4 Vorgänge</strong>
        </div>
      </div>

      <div className={styles.tabletWorkspace}>
        <div className={styles.tabletPrimary}>
          <article className={styles.tabletAccount}>
            <div className={styles.tabletCardSlot}>
              <AccountCard />
            </div>
            <div className={styles.tabletBalance}>
              <span>Klassenkonto</span>
              <strong>2.850,75 €</strong>
              <p>API verbunden, zuletzt heute synchronisiert</p>
              <div className={styles.tabletActions}>
                <Link
                  href="/dashboard/transactions"
                  className={styles.tabletAction}
                >
                  <Plus aria-hidden="true" /> Transaktion
                </Link>
                <Link
                  href="/dashboard/receipts"
                  className={styles.tabletAction}
                >
                  <ReceiptText aria-hidden="true" /> Beleg
                </Link>
              </div>
            </div>
          </article>

          <article className={styles.tabletTransactions}>
            <header className={styles.tabletPanelHeader}>
              <h2>Letzte Transaktionen</h2>
              <Link href="/dashboard/transactions">
                Alle anzeigen{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div className={styles.tabletTransactionList}>
              {dashboardTransactions.slice(0, 6).map((item) => (
                <div className={styles.tabletTransaction} key={item.title}>
                  <span>{item.title}</span>
                  <small>{item.category}</small>
                  <b
                    className={
                      item.amount.startsWith("+")
                        ? styles.positive
                        : styles.negative
                    }
                  >
                    {item.amount}
                  </b>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className={styles.tabletSecondary}>
          <article className={styles.tabletGoals}>
            <header className={styles.tabletSectionHeader}>
              <h2>Ziele</h2>
              <Link href="/dashboard/goals">
                Öffnen <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </header>
            <div className={styles.tabletGoalList}>
              {dashboardGoals.map((goal) => (
                <div className={styles.tabletGoal} key={goal.title}>
                  <strong>{goal.title}</strong>
                  <span>{goal.progress}%</span>
                  <div className={styles.tabletGoalTrack} aria-hidden="true">
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.tabletSpending}>
            <header className={styles.tabletSectionHeader}>
              <h2>Ausgaben</h2>
              <span className={styles.sectionMeta}>Nach Kategorie</span>
            </header>
            <div className={styles.tabletSpendingList}>
              {dashboardCategories.map((item) => (
                <div className={styles.tabletSpendingRow} key={item.title}>
                  <strong>{item.title}</strong>
                  <div
                    className={styles.tabletSpendingTrack}
                    aria-hidden="true"
                  >
                    <i style={{ width: `${item.progress}%` }} />
                  </div>
                  <span>{item.progress}%</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.tabletAttention}>
            <header className={styles.tabletSectionHeader}>
              <h2>Aufmerksamkeit</h2>
              <span className={styles.sectionMeta}>4 offen</span>
            </header>
            <div className={styles.tabletAttentionList}>
              <Link
                href="/dashboard/receipts"
                className={styles.tabletAttentionRow}
              >
                <AlertTriangle aria-hidden="true" className={styles.negative} />
                <span>
                  <strong>3 Belege prüfen</strong>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/transactions"
                className={styles.tabletAttentionRow}
              >
                <FileText aria-hidden="true" />
                <span>
                  <strong>1 Zahlung ohne Beleg</strong>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function PhoneDashboard() {
  return (
    <section className={styles.phonePage}>
      <div className={styles.phoneBalanceHero}>
        <span className={styles.phoneEyebrow}>Gesamt verfügbar</span>
        <strong>3.476,00 €</strong>
        <div className={styles.phoneBalanceMeta}>
          <span>Bankkonto & Barkasse</span>
          <b>Abgleich stimmt</b>
        </div>
      </div>

      <nav className={styles.phoneQuickActions} aria-label="Schnellaktionen">
        <Link
          href="/dashboard/transactions"
          className={styles.phoneQuickAction}
        >
          <Plus aria-hidden="true" /> Transaktion
        </Link>
        <Link href="/dashboard/receipts" className={styles.phoneQuickAction}>
          <ReceiptText aria-hidden="true" /> Beleg
        </Link>
        <Link href="/dashboard/goals" className={styles.phoneQuickAction}>
          <Target aria-hidden="true" /> Ziel
        </Link>
      </nav>

      <Link href="/dashboard/funds" className={styles.phoneAccountStrip}>
        <div>
          <strong>Klassenkonto</strong>
          <span>API verbunden</span>
        </div>
        <b>2.850,75 €</b>
      </Link>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Zuletzt</h2>
          <Link href="/dashboard/transactions">
            Alle <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneTransactionList}>
          {dashboardTransactions.slice(0, 4).map((item) => (
            <div className={styles.phoneTransaction} key={item.title}>
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.category}, {item.date}
                </small>
              </span>
              <b
                className={
                  item.amount.startsWith("+")
                    ? styles.positive
                    : styles.negative
                }
              >
                {item.amount}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Sparziele</h2>
          <Link href="/dashboard/goals">
            Verwalten <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <div className={styles.phoneGoalScroller}>
          {dashboardGoals.map((goal) => (
            <article className={styles.phoneGoal} key={goal.title}>
              <header>
                <strong>{goal.title}</strong>
                <span>{goal.progress}%</span>
              </header>
              <strong>{goal.target}</strong>
              <p>{goal.saved}</p>
              <div className={styles.phoneGoalTrack} aria-hidden="true">
                <i style={{ width: `${goal.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.phoneSection}>
        <header className={styles.phoneSectionHeader}>
          <h2>Zu prüfen</h2>
          <span className={styles.sectionMeta}>4 Vorgänge</span>
        </header>
        <div className={styles.phoneAttentionList}>
          <Link href="/dashboard/receipts" className={styles.phoneAttentionRow}>
            <AlertTriangle aria-hidden="true" className={styles.negative} />
            <span>3 Belege warten auf Prüfung</span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/transactions"
            className={styles.phoneAttentionRow}
          >
            <WalletCards aria-hidden="true" />
            <span>1 Bargeldzahlung ohne Beleg</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </section>
  );
}

export default function AdaptiveDashboardPage() {
  const mode = usePresentationMode();
  if (mode === "tablet") return <TabletDashboard />;
  if (mode === "phone") return <PhoneDashboard />;
  return <DesktopDashboard />;
}
