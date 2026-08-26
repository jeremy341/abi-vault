"use client";

import { type KeyboardEvent, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pencil,
  Plus,
  ShieldCheck,
  WalletCards,
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
  id: string;
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
  mode: PresentationMode;
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
};

type FundsSection = "overview" | "accounts" | "audit";

function totalBankBalance(cards: FundsCard[]) {
  return cards.reduce((total, card) => total + card.balance, 0);
}

function FundsTabs({
  active,
  onChange,
}: {
  active: FundsSection;
  onChange: (section: FundsSection) => void;
}) {
  const tabs: Array<{ value: FundsSection; label: string }> = [
    { value: "overview", label: "Übersicht" },
    { value: "accounts", label: "Kassen" },
    { value: "audit", label: "Prüfung" },
  ];

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    onChange(tabs[nextIndex].value);
    const tabButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
      '[role="tab"]',
    );
    tabButtons?.[nextIndex]?.focus();
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label="Finanzbereiche">
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          tabIndex={active === tab.value ? 0 : -1}
          className={active === tab.value ? styles.activeTab : ""}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SummaryRail({
  cards,
  cashBox,
  euro,
}: Pick<AdaptiveFundsViewProps, "cards" | "cashBox" | "euro">) {
  const bankBalance = totalBankBalance(cards);
  const hasCashBox = Boolean(cashBox.id);
  const total = bankBalance + (hasCashBox && !cards.length ? cashBox.balance : 0);
  const matched = hasCashBox && cashBox.countStatus === "matched";

  return (
    <section className={styles.summaryRail} aria-label="Finanzübersicht">
      <div>
        <span>Gesamt verfügbar</span>
        <strong>{euro(total)}</strong>
        <small>{cards.length || (hasCashBox ? 1 : 0)} Kassen insgesamt</small>
      </div>
      <div>
        <span>Kassenbestand</span>
        <strong>{euro(bankBalance)}</strong>
        <small>{cards.length ? "Weitere Kassen" : "Keine Kassen angelegt"}</small>
      </div>
      <div>
        <span>Ausgewählte Kasse</span>
        <strong>{hasCashBox ? euro(cashBox.balance) : "Keine Kasse"}</strong>
        <small>{hasCashBox ? `Gezählt am ${cashBox.lastCountDate}` : "Noch nicht angelegt"}</small>
      </div>
      <div>
        <span>Kassenstatus</span>
        <strong className={!hasCashBox || matched ? styles.positive : styles.negative}>
          {!hasCashBox ? "Keine Kasse" : matched ? "Stimmt" : "Prüfen"}
        </strong>
        <small>
          {!hasCashBox ? "Lege eine Kasse an" : matched
            ? "Keine Differenz festgestellt"
            : `${euro(cashBox.difference)} Differenz`}
        </small>
      </div>
    </section>
  );
}

function AccountList({
  cards,
  cashBox,
  activeCardIndex,
  cashSelected,
  euro,
  onSelectCard,
  onSelectCash,
  onAddCard,
}: Pick<
  AdaptiveFundsViewProps,
  | "cards"
  | "cashBox"
  | "activeCardIndex"
  | "euro"
  | "onSelectCard"
  | "onAddCard"
> & {
  cashSelected: boolean;
  onSelectCash: () => void;
}) {
  return (
    <section
      className={styles.accountListPanel}
      aria-labelledby="account-list-title"
    >
      <header className={styles.panelHeader}>
        <div>
          <h2 id="account-list-title">Kassen</h2>
          <p>{cards.length || (cashBox.id ? 1 : 0)} Geldbestände</p>
        </div>
        <button
          type="button"
          className={styles.iconAction}
          aria-label="Karte hinzufügen"
          onClick={onAddCard}
        >
          <Plus aria-hidden="true" />
        </button>
      </header>
      <div className={styles.accountList}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            className={styles.accountRow}
            aria-pressed={!cashSelected && index === activeCardIndex}
            onClick={() => onSelectCard(index)}
          >
            <span className={styles.accountIcon}>
              <CreditCard aria-hidden="true" />
            </span>
            <span className={styles.accountIdentity}>
              <strong>{card.details.accountName}</strong>
              <small>{card.bankName}</small>
            </span>
            <span className={styles.accountAmount}>
              <strong>{euro(card.balance)}</strong>
              <small>
                {card.status.includes("verbunden")
                  ? "Verbunden"
                  : card.status}
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.accountListFooter}>
        <span>Alle Kassen</span>
        <strong>{euro(totalBankBalance(cards) + (!cards.length && cashBox.id ? cashBox.balance : 0))}</strong>
      </div>
    </section>
  );
}

