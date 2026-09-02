"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import cardStyles from "@/components/dashboard/AccountCard.module.css";
import dashboardStyles from "@/app/dashboard/dashboard.module.css";

type DashboardCard = { id: string; details?: Partial<AccountCardDetails> };

const initialCards: DashboardCard[] = [{ id: "default-bank" }];

export default function Klassenkasse() {
  const [cardIndex, setCardIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const currentCard = initialCards[cardIndex];
  const hasCards = initialCards.length > 0;
  const hasMultipleCards = initialCards.length > 1;

  function moveCard(direction: -1 | 1) {
    if (!hasMultipleCards) return;
    setCardIndex(
      (current) =>
        (current + direction + initialCards.length) % initialCards.length,
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      touchStartX.current = event.clientX;
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" || touchStartX.current === null) return;

    const distance = event.clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 48) return;
    moveCard(distance < 0 ? 1 : -1);
  }

  return (
    <Card className={dashboardStyles.cashPanelCard}>
      <CardHeader className={dashboardStyles.cashPanelHeaderBase}>
        <CardTitle className={dashboardStyles.cashPanelTitle}>
          Klassenkasse
        </CardTitle>
      </CardHeader>

      <CardContent className={dashboardStyles.cashPanelContentBase}>
        <div
          className={`${dashboardStyles.cashCarousel} ${hasMultipleCards ? dashboardStyles.cashCarouselMulti : dashboardStyles.cashCarouselSingle}`}
        >
          {hasMultipleCards ? (
            <button
              type="button"
              aria-label="Vorherige Karte"
              onClick={() => moveCard(-1)}
              className={`${dashboardStyles.cashCarouselButton} ${dashboardStyles.cashPreviousButton}`}
            >
              <ChevronLeft className="size-6" strokeWidth={1.75} />
            </button>
          ) : null}

          <div
            className={dashboardStyles.cashCardSlot}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              touchStartX.current = null;
            }}
          >
            {currentCard ? (
              <div key={currentCard.id} className={cardStyles.switchIn}>
                <button
                  type="button"
                  className={dashboardStyles.cashCardButton}
                  onClick={() => setPreviewOpen(true)}
                  aria-label={`${currentCard.details?.accountName ?? "Cash register"} anzeigen`}
                >
                  <AccountCard
                    variant="bank"
                    details={currentCard.details}
                    cardColor={currentCard.details?.color}
                  />
                </button>
              </div>
            ) : (
              <div className={cardStyles.switchIn}>
                <AccountCard variant="add" />
              </div>
            )}

            {hasCards ? (
              <div
                className={dashboardStyles.cashMobileIndicators}
                aria-label="Kartenposition"
              >
                {initialCards.map((card, index) => (
                  <span
                    key={card.id}
                    className={`${dashboardStyles.cashMobileIndicator} ${index === cardIndex ? dashboardStyles.cashMobileIndicatorActive : ""}`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {hasMultipleCards ? (
            <button
              type="button"
              aria-label="Next card"
              onClick={() => moveCard(1)}
              className={`${dashboardStyles.cashCarouselButton} ${dashboardStyles.cashNextButton}`}
            >
              <ChevronRight className="size-6" strokeWidth={1.75} />
            </button>
          ) : null}

          {hasCards ? (
            <div
              className={dashboardStyles.cashBalanceDivider}
              aria-hidden="true"
            />
          ) : null}

          <div
            className={`${dashboardStyles.cashBalance} ${hasMultipleCards ? dashboardStyles.cashBalanceMulti : dashboardStyles.cashBalanceSingle}`}
          >
            {hasCards ? (
              <>
                <span className={dashboardStyles.cashBalanceLabel}>
                  Total available
                </span>
                <strong className={dashboardStyles.cashBalanceAmount}>
                  2.850,75 €
                </strong>
                <p className={dashboardStyles.cashBalanceMeta}>
                  Card display · Ledger-basiert
                </p>
              </>
            ) : (
              <>
                <span className={dashboardStyles.cashBalanceLabel}>
                  No card connected
                </span>
                <p className={dashboardStyles.cashBalanceMeta}>
                  Add a card to see account details.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
      {currentCard ? (
        <CardPreviewDialog
          open={previewOpen}
          card={currentCard}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </Card>
  );
}

function CardPreviewDialog({
  open,
  card,
  onClose,
}: {
  open: boolean;
  card: DashboardCard;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-card-preview-title"
        className="w-full max-w-[29rem] rounded-2xl border border-black/10 bg-white p-5 shadow-[0_24px_70px_rgb(0_0_0_/_0.22)] dark:border-white/10 dark:bg-card sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              id="dashboard-card-preview-title"
              className="text-lg font-semibold tracking-tight"
            >
              {card.details?.accountName ?? "Cash register"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Card preview</p>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:hover:bg-white/[0.06]"
            aria-label="Close preview"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex justify-center rounded-xl bg-black/[0.025] px-4 py-6 dark:bg-white/[0.04]">
          <AccountCard
            variant="bank"
            details={card.details}
            cardColor={card.details?.color}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
}
