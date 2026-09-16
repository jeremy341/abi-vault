"use client";

import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { type AdaptiveFundsViewProps, type FundsSection, FundsTabs, SummaryRail, AccountList, BankDetail, CashDetail, Reconciliation, ActivityPanel, AuditPanel, AccessPanel } from "./funds-shared";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

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
            <small>{props.dollar(card.balance)}</small>
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
        dollar={props.dollar}
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


export default TabletFunds;
