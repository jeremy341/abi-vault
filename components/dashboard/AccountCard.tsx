"use client";

import styles from "./AccountCard.module.css";
import { maskCardNumber } from "@/lib/card-format";

type AccountCardVariant = "bank" | "add";

export type AccountCardDetails = {
  accountName: string;
  cardNumber: string;
  holder: string;
  expiry: string;
  color: string;
};

type AccountCardProps = {
  variant?: AccountCardVariant;
  cardColor?: string;
  details?: Partial<AccountCardDetails>;
};

export default function AccountCard({
  variant = "bank",
  cardColor,
  details,
}: AccountCardProps) {
  const accountName = details?.accountName || "Cash register";

  const cardNumber = details?.cardNumber
    ? maskCardNumber(details.cardNumber)
    : "•••• •••• •••• ••••";

  const holder = details?.holder || "Not set";
  const expiry = details?.expiry || "Not set";

  return (
    <div key={variant} className={styles.summary}>
      <p className={styles.name}>
        {cardColor ? (
          <span
            className={styles.swatch}
            aria-hidden="true"
            style={{ "--swatch": cardColor } as React.CSSProperties}
          />
        ) : null}
        <span className={styles.nameText}>{accountName}</span>
      </p>
      <p className={styles.number}>{cardNumber}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Responsible</dt>
          <dd>{holder}</dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>{expiry}</dd>
        </div>
      </dl>
    </div>
  );
}