function CardStage({
  cards,
  activeCard,
  activeCardIndex,
  onSwitchCard,
  onEditCard,
  onAddCard,
}: Pick<
  AdaptiveFundsViewProps,
  | "cards"
  | "activeCard"
  | "activeCardIndex"
  | "onSwitchCard"
  | "onEditCard"
  | "onAddCard"
>) {
  const hasMultiple = cards.length > 1;

  return (
    <div className={styles.cardStage}>
      {hasMultiple ? (
        <button
          type="button"
          className={styles.carouselButton}
          aria-label="Vorherige Karte"
          onClick={() => onSwitchCard(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      {activeCard ? (
        <button
          type="button"
          className={styles.cardSlot}
          aria-label={`${activeCard.details.accountName} bearbeiten`}
          onClick={onEditCard}
        >
          <AccountCard
            details={activeCard.details}
            cardColor={activeCard.details.color}
          />
        </button>
      ) : (
        <button
          type="button"
          className={styles.cardSlot}
          aria-label="Karte hinzufügen"
          onClick={onAddCard}
        >
          <AccountCard variant="add" />
        </button>
      )}
      {hasMultiple ? (
        <button
          type="button"
          className={styles.carouselButton}
          aria-label="Nächste Karte"
          onClick={() => onSwitchCard(1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className={styles.cardPosition}>
        <span>
          {cards.length
            ? `Kasse ${activeCardIndex + 1} von ${cards.length}`
            : "Keine Kasse angelegt"}
        </span>
      </div>
    </div>
  );
}

function BankDetail({
  props,
  compact = false,
}: {
  props: AdaptiveFundsViewProps;
  compact?: boolean;
}) {
  const { activeCard, euro } = props;

  if (!activeCard) {
    return (
      <section className={styles.emptyAccount} role="status">
        <WalletCards aria-hidden="true" />
        <h2>Keine Kasse angelegt</h2>
        <p>
          Lege eine Kasse an, um Bestand und Kartendarstellung zu verwalten.
        </p>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={props.onAddCard}
        >
          <Plus aria-hidden="true" /> Kasse hinzufügen
        </button>
      </section>
    );
  }

  return (
    <section
      className={`${styles.bankDetail} ${compact ? styles.bankDetailCompact : ""}`}
    >
      <header className={styles.panelHeader}>
        <div>
          <h2>{activeCard.details.accountName}</h2>
          <p>Kartendarstellung für diese Kasse</p>
        </div>
        <button
          type="button"
          className={styles.iconAction}
          aria-label="Kasse bearbeiten"
          onClick={props.onEditCard}
        >
          <Pencil aria-hidden="true" />
        </button>
      </header>
      <div className={styles.bankDetailBody}>
        <CardStage {...props} />
        <div className={styles.balanceBlock}>
          <span>Verfügbares Guthaben</span>
          <strong>{euro(activeCard.balance)}</strong>
          <small>{activeCard.lastSync}</small>
          <div className={styles.balanceActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={props.onTransfer}
            >
              <ArrowRightLeft aria-hidden="true" /> Umbuchen
            </button>
          </div>
        </div>
      </div>
      {!compact ? (
        <p className={styles.cardPresentationNote}>
          Die Kartendaten dienen ausschließlich der visuellen Darstellung.
        </p>
      ) : null}
    </section>
  );
}

function CashDetail({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, euro } = props;
  return (
    <section className={styles.cashDetail}>
      <header className={styles.panelHeader}>
        <div>
          <h2>{cashBox.name}</h2>
          <p>{cashBox.name}</p>
        </div>
        <Banknote aria-hidden="true" />
      </header>
      <div className={styles.cashHero}>
        <span>Aktueller Bestand</span>
        <strong>{euro(cashBox.balance)}</strong>
      </div>
      <dl className={styles.detailRows}>
        <div>
          <dt>Verantwortlich</dt>
          <dd>{cashBox.responsible}</dd>
        </div>
        <div>
          <dt>Letzte Zählung</dt>
          <dd>{cashBox.lastCountDate}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {cashBox.countStatus === "matched" ? "Abgeglichen" : "Prüfen"}
          </dd>
        </div>
      </dl>
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
    </section>
  );
}

function Reconciliation({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, euro } = props;
  const matched = cashBox.countStatus === "matched";
  return (
    <section className={styles.reconciliation}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Kassenabgleich</h2>
          <p>Abgleich mit dem Buchbestand</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <div
        className={`${styles.reconciliationStatus} ${matched ? styles.positive : styles.negative}`}
      >
        {matched ? (
          <Check aria-hidden="true" />
        ) : (
          <ShieldCheck aria-hidden="true" />
        )}
        <strong>{matched ? "Stimmt" : "Prüfen"}</strong>
      </div>
      <dl className={styles.detailRows}>
        <div>
          <dt>Soll</dt>
          <dd>{euro(cashBox.balance)}</dd>
        </div>
        <div>
          <dt>Ist</dt>
          <dd>{euro(cashBox.balance + cashBox.difference)}</dd>
        </div>
        <div>
          <dt>Differenz</dt>
          <dd className={matched ? styles.positive : styles.negative}>
            {euro(cashBox.difference)}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={props.onCountCash}
      >
        Neuen Abgleich durchführen
      </button>
    </section>
  );
}

function ActivityPanel({
  props,
  limit = 5,
}: {
  props: AdaptiveFundsViewProps;
  limit?: number;
}) {
  return (
    <section className={styles.activityPanel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Letzte Aktivitäten</h2>
          <p>Bewegungen und Kassenprüfungen</p>
        </div>
        <Activity aria-hidden="true" />
      </header>
      <div className={styles.activityHeader} aria-hidden="true">
        <span>Datum</span>
        <span>Typ</span>
        <span>Beschreibung</span>
        <span>Benutzer</span>
        <span>Betrag</span>
      </div>
      <div className={styles.activityRows}>
        {props.activities.slice(0, limit).map((item) => (
          <div
            className={styles.activityRow}
            key={`${item.date}-${item.description}`}
          >
            <span>{item.date}</span>
            <span>{item.type}</span>
            <strong>{item.description}</strong>
            <span>{item.user}</span>
            <b
              className={item.amount >= 0 ? styles.positive : styles.negative}
            >
              {item.amount >= 0 ? "+" : ""}
              {props.euro(item.amount)}
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditPanel({ props }: { props: AdaptiveFundsViewProps }) {
  return (
    <section className={styles.auditPanel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Prüfprotokoll</h2>
          <p>Dokumentierte Kassenabschlüsse</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <div className={styles.auditRows}>
        {props.auditLogs.map((entry) => (
          <div className={styles.auditRow} key={entry.id}>
            <span>
              <strong>{entry.note ?? "Kassenprüfung"}</strong>
              <small>
                {entry.date}, {entry.auditor}
              </small>
            </span>
            <span>
              <small>Zählbetrag</small>
              <strong>{props.euro(entry.countedAmount)}</strong>
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
      </div>
    </section>
  );
}

function AccessPanel({ props }: { props: AdaptiveFundsViewProps }) {
  return (
    <aside className={styles.accessPanel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Zugriff</h2>
          <p>Prüfberechtigte Personen</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <dl className={styles.detailRows}>
        <div>
          <dt>Kassenwart</dt>
          <dd>Max Müller</dd>
        </div>
        <div>
          <dt>Vertretung</dt>
          <dd>Lisa Schmidt</dd>
        </div>
        <div>
          <dt>Letzte Prüfung</dt>
          <dd>{props.cashBox.lastCountDate}</dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={props.onCountCash}
      >
        Prüfung starten
      </button>
    </aside>
  );
}

function DesktopFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  const [cashSelected, setCashSelected] = useState(false);

  function selectCard(index: number) {
    setCashSelected(false);
    props.onSelectCard(index);
  }

  return (
    <div className={`${styles.root} ${styles.desktopRoot}`}>
      <SummaryRail
        cards={props.cards}
        cashBox={props.cashBox}
        euro={props.euro}
      />
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.desktopOverview}
          role="tabpanel"
          aria-label="Übersicht"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
            onSelectCash={() => setCashSelected(true)}
          />
          <div className={styles.desktopPrimaryDetail}>
            {cashSelected ? (
              <CashDetail props={props} />
            ) : (
              <BankDetail props={props} compact />
            )}
          </div>
          <Reconciliation props={props} />
          <ActivityPanel props={props} />
        </div>
      ) : section === "accounts" ? (
        <div
          className={styles.desktopAccounts}
          role="tabpanel"
          aria-label="Kassen"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
            onSelectCash={() => setCashSelected(true)}
          />
          {cashSelected ? (
            <CashDetail props={props} />
          ) : (
            <BankDetail props={props} />
          )}
        </div>
      ) : (
        <div
          className={styles.desktopAudit}
          role="tabpanel"
          aria-label="Prüfung"
        >
          <AuditPanel props={props} />
          <AccessPanel props={props} />
        </div>
      )}
    </div>
  );
}

function TabletAccountSelector({
  props,
  cashSelected,
  onSelectCard,
  onSelectCash,
}: {
  props: AdaptiveFundsViewProps;
  cashSelected: boolean;
  onSelectCard: (index: number) => void;
  onSelectCash: () => void;
}) {
  return (
    <div
      className={styles.tabletAccountSelector}
      aria-label="Kassen auswählen"
    >
      {props.cards.map((card, index) => (
        <button
          key={card.id}
          type="button"
          aria-pressed={!cashSelected && index === props.activeCardIndex}
          onClick={() => onSelectCard(index)}
        >
          <CreditCard aria-hidden="true" />
          <span>
            <strong>{card.details.accountName}</strong>
            <small>{props.euro(card.balance)}</small>
          </span>
        </button>
      ))}
      {props.cashBox.id && !props.cards.length ? <button
        type="button"
        aria-pressed={cashSelected}
        onClick={onSelectCash}
      >
        <Banknote aria-hidden="true" />
        <span>
          <strong>{props.cashBox.name}</strong>
          <small>{props.euro(props.cashBox.balance)}</small>
        </span>
      </button> : null}
      <button
        type="button"
        className={styles.addAccountButton}
        onClick={props.onAddCard}
      >
        <Plus aria-hidden="true" /> <span>Kasse</span>
      </button>
    </div>
  );
}

function TabletFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  const [cashSelected, setCashSelected] = useState(false);

  function selectCard(index: number) {
    setCashSelected(false);
    props.onSelectCard(index);
  }

  return (
    <div className={`${styles.root} ${styles.tabletRoot}`}>
      <SummaryRail
        cards={props.cards}
        cashBox={props.cashBox}
        euro={props.euro}
      />
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.tabletOverview}
          role="tabpanel"
          aria-label="Übersicht"
        >
          <TabletAccountSelector
            props={props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
            onSelectCash={() => setCashSelected(true)}
          />
          <div className={styles.tabletPrimaryDetail}>
            {cashSelected ? (
              <CashDetail props={props} />
            ) : (
              <BankDetail props={props} compact />
            )}
          </div>
          <Reconciliation props={props} />
          <ActivityPanel props={props} limit={2} />
        </div>
      ) : section === "accounts" ? (
        <div
          className={styles.tabletAccounts}
          role="tabpanel"
          aria-label="Kassen"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
            onSelectCash={() => setCashSelected(true)}
          />
          {cashSelected ? (
            <CashDetail props={props} />
          ) : (
            <BankDetail props={props} />
          )}
        </div>
      ) : (
        <div
          className={styles.tabletAudit}
          role="tabpanel"
          aria-label="Prüfung"
        >
          <AuditPanel props={props} />
          <AccessPanel props={props} />
        </div>
      )}
    </div>
  );
}

function PhoneAccountCard(props: AdaptiveFundsViewProps) {
  return (
    <section className={styles.phoneAccountCard}>
      <CardStage {...props} />
      {props.activeCard ? (
        <div className={styles.phoneAccountSummary}>
          <span>
            <strong>{props.activeCard.details.accountName}</strong>
            <small>Kartendarstellung</small>
          </span>
          <b>{props.euro(props.activeCard.balance)}</b>
        </div>
      ) : null}
    </section>
  );
}

function PhoneRows({ props }: { props: AdaptiveFundsViewProps }) {
  return (
    <div className={styles.phoneActivityRows}>
      {props.activities.slice(0, 3).map((item) => (
        <div key={`${item.date}-${item.description}`}>
          <span>
            <strong>{item.description}</strong>
            <small>{item.date}</small>
          </span>
          <b className={item.amount >= 0 ? styles.positive : styles.negative}>
            {item.amount >= 0 ? "+" : ""}
            {props.euro(item.amount)}
          </b>
        </div>
      ))}
    </div>
  );
}

function PhoneFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  const bankBalance = totalBankBalance(props.cards);
  const hasCashBox = Boolean(props.cashBox.id);

  return (
    <div className={`${styles.root} ${styles.phoneRoot}`}>
      <section className={styles.phoneBalanceHero} aria-label="Gesamtguthaben">
        <span>Gesamt verfügbar</span>
        <strong>{props.euro(bankBalance + props.cashBox.balance)}</strong>
        <div>
          {hasCashBox ? <span>{props.euro(props.cashBox.balance)} Kasse</span> : <span>Keine Kasse angelegt</span>}
        </div>
      </section>
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.phonePanel}
          role="tabpanel"
          aria-label="Übersicht"
        >
          <PhoneAccountCard {...props} />
          <div className={styles.phoneActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={props.onTransfer}
            >
              <ArrowRightLeft aria-hidden="true" /> Umbuchen
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={props.onCountCash}
            >
              <Banknote aria-hidden="true" /> Zählen
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={props.onAddCard}
            >
              <Plus aria-hidden="true" /> Karte
            </button>
          </div>
          {hasCashBox ? <section className={styles.phoneSection}>
            <header>
              <h2>{props.cashBox.name}</h2>
              <b>{props.euro(props.cashBox.balance)}</b>
            </header>
            <button
              type="button"
              className={styles.phoneStatusRow}
              onClick={props.onCountCash}
            >
              <span>
                <strong>Kassenabgleich</strong>
                <small>Gezählt am {props.cashBox.lastCountDate}</small>
              </span>
              <b
                className={
                  props.cashBox.countStatus === "matched"
                    ? styles.positive
                    : styles.negative
                }
              >
                {props.cashBox.countStatus === "matched" ? "Stimmt" : "Prüfen"}
              </b>
            </button>
          </section> : null}
          <section className={styles.phoneSection}>
            <header>
              <h2>Letzte Aktivitäten</h2>
            </header>
            <PhoneRows props={props} />
          </section>
        </div>
      ) : section === "accounts" ? (
        <section
          className={styles.phoneSection}
          role="tabpanel"
          aria-label="Kassen"
        >
          <header>
            <h2>Kassen</h2>
            <button
              type="button"
              aria-label="Kasse hinzufügen"
              onClick={props.onAddCard}
            >
              <Plus aria-hidden="true" />
            </button>
          </header>
          <div className={styles.phoneAccountRows}>
            {props.cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                aria-pressed={index === props.activeCardIndex}
                onClick={() => props.onSelectCard(index)}
              >
                <CreditCard aria-hidden="true" />
                <span>
                  <strong>{card.details.accountName}</strong>
                  <small>{card.bankName}</small>
                </span>
                <b>{props.euro(card.balance)}</b>
              </button>
            ))}
          </div>
          {props.activeCard ? (
            <dl className={styles.phoneBankDetails}>
              <div>
                <dt>Darstellung</dt>
                <dd>Kassenkarte</dd>
              </div>
              <div>
                <dt>Bestand</dt>
                <dd>{props.euro(props.activeCard.balance)}</dd>
              </div>
              <div>
                <dt>Verwaltung</dt>
                <dd>Ledger-basiert</dd>
              </div>
              <div className={styles.phoneDetailActions}>
                <button type="button" onClick={props.onEditCard}>
                  <Pencil aria-hidden="true" /> Bearbeiten
                </button>
              </div>
            </dl>
          ) : null}
        </section>
      ) : (
        <section
          className={styles.phoneSection}
          role="tabpanel"
          aria-label="Prüfung"
        >
          <header>
            <h2>Prüfprotokoll</h2>
            <b>{props.auditLogs.length}</b>
          </header>
          <div className={styles.phoneAuditRows}>
            {props.auditLogs.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={props.onCountCash}
              >
                <ShieldCheck aria-hidden="true" />
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
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function AdaptiveFundsView(props: AdaptiveFundsViewProps) {
  if (props.mode === "desktop") return <DesktopFunds {...props} />;
  if (props.mode === "tablet") return <TabletFunds {...props} />;
  return <PhoneFunds {...props} />;
}
