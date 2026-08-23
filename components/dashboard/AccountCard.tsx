"use client";

import Image from "next/image";
import styles from "./AccountCard.module.css";
import { maskCardNumber, previewCardNumber } from "@/lib/card-format";

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
  const accountName = details?.accountName || "Bankkonto";
  const cardNumber = maskCardNumber(details?.cardNumber || previewCardNumber);
  const holder = details?.holder || "Mike Smith";
  const expiry = details?.expiry || "06/21";
  const isLightCard = cardColor === "#e9e9e7";
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;
    const rotateX = (0.5 - relativeY) * 8;
    const rotateY = (relativeX - 0.5) * 8;

    event.currentTarget.style.setProperty(
      "--tilt-x",
      `${rotateX.toFixed(2)}deg`,
    );
    event.currentTarget.style.setProperty(
      "--tilt-y",
      `${rotateY.toFixed(2)}deg`,
    );
  }

  function resetTilt(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      key={variant}
      className={`${styles.cardFrame} relative aspect-[340/196] w-full max-w-[340px] min-[2200px]:max-w-[440px]`}
    >
      {variant === "add" ? (
        <Image
          src="/cards/add-card.svg"
          alt="Karte hinzufügen"
          fill
          loading="eager"
          sizes="(min-width: 2200px) 440px, (min-width: 1024px) 340px, min(340px, 100vw)"
          className="absolute inset-0 h-full w-full object-fill dark:invert"
        />
      ) : (
        <div
          className={`${styles.card} ${isLightCard ? styles.cardLight : ""} relative aspect-[340/196] w-full max-w-[340px] overflow-hidden rounded-[20px] shadow-[0_14px_24px_-5px_rgb(0_0_0_/_30%)] min-[2200px]:max-w-[440px]`}
          style={
            cardColor
              ? ({ "--card-color": cardColor } as React.CSSProperties)
              : undefined
          }
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
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

          {cardColor ? (
            <div
              className={`${styles.cardTint} ${isLightCard ? styles.cardTintLight : ""}`}
              aria-hidden="true"
            />
          ) : null}

          <div
            className={`relative z-10 flex h-full flex-col justify-between px-5 py-4 sm:px-6 sm:py-5 min-[2200px]:px-8 min-[2200px]:py-7 ${isLightCard ? "text-black" : "text-white"}`}
          >
            <span className="text-[11px] font-medium tracking-wide sm:text-xs min-[2200px]:text-sm">
              {accountName}
            </span>

            <strong
              className={`${styles.cardNumber} whitespace-nowrap font-medium tracking-[0.1em] tabular-nums`}
            >
              {cardNumber}
            </strong>

            <div className="flex gap-10 text-xs sm:gap-14 sm:text-sm min-[2200px]:gap-20 min-[2200px]:text-base">
              <div>
                <span
                  className={`block text-[9px] sm:text-[10px] ${isLightCard ? "text-black/55" : "text-white/75"}`}
                >
                  Card holder
                </span>
                <span>{holder}</span>
              </div>

              <div>
                <span
                  className={`block text-[9px] sm:text-[10px] ${isLightCard ? "text-black/55" : "text-white/75"}`}
                >
                  Expire date
                </span>
                <span>{expiry}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
