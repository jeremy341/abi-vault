"use client";

import { LoadError } from "@/components/ui/load-error";
import { LoadingCollection, LoadingText } from "@/components/ui/loading-state";
import ledger from "@/app/dashboard/ledger.module.css";
import { formatCountDate } from "@/app/dashboard/funds/funds-helpers";
import styles from "./funds-view.module.css";
import type { AdaptiveFundsViewProps, FundsCard } from "./funds-types";

export type { AdaptiveFundsViewProps } from "./funds-types";

const HISTORY_LIMIT = 8;

function countStatus(card: FundsCard, dollar: (value: number) => string) {
  if (!card.lastCountAt) return { text: "not counted yet", off: false };

  const difference = card.lastCountDifference ?? 0;

  if (Math.abs(difference) < 0.01) {
    return { text: `counted ${formatCountDate(card.lastCountAt).toLowerCase()}, matches`, off: false };
  }

  return { text: `off by ${dollar(Math.abs(difference))}`, off: true };
}

function Line({ label, value, strong, off }: { label: string; value: string; strong?: boolean; off?: boolean }) {
  return (
    <div className={`${styles.line} ${strong ? styles.lineStrong : ""}`}>
      <dt>{label}</dt>
      <span className={styles.leader} aria-hidden="true" />
      <dd className={off ? styles.off : undefined}>{value}</dd>
    </div>
  );
}

export default function FundsView(props: AdaptiveFundsViewProps) {
  const { loading, error, cards, activeCard, activeCardIndex, cashBox, auditLogs, dollar } = props;
  let total = 0;

  for (const card of cards) {
    total += card.balance;
  }

  const hasCount = Boolean(cashBox.lastCountDate);
  const matched = hasCount && cashBox.countStatus === "matched";

  return (
    <div className={`${ledger.page} ${styles.layout}`}>
      {error ? <LoadError message={error} onRetry={props.onRetry} /> : null}

      <aside className={styles.rail} aria-label="Cash registers">
        <h2 className={styles.railTitle}>registers</h2>

        {!loading && !cards.length ? (
          <p className={ledger.empty}>No cash register yet.</p>
        ) : (
          <LoadingCollection loading={loading} knownItemCount={cards.length} emptyHeight="8rem" label="Loading cash registers">
            <ul className={styles.registers}>
              {cards.map((card, index) => {
                const status = countStatus(card, dollar);

                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      className={styles.register}
                      aria-pressed={index === activeCardIndex}
                      onClick={() => props.onSelectCard(index)}
                    >
                      <span className={styles.registerName}>{card.details.accountName}</span>
                      <strong>{dollar(card.balance)}</strong>
                      <small className={status.off ? styles.off : undefined}>{status.text}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          </LoadingCollection>
        )}

        <p className={styles.total}>
          <span>All registers</span>
          <strong className="total-rule"><LoadingText loading={loading}>{dollar(total)}</LoadingText></strong>
        </p>
        <button type="button" className={ledger.secondaryButton} onClick={props.onAddCard} disabled={loading}>
          Add cash register
        </button>
      </aside>

      {activeCard ? (
        <div className={styles.main}>
          <section className={styles.slip} aria-label={`${activeCard.details.accountName} count sheet`}>
            <header className={styles.slipHeader}>
              <h2>{activeCard.details.accountName}</h2>
              <div className={ledger.inlineActions}>
                <button type="button" className={ledger.textButton} onClick={props.onEditCard}>
                  Edit
                </button>
                <button type="button" className={ledger.primaryButton} onClick={props.onCountCash}>
                  Count cash
                </button>
              </div>
            </header>

            <dl className={styles.sums}>
              <Line label="Book balance" value={dollar(activeCard.balance)} />
              <Line label="Counted" value={hasCount ? dollar(cashBox.balance + cashBox.difference) : "not counted yet"} />
              <Line
                label="Difference"
                value={hasCount ? dollar(cashBox.difference) : "none"}
                strong
                off={hasCount && !matched}
              />
            </dl>

            <p className={`${styles.verdict} ${hasCount && !matched ? styles.off : ""}`}>
              {!hasCount ? "Count the cash to compare it with the books." : matched ? "The cash matches the books." : "The cash does not match the books."}
            </p>

            <dl className={styles.meta}>
              <div>
                <dt>Last count</dt>
                <dd>{hasCount ? cashBox.lastCountDate : "No count yet"}</dd>
              </div>
              <div>
                <dt>Responsible</dt>
                <dd>{cashBox.responsible || "Not set"}</dd>
              </div>
            </dl>

            {props.differencePanel}
          </section>

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
                    <th scope="col" className={ledger.amount}>Counted</th>
                    <th scope="col" className={ledger.amount}>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, HISTORY_LIMIT).map((count) => (
                    <tr key={count.id}>
                      <td className={ledger.nowrap}>
                        {count.date}
                        <span className={ledger.phoneMeta}>{count.auditor}</span>
                      </td>
                      <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{count.auditor}</td>
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
        </div>
      ) : null}
    </div>
  );
}
