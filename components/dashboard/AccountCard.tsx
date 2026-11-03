"use client";

import Image from "next/image";
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
  const expiry = details?.expiry || "—";

  const normalizedCardColor = cardColor?.toLowerCase();

  const visualCardColor =
    normalizedCardColor === "#111114" || normalizedCardColor === "#242923"
      ? "#242426"
      : cardColor;

  const isLightCard = visualCardColor === "#e9e9e7";

  return (
    <div
      key={variant}
      className={`${styles.cardFrame} relative aspect-[340/196] w-full max-w-[340px] min-[2200px]:max-w-[440px]`}
    >
      {variant === "add" ? (
        <Image
          src="/cards/add-card.svg"
          alt="Add card"
          fill
          loading="eager"
          sizes="(min-width: 2200px) 440px, (min-width: 1024px) 340px, min(340px, 100vw)"
          className="absolute inset-0 h-full w-full object-fill dark:invert"
        />
      ) : (
        <div
          className={`${styles.card} ${isLightCard ? styles.cardLight : ""} relative aspect-[340/196] w-full max-w-[340px] overflow-hidden rounded-[12px] shadow-[0_10px_24px_rgb(36_36_40_/_16%)] min-[2200px]:max-w-[440px]`}
          // SAFETY: --card-color is the custom property consumed by AccountCard.module.css.
          style={
            visualCardColor
              ? ({ "--card-color": visualCardColor } as React.CSSProperties)
              : undefined
          }
        >
          <Image
            src="/cards/bank-account.svg"
            alt=""
            aria-hidden="true"
            fill
            loading="eager"
            sizes="(min-width: 2200px) 440px, (min-width: 1024px) 340px, min(340px, 100vw)"
            className="absolute inset-0 h-full w-full object-fill"
          />

          {visualCardColor ? (
            <div
              className={`${styles.cardTint} ${isLightCard ? styles.cardTintLight : ""}`}
              aria-hidden="true"
            />
          ) : null}

          <div
            className={`relative z-10 flex h-full flex-col justify-between px-5 py-4 sm:px-6 sm:py-5 min-[2200px]:px-8 min-[2200px]:py-7 ${isLightCard ? "text-black" : "text-white"}`}
          >
            <span className={styles.cardName}>
              {accountName}
            </span>

            <strong
              className={`${styles.cardNumber} whitespace-nowrap font-medium tracking-[0.1em] tabular-nums`}
            >
              {cardNumber}
            </strong>

            <div className={styles.cardMeta}>
              <div>
                <span className={`${styles.cardMetaLabel} ${isLightCard ? "text-black/55" : "text-white/75"}`}>
                  Inhaber
                </span>
                <span className={styles.cardMetaValue}>{holder}</span>
              </div>

              <div>
                <span className={`${styles.cardMetaLabel} ${isLightCard ? "text-black/55" : "text-white/75"}`}>
                  Valid until
                </span>
                <span className={styles.cardMetaValue}>{expiry}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
