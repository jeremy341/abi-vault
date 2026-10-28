"use client";

import { LoadError } from "@/components/ui/load-error";
import { LoadingCollection, LoadingText } from "@/components/ui/loading-state";
import ledger from "@/app/dashboard/ledger.module.css";
import type { AdaptiveFundsViewProps } from "./funds-types";

export type { AdaptiveFundsViewProps } from "./funds-types";

export default function FundsView(props: AdaptiveFundsViewProps) {
  const { loading, error, cards, activeCard, activeCardIndex, cashBox, auditLogs, activities, dollar } = props;

  const total = cards.reduce((sum, card) => sum + card.balance, 0);
  const hasCount = Boolean(cashBox.lastCountDate);
  const matched = hasCount && cashBox.countStatus === "matched";

  return (
    <div className={ledger.page}>
      {error ? <LoadError message={error} onRetry={props.onRetry} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Total balance</dt>
            <dd className={`${ledger.net} total-rule`}>
              <LoadingText loading={loading}>{dollar(total)}</LoadingText>
            </dd>
          </div>
          <div>
            <dt>Cash registers</dt>
            <dd><LoadingText loading={loading}>{cards.length}</LoadingText></dd>
          </div>
        </dl>
        <button type="button" className={ledger.primaryButton} onClick={props.onAddCard} disabled={loading}>
          Add cash register
        </button>
      </div>

      <div className={ledger.cols}>
        <div className={ledger.col}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Cash registers</h2>
          </header>
          {!loading && !cards.length ? (
            <p className={ledger.empty}>
              No cash register yet.{" "}
              <button type="button" className={ledger.textButton} onClick={props.onAddCard}>
                Create one
              </button>
            </p>
          ) : (
            <LoadingCollection loading={loading} knownItemCount={cards.length} emptyHeight="8rem" label="Loading cash registers">
              <table className={`${ledger.table} ${ledger.clickable}`}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col" className={ledger.amount}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card, index) => (
                    <tr
                      key={card.id}
                      tabIndex={0}
                      aria-selected={index === activeCardIndex}
                      onClick={() => props.onSelectCard(index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          props.onSelectCard(index);
                        }
                      }}
                    >
                      <td className={index === activeCardIndex ? ledger.attention : undefined}>{card.details.accountName}</td>
                      <td className={ledger.amount}>{dollar(card.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LoadingCollection>
          )}
        </section>

        {activeCard ? (
          <section className={ledger.section}>
            <header className={ledger.sectionHeader}>
              <h2>{activeCard.details.accountName}</h2>
              <div className={ledger.inlineActions}>
                <button type="button" className={ledger.textButton} onClick={props.onEditCard}>
                  Edit
                </button>
                <button type="button" className={ledger.secondaryButton} onClick={props.onCountCash}>
                  Count cash
                </button>
              </div>
            </header>
            <dl className={ledger.definitions}>
              <div>
                <dt>Book balance</dt>
                <dd>{dollar(activeCard.balance)}</dd>
              </div>
              <div>
                <dt>Responsible</dt>
                <dd>{cashBox.responsible || "Not set"}</dd>
              </div>
              <div>
                <dt>Last count</dt>
                <dd>{hasCount ? cashBox.lastCountDate : "No count yet"}</dd>
              </div>
              <div>
                <dt>Counted amount</dt>
                <dd>{hasCount ? dollar(cashBox.balance + cashBox.difference) : ""}</dd>
              </div>
              <div>
                <dt>Difference</dt>
                <dd className={hasCount && !matched ? ledger.attention : undefined}>
                  {hasCount ? dollar(cashBox.difference) : ""}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        </div>
        <div className={ledger.col}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Count history</h2>
          </header>
          {auditLogs.length ? (
            <table className={ledger.table}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className={ledger.hideOnPhone}>Counted by</th>
                  <th scope="col" className={ledger.hideOnPhone}>Note</th>
                  <th scope="col" className={ledger.amount}>Counted</th>
                  <th scope="col" className={ledger.amount}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((count) => (
                  <tr key={count.id}>
                    <td>
                      {count.date}
                      <span className={ledger.phoneMeta}>{count.auditor}</span>
                    </td>
                    <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{count.auditor}</td>
                    <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{count.note ?? ""}</td>
                    <td className={ledger.amount}>{dollar(count.countedAmount)}</td>
                    <td className={`${ledger.amount} ${Math.abs(count.difference) < 0.01 ? "" : ledger.attention}`}>
                      {dollar(count.difference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={ledger.empty}>No cash counts recorded yet.</p>
          )}
        </section>

        {activities.length ? (
          <section className={ledger.section}>
            <header className={ledger.sectionHeader}>
              <h2>Recent activity</h2>
            </header>
            <table className={ledger.table}>
              <tbody>
                {activities.slice(0, 8).map((activity) => (
                  <tr key={`${activity.date}-${activity.description}`}>
                    <td className={ledger.muted}>{activity.date}</td>
                    <td>{activity.description}</td>
                    <td className={ledger.amount}>{activity.amount >= 0 ? "+" : ""}{dollar(activity.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
        </div>
      </div>
    </div>
  );
}
