"use client";

import { useState } from "react";
import { type AdaptiveFundsViewProps, type FundsSection, FundsTabs, SummaryRail, AccountList, BankDetail, CashDetail, Reconciliation, ActivityPanel, AuditPanel, AccessPanel } from "./funds-shared";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

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
        dollar={props.dollar}
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


export default DesktopFunds;
