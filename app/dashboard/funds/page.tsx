"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { X } from "lucide-react";
import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import FundsView from "@/components/presentation/funds/FundsView";
import { Dialog } from "@/components/ui/dialog";
import { LoadingStatus } from "@/components/ui/loading-state";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./funds.module.css";
import CashCountDialog, {
  type CashBox,
  type CashCountInput,
  type SaveCashCountResult,
} from "./CashCountDialog";
import {
  getDashboardSnapshot,
  listCashCountsForCurrentOrganization,
  type CashCountListItem,
  type DashboardResult,
} from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { archiveWallet, createWallet, updateWallet } from "@/features/finance/actions/wallets";
import { recordCashCount } from "@/features/finance/actions/cash-counts";
import {
  mapWalletToCashRegisterCard,
  type CashRegisterCard,
} from "@/lib/finance/cash-register-card";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dollar = (value: number) => money.format(value).replace("-", "−");

type CashAuditEntry = {
  id: string;
  date: string;
  auditor: string;
  countedAmount: number;
  bookBalance: number;
  difference: number;
  note?: string;
};

type WalletWithCount = {
  id: string;
  name: string;
  balanceMinor: string | number;
  lastCountAt?: string | null;
  lastCountDifferenceMinor?: string | number | null;
  lastCountedByName?: string | null;
};

type DashboardData = Extract<DashboardResult, { ok: true }>;

type CashCountData = Extract<Awaited<ReturnType<typeof listCashCountsForCurrentOrganization>>, { ok: true }>;

const emptyCards: CashRegisterCard[] = [];

const emptyCashBoxes: Record<string, CashBox> = {};

const emptyAuditLogs: CashAuditEntry[] = [];

function createBlankCashBox(id: string, name: string, balance: number): CashBox {
  return {
    id,
    name,
    balance,
    responsible: "",
    lastCountDate: "",
    countStatus: "matched",
    difference: 0,
  };
}

function cashWalletsFrom(data: DashboardData) {
  return data.wallets.filter((wallet) => wallet.type === "cash");
}

function cardsFromDashboard(data: DashboardData) {
  return cashWalletsFrom(data).map(mapWalletToCashRegisterCard);
}

function cashBoxesFromDashboard(data: DashboardData) {
  const cashBoxes: Record<string, CashBox> = {};

  for (const wallet of cashWalletsFrom(data)) {
    cashBoxes[wallet.id] = toCashBox(wallet);
  }

  return cashBoxes;
}

function auditLogsFromQuery(data: CashCountData) {
  return data.items.map(toCountEntry);
}

function formatCountDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toCashBox(wallet: WalletWithCount): CashBox {
  const difference = Number(String(wallet.lastCountDifferenceMinor ?? 0)) / 100;
  const hasCount = Boolean(wallet.lastCountAt);
  const countStatus = Math.abs(difference) < 0.01 ? "matched" : "discrepancy";

  return {
    id: wallet.id,
    name: wallet.name,
    balance: Number(wallet.balanceMinor) / 100,
    responsible: wallet.lastCountedByName ?? "",
    lastCountDate: hasCount ? formatCountDate(wallet.lastCountAt!) : "",
    countStatus,
    difference: hasCount ? difference : 0,
  };
}

function toCountEntry(count: CashCountListItem): CashAuditEntry {
  return {
    id: count.id,
    date: formatCountDate(count.createdAt),
    auditor: count.countedByName ?? "Unknown",
    countedAmount: Number(count.countedAmountMinor) / 100,
    bookBalance: Number(count.bookAmountMinor) / 100,
    difference: Number(count.differenceMinor) / 100,
    note: count.note ?? undefined,
  };
}

type FundsStatusProps = {
  loading: boolean;
  notice: string;
};

function FundsStatus({ loading, notice }: FundsStatusProps) {
  return (
    <>
      <LoadingStatus loading={loading} label="Loading cash registers" />

      <p className={styles.liveNotice} aria-live="polite">
        {notice}
      </p>
    </>
  );
}

