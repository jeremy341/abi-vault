"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountCard, { type AccountCardDetails } from "@/components/dashboard/AccountCard";
import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import cardStyles from "@/components/dashboard/AccountCard.module.css";

type DashboardCard =
    | { id: string; variant: "bank"; details?: Partial<AccountCardDetails> }
    | { id: "add"; variant: "add" };

const initialCards: DashboardCard[] = [
    { id: "default-bank", variant: "bank" },
    { id: "add", variant: "add" },
];

export default function Klassenkasse() {
    const [cards, setCards] = useState<DashboardCard[]>(initialCards);
    const [cardIndex, setCardIndex] = useState(0);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<AccountCardDetails | null>(null);
    const currentCard = cards[cardIndex];

    function moveCard(direction: -1 | 1) {
        setCardIndex((current) => (current + direction + cards.length) % cards.length);
    }

    function saveCard(details: AccountCardDetails) {
        const newCard: DashboardCard = {
            id: `custom-${Date.now()}`,
            variant: "bank",
            details,
        };

        setCards((current) => [...current.slice(0, -1), newCard, current[current.length - 1]]);
        setCardIndex(cards.length - 1);
        setIsAddCardOpen(false);
    }

    function openEditCard(card: Extract<DashboardCard, { variant: "bank" }>) {
        setEditingCardId(card.id);
        setEditingCard({
            accountName: card.details?.accountName ?? "Bankkonto",
            cardNumber: card.details?.cardNumber ?? "5789 **** **** 2847",
            holder: card.details?.holder ?? "Mike Smith",
            expiry: card.details?.expiry ?? "06/21",
            color: card.details?.color ?? "#111114",
        });
    }

    function updateCard(details: AccountCardDetails) {
        if (!editingCardId) return;
        setCards((current) => current.map((card) => card.id === editingCardId ? { ...card, details } : card));
        setEditingCardId(null);
        setEditingCard(null);
    }

    function deleteCard() {
        if (!editingCardId) return;
        setCards((current) => current.filter((card) => card.id !== editingCardId));
        setCardIndex((current) => Math.max(0, Math.min(current, cards.length - 2)));
        setEditingCardId(null);
        setEditingCard(null);
    }

    return (
        <Card className="w-full min-w-0 gap-0 rounded-2xl bg-card py-0 shadow-sm">
            <CardHeader className="px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6 min-[2200px]:px-8 min-[2200px]:pt-7">
                <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl min-[2200px]:text-[1.65rem]">
                    Klassenkasse
                </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6 lg:pt-4 min-[2200px]:px-7 min-[2200px]:pb-7 min-[2200px]:pt-5">
                <div className="grid min-w-0 items-center gap-y-4 lg:grid-cols-[24px_minmax(250px,340px)_24px_1px_minmax(160px,1fr)] lg:gap-x-2 lg:gap-y-0 min-[2200px]:grid-cols-[32px_minmax(390px,440px)_32px_1px_minmax(220px,1fr)] min-[2200px]:gap-x-4">
                    <button
                        type="button"
                        aria-label="Vorherige Karte"
                        onClick={() => moveCard(-1)}
                        className="hidden size-6 items-center justify-center rounded-md text-ink transition-transform hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:inline-flex"
                    >
                        <ChevronLeft className="size-6" strokeWidth={1.75} />
                    </button>

                    <div className="w-full max-w-[340px] justify-self-center min-[2200px]:max-w-[440px]">
                        <div key={currentCard.id} className={cardStyles.switchIn}>
                            {currentCard.variant === "add" ? (
                                <button
                                    type="button"
                                    className="block w-full rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                                    onClick={() => setIsAddCardOpen(true)}
                                    aria-label="Neue Karte hinzufügen"
                                >
                                    <AccountCard variant="add" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="block w-full rounded-[20px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                                    onClick={() => openEditCard(currentCard)}
                                    aria-label={`${currentCard.details?.accountName ?? "Bankkonto"} bearbeiten`}
                                >
                                    <AccountCard variant="bank" details={currentCard.details} cardColor={currentCard.details?.color} />
                                </button>
                            )}
                        </div>

                        <div className="mt-3 flex justify-center gap-2 lg:hidden" aria-label="Kartenposition">
                            {cards.map((card, index) => (
                                <span
                                    key={card.id}
                                    className={`h-2 w-2 rounded-full ${index === cardIndex ? "bg-ink" : "bg-black/15"}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Nächste Karte"
                        onClick={() => moveCard(1)}
                        className="hidden size-6 items-center justify-center rounded-md text-ink transition-transform hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:inline-flex"
                    >
                        <ChevronRight className="size-6" strokeWidth={1.75} />
                    </button>

                    <div className="hidden h-full w-px bg-black/15 lg:block" aria-hidden="true" />

                    <div className="flex min-w-0 flex-col justify-center lg:pl-4 min-[2200px]:pl-6">
                        <span className="text-sm text-muted-foreground lg:text-base min-[2200px]:text-lg">Gesamt verfügbar</span>
                        <strong className="whitespace-nowrap text-3xl font-semibold tracking-tight text-ink tabular-nums lg:text-4xl min-[2200px]:text-[2.75rem]">
                            2.850,75 €
                        </strong>
                        <p className="text-sm text-muted-foreground lg:text-base min-[2200px]:mt-1 min-[2200px]:text-lg">
                            Bankkonto · <span className="text-green-600">API verbunden</span>
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex min-h-16 items-center gap-3 rounded-xl bg-green-50 px-4 py-3 lg:mt-5 lg:gap-4 lg:px-5 min-[2200px]:min-h-20 min-[2200px]:gap-5 min-[2200px]:px-6">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white lg:size-10 min-[2200px]:size-11">
                        <Check className="size-5 lg:size-6" strokeWidth={2.5} />
                    </span>
                    <div className="text-sm lg:text-base min-[2200px]:text-lg">
                        <strong className="block font-semibold text-green-700">Kasse stimmt überein</strong>
                        <span className="text-green-700">Übereinstimmung: 100 %</span>
                    </div>
                </div>
            </CardContent>
            <AddCardModal open={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} onSave={saveCard} />
            <EditCardModal
                key={editingCardId ?? "edit-card"}
                open={Boolean(editingCardId)}
                card={editingCard}
                onClose={() => { setEditingCardId(null); setEditingCard(null); }}
                onSave={updateCard}
                onDelete={deleteCard}
            />
        </Card>
    );
}
