"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Landmark,
  Pencil,
  Plus,
  ShieldCheck,
} from "lucide-react";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import type { PresentationMode } from "@/hooks/use-presentation-mode";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

type FundsCard = {
  id: string;
  details: AccountCardDetails;
  balance: number;
  iban: string;
  bic: string;
  bankName: string;
  status: string;
  lastSync: string;
};

type FundsCashBox = {
  name: string;
  balance: number;
  responsible: string;
  lastCountDate: string;
  countStatus: "matched" | "discrepancy";
  difference: number;
};

type FundsAudit = {
  id: string;
  date: string;
  auditor: string;
  countedAmount: number;
  bookBalance: number;
  difference: number;
  note?: string;
};

type FundsActivity = {
  label: string;
  meta: string;
  date: string;
  type: string;
  description: string;
  user: string;
  amount: number;
};

type AdaptiveFundsViewProps = {
  mode: Exclude<PresentationMode, "desktop">;
  cards: FundsCard[];
  activeCard: FundsCard | undefined;
  activeCardIndex: number;
  cashBox: FundsCashBox;
  auditLogs: FundsAudit[];
  activities: FundsActivity[];
  euro: (value: number) => string;
  onSwitchCard: (direction: -1 | 1) => void;
  onSelectCard: (index: number) => void;
  onAddCard: () => void;
  onEditCard: () => void;
  onCountCash: () => void;
  onTransfer: () => void;
  onCopy: (value: string, field: string) => void;
};

type FundsSection = "overview" | "accounts" | "audit";

