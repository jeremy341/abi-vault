"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Plus,
  ReceiptText,
  Target,
  WalletCards,
} from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import Klassenkasse from "@/components/dashboard/Klassenkasse";
import {
  dashboardCategories,
  dashboardGoals,
  dashboardTransactions,
  GoalsPanel,
  ReviewPanel,
  SpendingByCategory,
  TransactionHistory,
} from "@/components/dashboard/DashboardPanels";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import desktopStyles from "@/app/dashboard/dashboard.module.css";
import styles from "@/app/dashboard/dashboard-adaptive.module.css";

function DesktopDashboard() {
  return (
    <section className={desktopStyles.page}>
      <div className={desktopStyles.mobileIntro}>
        <h1>Finanzübersicht</h1>
        <p>Klassenfinanzen auf einen Blick.</p>
      </div>
      <div className={desktopStyles.grid}>
        <div className={`${desktopStyles.column} ${desktopStyles.leftColumn}`}>
          <Klassenkasse />
          <TransactionHistory />
        </div>
        <div className={`${desktopStyles.column} ${desktopStyles.rightColumn}`}>
          <GoalsPanel />
          <SpendingByCategory />
          <ReviewPanel />
        </div>
      </div>
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
