"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import type { CashBox, CashCountInput, SaveCashCountResult } from "@/app/dashboard/funds/CashCountDialog";
import {
  getDashboardSnapshot,
  listCashCountsForCurrentOrganization,
} from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { archiveWallet, createWallet, updateWallet } from "@/features/finance/actions/wallets";
import { recordCashCount } from "@/features/finance/actions/cash-counts";
import type { CashRegisterCard } from "@/lib/finance/cash-register-card";
import type { CashAuditEntry } from "@/app/dashboard/funds/funds-page-types";
import FundsStatus from "@/app/dashboard/funds/FundsStatus";
import CashRegisterView from "@/app/dashboard/funds/CashRegisterView";
import CardDialogs from "@/app/dashboard/funds/CardDialogs";
import ArchiveCardDialog from "@/app/dashboard/funds/ArchiveCardDialog";
import CashCountSection from "@/app/dashboard/funds/CashCountSection";
import { auditLogsFromQuery, cardsFromDashboard, cashBoxesFromDashboard, createBlankCashBox } from "@/app/dashboard/funds/funds-helpers";
import { differenceReviewFor } from "@/app/dashboard/funds/difference-review";

const emptyCards: CashRegisterCard[] = [];

const emptyCashBoxes: Record<string, CashBox> = {};

const emptyAuditLogs: CashAuditEntry[] = [];

