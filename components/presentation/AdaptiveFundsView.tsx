"use client";

import { type KeyboardEvent, useState } from "react";
import {
  Activity,
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
import { InlineLoading } from "@/components/ui/loading-state";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

type FundsCard = {
  id: string;
  details: Pick<AccountCardDetails, "accountName"> & Partial<Omit<AccountCardDetails, "accountName">>;
  balance: number;
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
  loading: boolean;
  error: string | null;
  onRetry: () => void;
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
};

function PanelLoading({ label }: { label: string }) {
  return (
    <div className={styles.panelLoading} aria-busy="true">
      <InlineLoading label={label} />
    </div>
  );
}

function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.panelError} role="alert">
      <span>{message}</span>
      <button type="button" className={styles.secondaryAction} onClick={onRetry}>
        Erneut laden
      </button>
    </div>
  );
}

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
    { value: "overview", label: "Overview" },
    { value: "accounts", label: "Cash registers" },
    { value: "audit", label: "Review" },
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
          id={`funds-tab-${tab.value}`}
          aria-selected={active === tab.value}
          aria-controls={`funds-panel-${tab.value}`}
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
  loading,
}: Pick<AdaptiveFundsViewProps, "cards" | "cashBox" | "euro" | "loading">) {
  const bankBalance = totalBankBalance(cards);
  const hasCashBox = Boolean(cashBox.id);
  const total = bankBalance + (hasCashBox && !cards.length ? cashBox.balance : 0);
  const matched = hasCashBox && cashBox.countStatus === "matched";

  return (
    <section className={styles.summaryRail} aria-label="Financial overview">
      <div>
        <span>Total available</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : euro(total)}</strong>
        <small>{loading ? "Cash registers are loading…" : `${cards.length} Cash registers insgesamt`}</small>
      </div>
      <div>
        <span>cash balance</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : euro(bankBalance)}</strong>
        <small>{loading ? "Balance is loading…" : cards.length ? "All active cash registers" : "No cash registers created"}</small>
      </div>
      <div>
        <span>Selected cash register</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : hasCashBox ? euro(cashBox.balance) : "No Cash register"}</strong>
        <small>{loading ? "Cash register is loading…" : hasCashBox && cashBox.lastCountDate ? `Counted on ${cashBox.lastCountDate}` : "Not reviewed yet"}</small>
      </div>
      <div>
        <span>Cash registersstatus</span>
        <strong className={hasCashBox && matched ? styles.positive : hasCashBox ? styles.negative : ""}>
          {loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : !hasCashBox ? "No Cash register" : !cashBox.lastCountDate ? "Not reviewed yet" : matched ? "Stimmt" : "Review"}
        </strong>
        <small>
          {loading ? "Status is loading…" : !hasCashBox ? "Create a cash register" : !cashBox.lastCountDate ? "No count yet" : matched
            ? "No Differenz festgestellt"
            : `${euro(cashBox.difference)} Differenz`}
        </small>
      </div>
    </section>
  );
}

function AccountList({
  cards,
  activeCardIndex,
  cashSelected,
  euro,
  onSelectCard,
  onAddCard,
  loading,
  error,
  onRetry,
}: Pick<
  AdaptiveFundsViewProps,
  | "cards"
  | "activeCardIndex"
  | "euro"
  | "onSelectCard"
  | "onAddCard"
  | "loading"
  | "error"
  | "onRetry"
> & {
  cashSelected: boolean;
}) {
  return (
    <section
      className={styles.accountListPanel}
      aria-labelledby="account-list-title"
    >
      <header className={styles.panelHeader}>
        <div>
          <h2 id="account-list-title">Cash registers</h2>
          <p>{loading ? "Cash registers are loading…" : `${cards.length} cash balances`}</p>
        </div>
        <button
          type="button"
          className={styles.iconAction}
          aria-label="Add cash register"
          onClick={onAddCard}
          disabled={loading || Boolean(error)}
        >
          <Plus aria-hidden="true" />
        </button>
      </header>
      <div className={styles.accountList}>
        {error ? <PanelError message={error} onRetry={onRetry} /> : loading ? <PanelLoading label="" /> : cards.length ? cards.map((card, index) => (
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
            <small>Cash registerskarte</small>
            </span>
            <span className={styles.accountAmount}>
              <strong>{euro(card.balance)}</strong>
              <small>
                Ledger-basiert
              </small>
            </span>
          </button>
        )) : <p className={styles.panelEmpty}>Noch keine Cash registers angelegt.</p>}
      </div>
      <div className={styles.accountListFooter}>
        <span>All Cash registers</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : euro(totalBankBalance(cards))}</strong>
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
  loading,
}: Pick<
  AdaptiveFundsViewProps,
  | "cards"
  | "activeCard"
  | "activeCardIndex"
  | "onSwitchCard"
  | "onEditCard"
  | "onAddCard"
  | "loading"
