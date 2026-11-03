"use client";

import { useState } from "react";
import { Banknote, CreditCard, Pencil, Plus, ShieldCheck } from "lucide-react";
import { InlineLoading } from "@/components/ui/loading-state";
import { type AdaptiveFundsViewProps, type FundsSection, PanelError, totalBankBalance, FundsTabs, CardStage } from "./funds-shared";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

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
          <b>{props.dollar(props.activeCard.balance)}</b>
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
            {props.dollar(item.amount)}
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
        <strong>{props.loading ? <InlineLoading label="" className={styles.compactInlineLoading} /> : props.dollar(totalBalance)}</strong>
        <div>
          {props.loading ? <span>Cash registers are loading…</span> : hasCashBox ? <span>{props.dollar(props.cashBox.balance)} Cash register</span> : <span>No cash register created</span>}
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
              <h2>Cash register status</h2>
              <b>{props.dollar(props.cashBox.balance)}</b>
            </header>
            <button
              type="button"
              className={styles.phoneStatusRow}
              onClick={props.onCountCash}
            >
              <span>
                <strong>Cash register reconciliation</strong>
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
                {!props.cashBox.lastCountDate ? "Pending" : props.cashBox.countStatus === "matched" ? "Matches" : "Review"}
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
                  <small>Cash register card</small>
                </span>
                <b>{props.dollar(card.balance)}</b>
              </button>
            ))}
          </div>
          {props.activeCard ? (
            <dl className={styles.phoneBankDetails}>
              <div>
                <dt>Darstellung</dt>
                  <dd>Cash register card</dd>
              </div>
              <div>
                <dt>Balance</dt>
                <dd>{props.dollar(props.activeCard.balance)}</dd>
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
                  {props.dollar(entry.difference)}
                </b>
              </button>
            )) : (
              <div className={styles.auditEmpty}>
                <p>No cash counts recorded yet.</p>
                {props.cashBox.id ? <button type="button" className={styles.secondaryAction} onClick={props.onCountCash}>Count cash register</button> : null}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}


export default PhoneFunds;