export default function FundsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const dashboard = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);
  const cashCounts = useFinanceQuery("cash-counts", listCashCountsForCurrentOrganization, cacheScope);
  const [cards, setCards] = useQueryBackedState(
    dashboard.data?.ok ? dashboard.data : null,
    cardsFromDashboard,
    emptyCards,
  );
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cashBoxes, setCashBoxes] = useQueryBackedState(
    dashboard.data?.ok ? dashboard.data : null,
    cashBoxesFromDashboard,
    emptyCashBoxes,
  );
  const [auditLogs, setAuditLogs] = useQueryBackedState(
    cashCounts.data?.ok ? cashCounts.data : null,
    auditLogsFromQuery,
    emptyAuditLogs,
  );
  const [notice, setNotice] = useState("");
  const loading = dashboard.loading;
  const loadError = dashboard.failed ? "Cash registers could not be loaded." : "";
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  function retryWallets() {
    dashboard.refetch();
    cashCounts.refetch();
  }

  function closeAddCardDialog() {
    setIsAddCardOpen(false);
  }

  function closeEditCardDialog() {
    setIsEditCardOpen(false);
  }

  function closeDeleteDialog() {
    setIsDeleteOpen(false);
  }

  function closeCountDialog() {
    setIsCountOpen(false);
  }

  useEffect(() => {
    if (!isDeleteOpen && !isCountOpen) return;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCountOpen, isDeleteOpen]);
  const safeIndex = Math.min(activeCardIndex, Math.max(0, cards.length - 1));
  const activeCard = cards[safeIndex] ?? cards[0];
  let cashBox: CashBox = createBlankCashBox("", "", 0);

  if (activeCard) {
    cashBox =
      cashBoxes[activeCard.id] ??
      createBlankCashBox(activeCard.id, activeCard.details.accountName, activeCard.balance);
  }

  const dashboardData = dashboard.data?.ok ? dashboard.data : null;
  const differenceReview = dashboardData && activeCard ? differenceReviewFor(dashboardData, activeCard.id) : null;

  function switchCard(direction: -1 | 1) {
    if (cards.length <= 1) return;
    setActiveCardIndex((current) => (current + direction + cards.length) % cards.length);
  }

  function selectCard(index: number) {
    setActiveCardIndex(index);
  }

  async function handleSaveNewCard(details: AccountCardDetails, idempotencyKey: string) {
    try {
      const persisted = await createWallet({
        name: details.accountName,
        type: "cash",
        responsibleClerkUserId: null,
        bankConnectionId: null,
        idempotencyKey,
        cardNumberVisual: details.cardNumber,
        cardHolderVisual: details.holder,
        cardExpiryVisual: details.expiry,
        cardColorVisual: details.color,
      });

      if (!persisted.success) {
        setNotice(persisted.error.message);

        return false;
      }

      const newCard: CashRegisterCard = {
        id: persisted.data.id,
        details,
        balance: 0,
      };
      setCards((current: CashRegisterCard[]) => [...current, newCard]);
      setCashBoxes((current: Record<string, CashBox>) => ({
        ...current,
        [newCard.id]: createBlankCashBox(newCard.id, details.accountName, 0),
      }));
      setActiveCardIndex(cards.length);
      setIsAddCardOpen(false);
      invalidateFinanceQuery("wallets", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
      setNotice("Cash register added.");

      return true;
    } catch {
      setNotice("The cash register could not be added.");

      return false;
    }
  }

  async function handleUpdateCard(details: AccountCardDetails): Promise<boolean> {
    if (!activeCard) return false;

    try {
      const result = await updateWallet({
        walletId: activeCard.id,
        name: details.accountName,
        reason: "Cash register updated through cash register management",
        cardNumberVisual: details.cardNumber,
        cardHolderVisual: details.holder,
        cardExpiryVisual: details.expiry,
        cardColorVisual: details.color,
      });

      if (!result.success) {
        setNotice("Card details could not be saved.");

        return false;
      }

      setCards((current: CashRegisterCard[]) =>
        current.map((card, index) => (index === safeIndex ? { ...card, details } : card)),
      );
      setCashBoxes((current: Record<string, CashBox>) => ({
        ...current,
        [activeCard.id]: { ...cashBox, name: details.accountName },
      }));
      setIsEditCardOpen(false);
      invalidateFinanceQuery("wallets", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
      setNotice("Cash register saved.");

      return true;
    } catch {
      setNotice("Card details could not be saved.");

      return false;
    }
  }

  function requestDeleteCard() {
    setIsEditCardOpen(false);
    setIsDeleteOpen(true);
  }

  function openCountDialog() {
    setIsCountOpen(true);
  }

  async function confirmDeleteCard() {
    if (!activeCard || deleteSaving) return;
    setDeleteSaving(true);

    try {
      const result = await archiveWallet({
        walletId: activeCard.id,
        reason: "Cash register archived through cash register management",
      });

      if (!result.success) {
        setNotice("The cash register could not be archived.");

        return;
      }

      setCards((current: CashRegisterCard[]) => current.filter((_, index) => index !== safeIndex));
      setCashBoxes((current: Record<string, CashBox>) => {
        const next = { ...current };
        delete next[activeCard.id];

        return next;
      });
      setActiveCardIndex((current) => Math.max(0, current - 1));
      setIsDeleteOpen(false);
      invalidateFinanceQuery("wallets", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
      setNotice("Cash register archived.");
    } catch {
      setNotice("The cash register could not be archived.");
    } finally {
      setDeleteSaving(false);
    }
  }

  async function handleSaveCount({
    countedAmount,
    countedBy,
    note,
    idempotencyKey,
  }: CashCountInput): Promise<SaveCashCountResult> {
    const difference = countedAmount - cashBox.balance;
    const status = Math.abs(difference) < 0.01 ? "matched" : "discrepancy";
    const auditor = countedBy || cashBox.responsible;
    const persisted = await recordCashCount({
      walletId: cashBox.id,
      countedAmount: String(countedAmount).replace(".", ","),
      auditor: countedBy,
      note,
      idempotencyKey,
    });

    if (!persisted.ok) {
      return { success: false, message: persisted.error.message };
    }

    setCashBoxes((current: Record<string, CashBox>) => ({
      ...current,
      [cashBox.id]: {
        ...cashBox,
        lastCountDate: "Today",
        countStatus: status,
        difference,
        responsible: auditor,
      },
    }));
    setAuditLogs((current: CashAuditEntry[]) => [
      {
        id: `audit-${Date.now()}`,
        date: "Today",
        auditor,
        countedAmount,
        bookBalance: cashBox.balance,
        difference,
        note: note || undefined,
      },
      ...current.slice(0, 4),
    ]);
    invalidateFinanceQuery("wallets", "cash-counts", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
    dashboard.refetch();
    cashCounts.refetch();
    setNotice("Cash count saved.");

    return { success: true };
  }

  return (
    <section>
      <FundsStatus loading={loading} notice={notice} />

      <CashRegisterView
        differenceReview={differenceReview}
        loading={loading}
        loadError={loadError}
        onRetry={retryWallets}
        cards={cards}
        activeCard={activeCard}
        activeCardIndex={safeIndex}
        cashBox={cashBox}
        auditLogs={auditLogs}
        onSwitchCard={switchCard}
        onSelectCard={selectCard}
        onAddCard={() => setIsAddCardOpen(true)}
        onEditCard={() => setIsEditCardOpen(true)}
        onCountCash={openCountDialog}
      />

      <CardDialogs
        activeCard={activeCard}
        isAddCardOpen={isAddCardOpen}
        isEditCardOpen={isEditCardOpen}
        onCloseAddCard={closeAddCardDialog}
        onCloseEditCard={closeEditCardDialog}
        onSaveNewCard={handleSaveNewCard}
        onUpdateCard={handleUpdateCard}
        onRequestDelete={requestDeleteCard}
      />

      {isDeleteOpen ? (
        <ArchiveCardDialog
          accountName={activeCard?.details.accountName}
          saving={deleteSaving}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteCard}
        />
      ) : null}

      <CashCountSection
        isOpen={isCountOpen}
        activeCardId={activeCard?.id}
        cashBox={cashBox}
        onClose={closeCountDialog}
        onSave={handleSaveCount}
      />
    </section>
  );
}
