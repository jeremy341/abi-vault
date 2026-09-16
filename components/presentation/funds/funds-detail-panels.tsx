"use client";

import { Activity, Banknote, Check, Pencil, Plus, ShieldCheck, WalletCards } from "lucide-react";
import { CardStage, PanelLoading } from "./funds-controls";
import type { AdaptiveFundsViewProps } from "./funds-types";
import styles from "@/app/dashboard/funds/funds-adaptive.module.css";

export function BankDetail({
  props,
  compact = false,
}: {
  props: AdaptiveFundsViewProps;
  compact?: boolean;
}) {
  const { activeCard, dollar } = props;

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
        <h2>No cash register created</h2>
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
          <strong>{dollar(activeCard.balance)}</strong>
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

export function CashDetail({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, dollar } = props;

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
        <strong>{dollar(cashBox.balance)}</strong>
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
            {cashBox.lastCountDate ? cashBox.countStatus === "matched" ? "Matches" : "Review" : "Not reviewed yet"}
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

export function Reconciliation({ props }: { props: AdaptiveFundsViewProps }) {
  const { cashBox, dollar } = props;

  if (props.loading) {
    return (
      <section className={styles.reconciliation}>
        <header className={styles.panelHeader}>
          <div>
            <h2>Cash register reconciliation</h2>
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
          <h2>Cash register reconciliation</h2>
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
        <strong>{!hasCashBox ? "No cash register" : !hasCount ? "Not reviewed yet" : matched ? "Matches" : "Review"}</strong>
      </div>
      <dl className={styles.detailRows}>
        <div>
          <dt>Soll</dt>
          <dd>{hasCashBox ? dollar(cashBox.balance) : "—"}</dd>
        </div>
        <div>
          <dt>Ist</dt>
          <dd>{hasCashBox ? dollar(cashBox.balance + cashBox.difference) : "—"}</dd>
        </div>
        <div>
          <dt>Difference</dt>
          <dd className={matched ? styles.positive : hasCashBox && hasCount ? styles.negative : ""}>
            {hasCashBox && hasCount ? dollar(cashBox.difference) : "—"}
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

export function ActivityPanel({
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
              {props.dollar(item.amount)}
            </b>
          </div>
        )) : <p className={styles.panelEmpty}>No activity available.</p>}
      </div>
    </section>
  );
}

export function AuditPanel({ props }: { props: AdaptiveFundsViewProps }) {
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
              <strong>{props.dollar(entry.countedAmount)}</strong>
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
          </div>
        )) : <p className={styles.panelEmpty}>No cash counts recorded yet.</p>}
      </div>
    </section>
  );
}

export function AccessPanel({ props }: { props: AdaptiveFundsViewProps }) {
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
          <dt>Last review</dt>
          <dd>{props.cashBox.lastCountDate}</dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={props.onCountCash}
      >
        Start review
      </button>
    </aside>
  );
}