function SectionTabs({
  active,
  onChange,
  phone = false,
}: {
  active: FundsSection;
  onChange: (section: FundsSection) => void;
  phone?: boolean;
}) {
  return (
    <div
      className={phone ? styles.phoneTabs : styles.tabs}
      role="tablist"
      aria-label="Finanzbereiche"
    >
      {[
        ["overview", "Übersicht"],
        ["accounts", "Konten"],
        ["audit", "Prüfung"],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          className={active === value ? styles.activeTab : ""}
          onClick={() => onChange(value as FundsSection)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Metrics({
  activeCard,
  cashBox,
  euro,
}: Pick<AdaptiveFundsViewProps, "activeCard" | "cashBox" | "euro">) {
  return (
    <div className={styles.metricStrip} aria-label="Finanzkennzahlen">
      <div className={styles.metric}>
        <span>Gesamt</span>
        <strong>{euro((activeCard?.balance ?? 0) + cashBox.balance)}</strong>
      </div>
      <div className={styles.metric}>
        <span>Bank</span>
        <strong>{euro(activeCard?.balance ?? 0)}</strong>
      </div>
      <div className={styles.metric}>
        <span>Barkasse</span>
        <strong>{euro(cashBox.balance)}</strong>
      </div>
      <div className={styles.metric}>
        <span>Abgleich</span>
        <strong
          className={
            cashBox.countStatus === "matched"
              ? styles.positive
              : styles.negative
          }
        >
          {cashBox.countStatus === "matched" ? "Stimmt" : "Prüfen"}
        </strong>
      </div>
    </div>
  );
}

function AccountStage(props: AdaptiveFundsViewProps) {
  const { cards, activeCard, activeCardIndex } = props;
  return (
    <article className={`${styles.panel} ${styles.accountPanel}`}>
      <div className={styles.cardStage}>
        <button
          type="button"
          className={styles.carouselButton}
          aria-label="Vorherige Karte"
          disabled={cards.length < 2}
          onClick={() => props.onSwitchCard(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.cardSlot}
          aria-label={`${activeCard?.details.accountName ?? "Bankkonto"} bearbeiten`}
          onClick={props.onEditCard}
        >
          <AccountCard
            details={activeCard?.details}
            cardColor={activeCard?.details.color}
          />
        </button>
        <button
          type="button"
          className={styles.carouselButton}
          aria-label="Nächste Karte"
          disabled={cards.length < 2}
          onClick={() => props.onSwitchCard(1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className={styles.cardMeta}>
        <span>
          Karte {activeCardIndex + 1} von {cards.length}
        </span>
        <button
          type="button"
          onClick={props.onAddCard}
          aria-label="Karte hinzufügen"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  );
}

function TabletOverview(props: AdaptiveFundsViewProps) {
  const { activeCard, cashBox, euro, activities } = props;
  return (
    <div className={styles.overview}>
      <AccountStage {...props} />

      <article className={`${styles.panel} ${styles.cashPanel}`}>
        <header className={styles.panelHeader}>
          <h2>Barkasse</h2>
          <Banknote aria-hidden="true" />
        </header>
        <strong className={styles.cashAmount}>{euro(cashBox.balance)}</strong>
        <div className={styles.cashRows}>
          <div>
            <span>Verantwortlich</span>
            <strong>{cashBox.responsible}</strong>
          </div>
          <div>
            <span>Letzte Zählung</span>
            <strong>{cashBox.lastCountDate}</strong>
          </div>
        </div>
        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={props.onCountCash}
          >
            <Banknote aria-hidden="true" /> Kasse zählen
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={props.onTransfer}
          >
            <ArrowRightLeft aria-hidden="true" /> Umbuchung
          </button>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.reconcilePanel}`}>
        <header className={styles.panelHeader}>
          <h2>Kassenabgleich</h2>
          <ShieldCheck aria-hidden="true" />
        </header>
        <strong className={`${styles.reconcileStatus} ${styles.positive}`}>
          <Check aria-hidden="true" className="inline size-5" /> Stimmt
        </strong>
        <div className={styles.reconcileRows}>
          <div>
            <span>Soll</span>
            <strong>{euro(cashBox.balance)}</strong>
          </div>
          <div>
            <span>Ist</span>
            <strong>{euro(cashBox.balance + cashBox.difference)}</strong>
          </div>
          <div>
            <span>Differenz</span>
            <strong className={styles.positive}>
              {euro(cashBox.difference)}
            </strong>
          </div>
        </div>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={props.onCountCash}
        >
          Neuen Abgleich durchführen
        </button>
      </article>

      <article className={`${styles.panel} ${styles.activityPanel}`}>
        <header
          className={styles.panelHeader}
          style={{ padding: "0.75rem 1rem" }}
        >
          <h2>Letzte Aktivitäten</h2>
          <Activity aria-hidden="true" />
        </header>
        <div className={styles.activityHeader}>
          <span>Datum</span>
          <span>Typ</span>
          <span>Beschreibung</span>
          <span>Betrag</span>
        </div>
        {activities.slice(0, 4).map((item) => (
          <div
            className={styles.activityRow}
            key={`${item.date}-${item.description}`}
          >
            <span>{item.date}</span>
            <span>{item.type}</span>
            <span>{item.description}</span>
            <b className={item.amount >= 0 ? styles.positive : styles.negative}>
              {item.amount >= 0 ? "+" : ""}
              {euro(item.amount)}
            </b>
          </div>
        ))}
      </article>

      <article className={`${styles.panel} ${styles.detailsPanel}`}>
        <header className={styles.panelHeader}>
          <h2>Bankdetails</h2>
          <Landmark aria-hidden="true" />
        </header>
        <div className={styles.detailsRows}>
          <div>
            <span>IBAN</span>
            <strong>{activeCard?.iban}</strong>
          </div>
          <div>
            <span>BIC</span>
            <strong>{activeCard?.bic}</strong>
          </div>
        </div>
      </article>
    </div>
  );
}

function AccountsView(props: AdaptiveFundsViewProps) {
  return (
    <div className={styles.accountsView}>
      <article className={`${styles.panel} ${styles.accountList}`}>
        <header
          className={styles.panelHeader}
          style={{ padding: "0.85rem 1rem" }}
        >
          <h2>Konten & Karten</h2>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={props.onAddCard}
          >
            <Plus aria-hidden="true" /> Karte hinzufügen
          </button>
        </header>
        {props.cards.map((card, index) => (
          <button
            type="button"
            className={styles.accountRow}
            key={card.id}
            onClick={() => props.onSelectCard(index)}
          >
            <span>
              <strong>{card.details.accountName}</strong>
              <small>
                {card.bankName}, {card.lastSync}
              </small>
            </span>
            <b>{props.euro(card.balance)}</b>
          </button>
        ))}
      </article>
      <article className={`${styles.panel} ${styles.detailsPanel}`}>
        <header className={styles.panelHeader}>
          <h2>Bankverbindung</h2>
          <Landmark aria-hidden="true" />
        </header>
        <div className={styles.detailsRows}>
          <div>
            <span>IBAN</span>
            <strong>{props.activeCard?.iban}</strong>
          </div>
          <div>
            <span>BIC</span>
            <strong>{props.activeCard?.bic}</strong>
          </div>
          <div>
            <span>Inhaber</span>
            <strong>{props.activeCard?.details.holder}</strong>
          </div>
        </div>
        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={props.onEditCard}
          >
            <Pencil aria-hidden="true" /> Bearbeiten
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => props.onCopy(props.activeCard?.iban ?? "", "iban")}
          >
            <Copy aria-hidden="true" /> Kopieren
          </button>
        </div>
      </article>
    </div>
  );
}

function AuditView(props: AdaptiveFundsViewProps) {
  return (
    <div className={styles.auditView}>
      <article className={`${styles.panel} ${styles.auditList}`}>
        <header
          className={styles.panelHeader}
          style={{ padding: "0.85rem 1rem" }}
        >
          <h2>Kassenbuch & Prüfprotokoll</h2>
          <ShieldCheck aria-hidden="true" />
        </header>
        {props.auditLogs.map((entry) => (
          <div className={styles.auditRow} key={entry.id}>
            <span>
              <strong>{entry.note ?? "Kassenprüfung"}</strong>
              <small>
                {entry.date}, {entry.auditor}
              </small>
            </span>
            <b
              className={
                Math.abs(entry.difference) < 0.01
                  ? styles.positive
                  : styles.negative
              }
            >
              {props.euro(entry.difference)}
            </b>
          </div>
        ))}
      </article>
      <article className={`${styles.panel} ${styles.detailsPanel}`}>
        <header className={styles.panelHeader}>
          <h2>Zugriff</h2>
          <ShieldCheck aria-hidden="true" />
        </header>
        <div className={styles.detailsRows}>
          <div>
            <span>Kassenwart</span>
            <strong>Max Müller</strong>
          </div>
          <div>
            <span>Vertretung</span>
            <strong>Lisa Schmidt</strong>
          </div>
          <div>
            <span>Letzte Prüfung</span>
            <strong>{props.cashBox.lastCountDate}</strong>
          </div>
        </div>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={props.onCountCash}
        >
          Prüfung starten
        </button>
      </article>
    </div>
  );
}

function TabletFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  return (
    <div className={`${styles.root} ${styles.tabletRoot}`}>
      <SectionTabs active={section} onChange={setSection} />
      <Metrics
        activeCard={props.activeCard}
        cashBox={props.cashBox}
        euro={props.euro}
      />
      {section === "overview" ? (
        <TabletOverview {...props} />
      ) : section === "accounts" ? (
        <AccountsView {...props} />
      ) : (
        <AuditView {...props} />
      )}
    </div>
  );
}

function PhoneFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  const { activeCard, cashBox, euro } = props;

  return (
    <div className={`${styles.root} ${styles.phoneRoot}`}>
      <div className={styles.phoneBalance}>
        <span className={styles.eyebrow}>Gesamt verfügbar</span>
        <strong>{euro((activeCard?.balance ?? 0) + cashBox.balance)}</strong>
        <p>
          {euro(activeCard?.balance ?? 0)} Bank, {euro(cashBox.balance)} Bargeld
        </p>
      </div>
      <SectionTabs active={section} onChange={setSection} phone />

      {section === "overview" ? (
        <>
          <section className={styles.phoneCardSection}>
            <div className={styles.phoneCardStage}>
              <button
                type="button"
                className={styles.carouselButton}
                disabled={props.cards.length < 2}
                aria-label="Vorherige Karte"
                onClick={() => props.onSwitchCard(-1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.phoneCardSlot}
                onClick={props.onEditCard}
                aria-label="Karte bearbeiten"
              >
                <AccountCard
                  details={activeCard?.details}
                  cardColor={activeCard?.details.color}
                />
              </button>
              <button
                type="button"
                className={styles.carouselButton}
                disabled={props.cards.length < 2}
                aria-label="Nächste Karte"
                onClick={() => props.onSwitchCard(1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            <div className={styles.phoneAccountMeta}>
              <strong>{activeCard?.details.accountName}</strong>
              <span>{activeCard?.status}</span>
              <b>{euro(activeCard?.balance ?? 0)}</b>
            </div>
          </section>
          <div className={styles.phoneActionRow}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={props.onCountCash}
            >
              <Banknote aria-hidden="true" /> Zählen
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={props.onTransfer}
            >
              <ArrowRightLeft aria-hidden="true" /> Umbuchen
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={props.onAddCard}
            >
              <Plus aria-hidden="true" /> Karte
            </button>
          </div>
          <section className={styles.phoneSection}>
            <h2>Barkasse</h2>
            <div className={styles.phoneRows}>
              <div className={styles.phoneRow}>
                <span>
                  <strong>Aktueller Bestand</strong>
                  <small>Zuletzt gezählt {cashBox.lastCountDate}</small>
                </span>
                <b>{euro(cashBox.balance)}</b>
              </div>
              <div className={styles.phoneRow}>
                <span>
                  <strong>Kassenabgleich</strong>
                  <small>Differenz {euro(cashBox.difference)}</small>
                </span>
                <b className={styles.positive}>Stimmt</b>
              </div>
            </div>
          </section>
          <section className={styles.phoneSection}>
            <h2>Letzte Aktivitäten</h2>
            <div className={styles.phoneRows}>
              {props.activities.slice(0, 4).map((item) => (
                <div
                  className={styles.phoneRow}
                  key={`${item.date}-${item.description}`}
                >
                  <span>
                    <strong>{item.description}</strong>
                    <small>
                      {item.date}, {item.user}
                    </small>
                  </span>
                  <b
                    className={
                      item.amount >= 0 ? styles.positive : styles.negative
                    }
                  >
                    {item.amount >= 0 ? "+" : ""}
                    {euro(item.amount)}
                  </b>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : section === "accounts" ? (
        <section className={styles.phoneSection}>
          <h2>Konten & Karten</h2>
          <div className={styles.phoneRows}>
            {props.cards.map((card, index) => (
              <button
                type="button"
                className={styles.phoneRow}
                key={card.id}
                onClick={() => props.onSelectCard(index)}
              >
                <span>
                  <strong>{card.details.accountName}</strong>
                  <small>{card.bankName}</small>
                </span>
                <b>{euro(card.balance)}</b>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.phoneSection}>
          <h2>Prüfprotokoll</h2>
          <div className={styles.phoneRows}>
            {props.auditLogs.map((entry) => (
              <div className={styles.phoneRow} key={entry.id}>
                <span>
                  <strong>{entry.note ?? "Kassenprüfung"}</strong>
                  <small>
                    {entry.date}, {entry.auditor}
                  </small>
                </span>
                <b
                  className={
                    Math.abs(entry.difference) < 0.01
                      ? styles.positive
                      : styles.negative
                  }
                >
                  {euro(entry.difference)}
                </b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function AdaptiveFundsView(props: AdaptiveFundsViewProps) {
  return props.mode === "tablet" ? (
    <TabletFunds {...props} />
  ) : (
    <PhoneFunds {...props} />
  );
}