>) {
  const hasMultiple = cards.length > 1;

  if (loading) {
    return (
      <div className={styles.cardStage} aria-busy="true">
        <span aria-hidden="true" />
        <div className={styles.cardSlot}>
          <PanelLoading label="" />
        </div>
        <span aria-hidden="true" />
        <div className={styles.cardPosition} aria-hidden="true" />
      </div>
    );
  }

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
          aria-label={`${activeCard.details.accountName} edit`}
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
          aria-label="Add cash register"
          onClick={onAddCard}
        >
          <AccountCard variant="add" />
        </button>
      )}
      {hasMultiple ? (
        <button
          type="button"
          className={styles.carouselButton}
          aria-label="Next card"
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
            ? `Cash register ${activeCardIndex + 1} of ${cards.length}`
            : "No Cash register angelegt"}
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

  if (props.loading) {
    return (
      <section className={`${styles.bankDetail} ${compact ? styles.bankDetailCompact : ""}`}>
        <header className={styles.panelHeader}>
          <div>
            <h2>Cash register</h2>
            <p>Cash register data is loading…</p>
          </div>
          <WalletCards aria-hidden="true" />
        </header>
        <PanelLoading label="" />
      </section>
    );
  }

  if (!activeCard) {
    return (
      <section className={styles.emptyAccount} role="status">
        <WalletCards aria-hidden="true" />
        <h2>No Cash register angelegt</h2>
        <p>
          Create a cash register to manage the balance and card view.
        </p>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={props.onAddCard}
        >
          <Plus aria-hidden="true" /> Add cash register
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
          <p>Card view for this cash register</p>
        </div>
        <button
          type="button"
          className={styles.iconAction}
          aria-label="Edit cash register"
          onClick={props.onEditCard}
        >
          <Pencil aria-hidden="true" />
        </button>
      </header>
      <div className={styles.bankDetailBody}>
        <CardStage {...props} />
        <div className={styles.balanceBlock}>
          <span>Available balance</span>
          <strong>{euro(activeCard.balance)}</strong>
          <small>Ledger-basiert</small>
        </div>
      </div>
      {!compact ? (
        <p className={styles.cardPresentationNote}>
          Card details are for visual presentation only.
        </p>
      ) : null}
    </section>
  );
}

function CashDetail({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, euro } = props;
  if (props.loading) {
    return (
      <section className={styles.cashDetail}>
        <header className={styles.panelHeader}>
          <div>
            <h2>Cash register</h2>
            <p>Cash register data is loading…</p>
          </div>
          <Banknote aria-hidden="true" />
        </header>
        <PanelLoading label="" />
      </section>
    );
  }

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
        <span>Current balance</span>
        <strong>{euro(cashBox.balance)}</strong>
      </div>
      <dl className={styles.detailRows}>
        <div>
          <dt>Verantwortlich</dt>
          <dd>{cashBox.responsible}</dd>
        </div>
        <div>
          <dt>Last count</dt>
          <dd>{cashBox.lastCountDate || "No count yet"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {cashBox.lastCountDate ? cashBox.countStatus === "matched" ? "Abgeglichen" : "Review" : "Not reviewed yet"}
          </dd>
        </div>
      </dl>
      <div className={styles.panelActions}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={props.onCountCash}
        >
          <Banknote aria-hidden="true" /> Count cash register
        </button>
      </div>
    </section>
  );
}

function Reconciliation({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, euro } = props;
  if (props.loading) {
    return (
      <section className={styles.reconciliation}>
        <header className={styles.panelHeader}>
          <div>
            <h2>Cash registersabgleich</h2>
            <p>Reconcile with the book balance</p>
          </div>
          <ShieldCheck aria-hidden="true" />
        </header>
        <PanelLoading label="" />
      </section>
    );
  }

  const hasCashBox = Boolean(cashBox.id);
  const hasCount = Boolean(cashBox.lastCountDate);
  const matched = hasCashBox && hasCount && cashBox.countStatus === "matched";
  return (
    <section className={styles.reconciliation}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Cash registersabgleich</h2>
          <p>Reconcile with the book balance</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <div
        className={`${styles.reconciliationStatus} ${matched ? styles.positive : hasCashBox && hasCount ? styles.negative : ""}`}
      >
        {matched ? (
          <Check aria-hidden="true" />
        ) : (
          <ShieldCheck aria-hidden="true" />
        )}
        <strong>{!hasCashBox ? "No Cash register" : !hasCount ? "Not reviewed yet" : matched ? "Stimmt" : "Review"}</strong>
      </div>
      <dl className={styles.detailRows}>
        <div>
          <dt>Soll</dt>
          <dd>{hasCashBox ? euro(cashBox.balance) : "—"}</dd>
        </div>
        <div>
          <dt>Ist</dt>
          <dd>{hasCashBox ? euro(cashBox.balance + cashBox.difference) : "—"}</dd>
        </div>
        <div>
          <dt>Differenz</dt>
          <dd className={matched ? styles.positive : hasCashBox && hasCount ? styles.negative : ""}>
            {hasCashBox && hasCount ? euro(cashBox.difference) : "—"}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={props.onCountCash}
        disabled={!hasCashBox}
      >
        Perform new reconciliation
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
          <h2>Recent activity</h2>
          <p>Movements and cash counts</p>
        </div>
        <Activity aria-hidden="true" />
      </header>
      <div className={styles.activityHeader} aria-hidden="true">
        <span>Date</span>
        <span>Typ</span>
        <span>Beschreibung</span>
        <span>User</span>
        <span>Amount</span>
      </div>
      <div className={styles.activityRows}>
        {props.activities.length ? props.activities.slice(0, limit).map((item) => (
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
        )) : <p className={styles.panelEmpty}>No activity available.</p>}
      </div>
    </section>
  );
}

function AuditPanel({ props }: { props: AdaptiveFundsViewProps }) {
  return (
    <section className={styles.auditPanel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>Review log</h2>
          <p>Dokumentierte cash closures</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <div className={styles.auditRows}>
        {props.auditLogs.length ? props.auditLogs.map((entry) => (
          <div className={styles.auditRow} key={entry.id}>
            <span>
              <strong>{entry.note ?? "Cash count"}</strong>
              <small>
                {entry.date}, {entry.auditor}
              </small>
            </span>
            <span>
              <small>Counted onount</small>
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
        )) : <p className={styles.panelEmpty}>Noch keine Cash counts vorhanden.</p>}
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
          <p>People authorized to review</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </header>
      <dl className={styles.detailRows}>
        <div>
          <dt>Verantwortlich</dt>
          <dd>{props.cashBox.responsible || "Not set yet"}</dd>
        </div>
        <div>
          <dt>Vertretung</dt>
          <dd>No responsible person set</dd>
        </div>
        <div>
          <dt>Letzte Review</dt>
          <dd>{props.cashBox.lastCountDate}</dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={props.onCountCash}
      >
        Review starten
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
        loading={props.loading}
      />
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.desktopOverview}
          role="tabpanel"
          id="funds-panel-overview"
          aria-labelledby="funds-tab-overview"
          aria-label="Overview"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
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
          id="funds-panel-accounts"
          aria-labelledby="funds-tab-accounts"
          aria-label="Cash registers"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
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
          id="funds-panel-audit"
          aria-labelledby="funds-tab-audit"
          aria-label="Review"
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
  onSelectCard,
}: {
  props: AdaptiveFundsViewProps;
  onSelectCard: (index: number) => void;
}) {
  return (
    <div
      className={styles.tabletAccountSelector}
      aria-label="Select cash registers"
    >
      {props.cards.map((card, index) => (
        <button
          key={card.id}
          type="button"
          aria-pressed={index === props.activeCardIndex}
          onClick={() => onSelectCard(index)}
        >
          <CreditCard aria-hidden="true" />
          <span>
            <strong>{card.details.accountName}</strong>
            <small>{props.euro(card.balance)}</small>
          </span>
        </button>
      ))}
      <button
        type="button"
        className={styles.addAccountButton}
        onClick={props.onAddCard}
        disabled={props.loading || Boolean(props.error)}
      >
        <Plus aria-hidden="true" /> <span>Cash register</span>
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
        loading={props.loading}
      />
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.tabletOverview}
          role="tabpanel"
          id="funds-panel-overview"
          aria-labelledby="funds-tab-overview"
          aria-label="Overview"
        >
          <TabletAccountSelector
            props={props}
            onSelectCard={selectCard}
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
          id="funds-panel-accounts"
          aria-labelledby="funds-tab-accounts"
          aria-label="Cash registers"
        >
          <AccountList
            {...props}
            cashSelected={cashSelected}
            onSelectCard={selectCard}
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
          id="funds-panel-audit"
          aria-labelledby="funds-tab-audit"
          aria-label="Review"
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
      {props.error ? <PanelError message={props.error} onRetry={props.onRetry} /> : <CardStage {...props} />}
      {props.activeCard ? (
        <div className={styles.phoneAccountSummary}>
          <span>
            <strong>{props.activeCard.details.accountName}</strong>
            <small>Card display</small>
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
      {props.activities.length ? props.activities.slice(0, 3).map((item) => (
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
      )) : <p className={styles.panelEmpty}>No activity available.</p>}
    </div>
  );
}

function PhoneFunds(props: AdaptiveFundsViewProps) {
  const [section, setSection] = useState<FundsSection>("overview");
  const bankBalance = totalBankBalance(props.cards);
  const hasCashBox = Boolean(props.cashBox.id);
  const totalBalance = bankBalance + (hasCashBox && !props.cards.length ? props.cashBox.balance : 0);

  return (
    <div className={`${styles.root} ${styles.phoneRoot}`}>
      <section className={styles.phoneBalanceHero} aria-label="Gesamtguthaben">
        <span>Total available</span>
        <strong>{props.loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : props.euro(totalBalance)}</strong>
        <div>
          {props.loading ? <span>Cash registers are loading…</span> : hasCashBox ? <span>{props.euro(props.cashBox.balance)} Cash register</span> : <span>No Cash register angelegt</span>}
        </div>
      </section>
      <FundsTabs active={section} onChange={setSection} />
      {section === "overview" ? (
        <div
          className={styles.phonePanel}
          role="tabpanel"
          id="funds-panel-overview"
          aria-labelledby="funds-tab-overview"
          aria-label="Overview"
        >
          <PhoneAccountCard {...props} />
          <div className={styles.phoneActions}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={props.onCountCash}
              disabled={!hasCashBox || props.loading}
            >
              <Banknote aria-hidden="true" /> Count
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              aria-label="Add cash register"
              onClick={props.onAddCard}
              disabled={props.loading || Boolean(props.error)}
            >
              <Plus aria-hidden="true" /> Add
            </button>
          </div>
          {hasCashBox ? <section className={styles.phoneSection}>
            <header>
              <h2>Cash registersstatus</h2>
              <b>{props.euro(props.cashBox.balance)}</b>
            </header>
            <button
              type="button"
              className={styles.phoneStatusRow}
              onClick={props.onCountCash}
            >
              <span>
                <strong>Cash registersabgleich</strong>
                <small>{props.cashBox.lastCountDate ? `Counted on ${props.cashBox.lastCountDate}` : "No count yet"}</small>
              </span>
              <b
                className={
                  !props.cashBox.lastCountDate
                    ? styles.statusPending
                    : props.cashBox.countStatus === "matched"
                    ? styles.positive
                    : styles.negative
                }
              >
                {!props.cashBox.lastCountDate ? "Ausstehend" : props.cashBox.countStatus === "matched" ? "Stimmt" : "Review"}
              </b>
            </button>
          </section> : null}
          <section className={styles.phoneSection}>
            <header>
              <h2>Recent activity</h2>
            </header>
            <PhoneRows props={props} />
          </section>
        </div>
      ) : section === "accounts" ? (
        <section
          className={styles.phoneSection}
          role="tabpanel"
          id="funds-panel-accounts"
          aria-labelledby="funds-tab-accounts"
          aria-label="Cash registers"
        >
          <header>
            <h2>Cash registers</h2>
            <button
              type="button"
              aria-label="Add cash register"
              onClick={props.onAddCard}
              disabled={props.loading || Boolean(props.error)}
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
                  <small>Cash registerskarte</small>
                </span>
                <b>{props.euro(card.balance)}</b>
              </button>
            ))}
          </div>
          {props.activeCard ? (
            <dl className={styles.phoneBankDetails}>
              <div>
                <dt>Darstellung</dt>
                <dd>Cash registerskarte</dd>
              </div>
              <div>
                <dt>Balance</dt>
                <dd>{props.euro(props.activeCard.balance)}</dd>
              </div>
              <div>
                <dt>Administration</dt>
                <dd>Ledger-basiert</dd>
              </div>
              <div className={styles.phoneDetailActions}>
                <button type="button" onClick={props.onEditCard}>
                  <Pencil aria-hidden="true" /> Edit
                </button>
              </div>
            </dl>
          ) : null}
        </section>
      ) : (
        <section
          className={styles.phoneSection}
          role="tabpanel"
          id="funds-panel-audit"
          aria-labelledby="funds-tab-audit"
          aria-label="Review"
        >
          <header>
            <h2>Review log</h2>
            <b>{props.auditLogs.length}</b>
          </header>
          <div className={styles.phoneAuditRows}>
            {props.auditLogs.length ? props.auditLogs.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={props.onCountCash}
              >
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>{entry.note ?? "Cash count"}</strong>
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
            )) : (
              <div className={styles.auditEmpty}>
                <p>Noch keine Cash counts vorhanden.</p>
                {props.cashBox.id ? <button type="button" className={styles.secondaryAction} onClick={props.onCountCash}>Count cash register</button> : null}
              </div>
            )}
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
