"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountCard, { type AccountCardDetails } from "@/components/dashboard/AccountCard";
import cardStyles from "@/components/dashboard/AccountCard.module.css";
import dashboardStyles from "@/app/dashboard/dashboard.module.css";

type DashboardCard = { id: string; details?: Partial<AccountCardDetails> };

const initialCards: DashboardCard[] = [
    { id: "default-bank" },
    {
        id: "reserve-bank",
        details: {
            accountName: "Reservekonto",
            cardNumber: "4921 **** **** 6710",
            holder: "Abi Komitee",
            expiry: "08/28",
            color: "#3b3b40",
        },
    },
];

export default function Klassenkasse() {
    const [cardIndex, setCardIndex] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const currentCard = initialCards[cardIndex];

    function moveCard(direction: -1 | 1) {
        setCardIndex((current) => (current + direction + initialCards.length) % initialCards.length);
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
        <Card className={`${dashboardStyles.cashPanel} w-full min-w-0 shrink-0 gap-0 rounded-2xl bg-white/85 py-0 shadow-[0_12px_28px_rgb(0_0_0_/_0.07)] backdrop-blur-[3px] dark:bg-card/85`}>
            <CardHeader className={`${dashboardStyles.cashPanelHeader} px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6 min-[2200px]:px-8 min-[2200px]:pt-7`}>
                <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl min-[2200px]:text-[1.65rem]">
                    Klassenkasse
                </CardTitle>
            </CardHeader>

            <CardContent className={`${dashboardStyles.cashPanelContent} px-4 pb-4 pt-3 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6 lg:pt-4 min-[2200px]:px-7 min-[2200px]:pb-7 min-[2200px]:pt-5`}>
                <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-x-1 gap-y-4 lg:grid-cols-[24px_minmax(250px,340px)_24px_1px_minmax(160px,1fr)] lg:gap-x-2 lg:gap-y-0 min-[2200px]:grid-cols-[32px_minmax(390px,440px)_32px_1px_minmax(220px,1fr)] min-[2200px]:gap-x-4">
                    <button
                        type="button"
                        aria-label="Vorherige Karte"
                        onClick={() => moveCard(-1)}
                        className="inline-flex size-8 items-center justify-center justify-self-center rounded-full bg-white text-ink shadow-[0_4px_16px_rgb(0_0_0_/_10%)] transition-transform hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:size-6 lg:rounded-md lg:bg-transparent lg:shadow-none"
                    >
                        <ChevronLeft className="size-6" strokeWidth={1.75} />
                    </button>

                    <div
                        className={`${dashboardStyles.accountCardSlot} col-start-2 w-full max-w-[340px] touch-pan-y justify-self-center min-[2200px]:max-w-[440px]`}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={() => { touchStartX.current = null; }}
                    >
                        <div key={currentCard.id} className={cardStyles.switchIn}>
                            <button
                                type="button"
                                className="block w-full rounded-[20px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                                onClick={() => setPreviewOpen(true)}
                                aria-label={`${currentCard.details?.accountName ?? "Bankkonto"} anzeigen`}
                            >
                                <AccountCard variant="bank" details={currentCard.details} cardColor={currentCard.details?.color} />
                            </button>
                        </div>

                        <div className="mt-3 flex justify-center gap-2 lg:hidden" aria-label="Kartenposition">
                            {initialCards.map((card, index) => (
                                <span
                                    key={card.id}
                                    className={`h-2 w-2 rounded-full ${index === cardIndex ? "bg-ink" : "bg-black/15 dark:bg-white/35"}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Nächste Karte"
                        onClick={() => moveCard(1)}
                        className="col-start-3 inline-flex size-8 items-center justify-center justify-self-center rounded-full bg-white text-ink shadow-[0_4px_16px_rgb(0_0_0_/_10%)] transition-transform hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:size-6 lg:rounded-md lg:bg-transparent lg:shadow-none"
                    >
                        <ChevronRight className="size-6" strokeWidth={1.75} />
                    </button>

                    <div className="hidden h-full w-px bg-black/15 dark:bg-white/45 lg:block" aria-hidden="true" />

                    <div className={`${dashboardStyles.accountBalance} col-span-3 flex min-w-0 flex-col justify-center lg:col-span-1 lg:pl-4 min-[2200px]:pl-6`}>
                        <span className="text-sm text-muted-foreground lg:text-base min-[2200px]:text-lg">Gesamt verfügbar</span>
                        <strong className="whitespace-nowrap text-3xl font-semibold tracking-tight text-ink tabular-nums lg:text-4xl min-[2200px]:text-[2.75rem]">
                            2.850,75 €
                        </strong>
                        <p className="text-sm text-muted-foreground lg:text-base min-[2200px]:mt-1 min-[2200px]:text-lg">
                            Bankkonto · <span className="text-[var(--ui-positive)]">API verbunden</span>
                        </p>
                    </div>
                </div>

                <div className={`${dashboardStyles.accountStatus} mt-4 flex min-h-16 items-center gap-3 rounded-xl bg-[var(--ui-positive-soft)] px-4 py-3 lg:mt-5 lg:gap-4 lg:px-5 min-[2200px]:min-h-20 min-[2200px]:gap-5 min-[2200px]:px-6 min-[2200px]:py-4`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ui-positive)] text-white lg:size-10 min-[2200px]:size-11">
                        <Check className="size-5 lg:size-6" strokeWidth={2.5} />
                    </span>
                    <div className="text-sm lg:text-base min-[2200px]:text-lg">
                        <strong className="block font-semibold text-[var(--ui-positive)]">Kasse stimmt überein</strong>
                        <span className="text-[var(--ui-positive)]">Übereinstimmung: 100 %</span>
                    </div>
                </div>
            </CardContent>
            <CardPreviewDialog
                open={previewOpen}
                card={currentCard}
                onClose={() => setPreviewOpen(false)}
            />
        </Card>
    );
}

function CardPreviewDialog({ open, card, onClose }: { open: boolean; card: DashboardCard; onClose: () => void }) {
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
                        <h2 id="dashboard-card-preview-title" className="text-lg font-semibold tracking-tight">
                            {card.details?.accountName ?? "Bankkonto"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">Kartenvorschau</p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:hover:bg-white/[0.06]"
                        aria-label="Vorschau schließen"
                        onClick={onClose}
                    >
                        <X className="size-5" />
                    </button>
                </header>
                <div className="flex justify-center rounded-xl bg-black/[0.025] px-4 py-6 dark:bg-white/[0.04]">
                    <AccountCard variant="bank" details={card.details} cardColor={card.details?.color} />
                </div>
            </section>
        </div>,
        document.body,
    );
}