type CashRegisterViewProps = {
  loading: boolean;
  loadError: string;
  onRetry: () => void;
  cards: CashRegisterCard[];
  activeCard: CashRegisterCard | undefined;
  activeCardIndex: number;
  cashBox: CashBox;
  auditLogs: CashAuditEntry[];
  onSwitchCard: (direction: -1 | 1) => void;
  onSelectCard: (index: number) => void;
  onAddCard: () => void;
  onEditCard: () => void;
  onCountCash: () => void;
};

function CashRegisterView({
  loading,
  loadError,
  onRetry,
  cards,
  activeCard,
  activeCardIndex,
  cashBox,
  auditLogs,
  onSwitchCard,
  onSelectCard,
  onAddCard,
  onEditCard,
  onCountCash,
}: CashRegisterViewProps) {
  return (
    <FundsView
      loading={loading}
      error={loadError || null}
      onRetry={onRetry}
      cards={cards}
      activeCard={activeCard}
      activeCardIndex={activeCardIndex}
      cashBox={cashBox}
      auditLogs={auditLogs}
      activities={[]}
      dollar={dollar}
      onSwitchCard={onSwitchCard}
      onSelectCard={onSelectCard}
      onAddCard={onAddCard}
      onEditCard={onEditCard}
      onCountCash={onCountCash}
    />
  );
}

type CardDialogsProps = {
  activeCard: CashRegisterCard | undefined;
  isAddCardOpen: boolean;
  isEditCardOpen: boolean;
  onCloseAddCard: () => void;
  onCloseEditCard: () => void;
  onSaveNewCard: (details: AccountCardDetails, idempotencyKey: string) => Promise<boolean>;
  onUpdateCard: (details: AccountCardDetails) => Promise<boolean>;
  onRequestDelete: () => void;
};

function CardDialogs({
  activeCard,
  isAddCardOpen,
  isEditCardOpen,
  onCloseAddCard,
  onCloseEditCard,
  onSaveNewCard,
  onUpdateCard,
  onRequestDelete,
}: CardDialogsProps) {
  return (
    <>
      <AddCardModal
        key={isAddCardOpen ? "add-card-open" : "add-card-closed"}
        open={isAddCardOpen}
        onClose={onCloseAddCard}
        onSave={onSaveNewCard}
      />
      <EditCardModal
        key={activeCard?.id ?? "no-card"}
        open={isEditCardOpen}
        card={activeCard?.details ?? null}
        onClose={onCloseEditCard}
        onSave={onUpdateCard}
        onDelete={onRequestDelete}
      />
    </>
  );
}

type ArchiveCardDialogProps = {
  accountName: string | undefined;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ArchiveCardDialog({ accountName, saving, onClose, onConfirm }: ArchiveCardDialogProps) {
  return (
    <Dialog
      label="Archive cash register"
      onClose={onClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>Archive cash register?</h2>
          <p>The cash register will be removed from active views. Its entries stay in the history.</p>
        </div>
        <button
          type="button"
          className={dlg.closeButton}
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
        <p className={styles.confirmationName}>{accountName}</p>
      </div>
      <footer className={dlg.footer}>
        <button
          type="button"
          className={dlg.secondaryButton}
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className={dlg.destructiveButton}
          onClick={onConfirm}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "Archiving" : "Archive cash register"}
        </button>
      </footer>
    </Dialog>
  );
}

type CashCountSectionProps = {
  isOpen: boolean;
  activeCardId: string | undefined;
  cashBox: CashBox;
  onClose: () => void;
  onSave: (input: CashCountInput) => Promise<SaveCashCountResult>;
};

function CashCountSection({ isOpen, activeCardId, cashBox, onClose, onSave }: CashCountSectionProps) {
  if (!isOpen) return null;

  return (
    <CashCountDialog
      key={`cash-count-${activeCardId ?? "no-card"}`}
      cashBox={cashBox}
      formatMoney={dollar}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

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
