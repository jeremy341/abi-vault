"use client";

import { type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Pencil, Plus } from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import { InlineLoading } from "@/components/ui/loading-state";
import type { AdaptiveFundsViewProps, FundsCard, FundsSection } from "./funds-types";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

export function PanelLoading({ label }: { label: string }) {
  return (
    <div className={styles.panelLoading} aria-busy="true">
      <InlineLoading label={label} />
    </div>
  );
}

export function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.panelError} role="alert">
      <span>{message}</span>
      <button type="button" className={styles.secondaryAction} onClick={onRetry}>
        Erneut laden
      </button>
    </div>
  );
}

export function totalBankBalance(cards: FundsCard[]) {
  return cards.reduce((total, card) => total + card.balance, 0);
}

export function FundsTabs({
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

export function SummaryRail({
  cards,
  cashBox,
  dollar,
  loading,
}: Pick<AdaptiveFundsViewProps, "cards" | "cashBox" | "dollar" | "loading">) {
  const bankBalance = totalBankBalance(cards);
  const hasCashBox = Boolean(cashBox.id);
  const total = bankBalance + (hasCashBox && !cards.length ? cashBox.balance : 0);
  const matched = hasCashBox && cashBox.countStatus === "matched";

  return (
    <section className={styles.summaryRail} aria-label="Financial overview">
      <div>
        <span>Total available</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : dollar(total)}</strong>
        <small>{loading ? "Cash registers are loading…" : `${cards.length} cash registers total`}</small>
      </div>
      <div>
        <span>cash balance</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : dollar(bankBalance)}</strong>
        <small>{loading ? "Balance is loading…" : cards.length ? "All active cash registers" : "No cash registers created"}</small>
      </div>
      <div>
        <span>Selected cash register</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : hasCashBox ? dollar(cashBox.balance) : "No cash register"}</strong>
        <small>{loading ? "Cash register is loading…" : hasCashBox && cashBox.lastCountDate ? `Counted on ${cashBox.lastCountDate}` : "Not reviewed yet"}</small>
      </div>
      <div>
        <span>Cash register status</span>
        <strong className={hasCashBox && matched ? styles.positive : hasCashBox ? styles.negative : ""}>
          {loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : !hasCashBox ? "No cash register" : !cashBox.lastCountDate ? "Not reviewed yet" : matched ? "Matches" : "Review"}
        </strong>
        <small>
          {loading ? "Status is loading…" : !hasCashBox ? "Create a cash register" : !cashBox.lastCountDate ? "No count yet" : matched
            ? "No Difference festgestellt"
            : `${dollar(cashBox.difference)} Difference`}
        </small>
      </div>
    </section>
  );
}

export function AccountList({
  cards,
  activeCardIndex,
  cashSelected,
  dollar,
  onSelectCard,
  onAddCard,
  loading,
  error,
  onRetry,
}: Pick<
  AdaptiveFundsViewProps,
  | "cards"
  | "activeCardIndex"
  | "dollar"
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
            <small>Cash register card</small>
            </span>
            <span className={styles.accountAmount}>
              <strong>{dollar(card.balance)}</strong>
              <small>
                Ledger-basiert
              </small>
            </span>
          </button>
        )) : <p className={styles.panelEmpty}>No cash registers created yet.</p>}
      </div>
      <div className={styles.accountListFooter}>
        <span>All Cash registers</span>
        <strong>{loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : dollar(totalBankBalance(cards))}</strong>
      </div>
    </section>
  );
}

export function CardStage({
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
            : "No cash register created"}
        </span>
      </div>
    </div>
  );
}

