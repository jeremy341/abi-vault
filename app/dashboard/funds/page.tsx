"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getDashboardSnapshot, listCashCountsForCurrentOrganization, type CashCountListItem } from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { archiveWallet, createWallet, updateWallet } from "@/features/finance/actions/wallets";
import { recordCashCount } from "@/features/finance/actions/cash-counts";
import { parseDollarToMinor } from "@/lib/finance/money";
import { calculateCashDenominationMinor } from "@/lib/finance/cash-count";
import {
  mapWalletToCashRegisterCard,
  type CashRegisterCard,
} from "@/lib/finance/cash-register-card";

type DashboardCard = CashRegisterCard;

type CashBox = {
  id: string;
  name: string;
  balance: number;
  responsible: string;
  lastCountDate: string;
  countStatus: "matched" | "discrepancy";
  difference: number;
};

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

function formatCountDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const today = new Date();

  return date.toDateString() === today.toDateString()
    ? "Today"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toCashBox(wallet: WalletWithCount): CashBox {
  const difference = Number(String(wallet.lastCountDifferenceMinor ?? 0)) / 100;
  const hasCount = Boolean(wallet.lastCountAt);

  return {
    id: wallet.id,
    name: wallet.name,
    balance: Number(wallet.balanceMinor) / 100,
    responsible: wallet.lastCountedByName ?? "",
    lastCountDate: hasCount ? formatCountDate(wallet.lastCountAt!) : "",
    countStatus: Math.abs(difference) < 0.01 ? "matched" : "discrepancy",
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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dollar = (value: number) => money.format(value).replace("-", "−");

export default function FundsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const dashboard = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);
  const cashCounts = useFinanceQuery("cash-counts", listCashCountsForCurrentOrganization, cacheScope);
  const initialWallets = dashboard.data?.ok ? dashboard.data.wallets : [];
  const [cards, setCards] = useState<DashboardCard[]>(() => initialWallets.map(mapWalletToCashRegisterCard));
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cashBoxes, setCashBoxes] = useState<Record<string, CashBox>>(() => Object.fromEntries(initialWallets.map((wallet) => [wallet.id, toCashBox(wallet)])));
  const [auditLogs, setAuditLogs] = useState<CashAuditEntry[]>(() => cashCounts.data?.ok ? cashCounts.data.items.map(toCountEntry) : []);
  const [notice, setNotice] = useState("");
  const loading = dashboard.loading;
  const loadError = dashboard.failed ? "Cash registers could not be loaded." : "";

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [countMode, setCountMode] = useState<"direct" | "calculator">(
    "direct",
  );

  const [countedAmountInput, setCountedAmountInput] = useState("0,00");
  const [countPerson, setCountPerson] = useState("");
  const [countNote, setCountNote] = useState("");
  const [countError, setCountError] = useState("");
  const [countSaving, setCountSaving] = useState(false);
  const countIdempotencyKey = useRef<string | null>(null);

  const [denomCounts, setDenomCounts] = useState<Record<string, number>>({
    "50": 0,
    "20": 0,
    "10": 0,
    "5": 0,
    "2": 0,
    "1": 0,
    "0.5": 0,
    "0.2": 0,
    "0.1": 0,
  });

  useEffect(() => {
    if (!dashboard.data?.ok) return;

    const cashWallets = dashboard.data.wallets.filter((wallet) => wallet.type === "cash");
    setCards(cashWallets.map(mapWalletToCashRegisterCard));
    setCashBoxes(Object.fromEntries(cashWallets.map((wallet) => [wallet.id, toCashBox(wallet)])));
    setActiveCardIndex((current) => Math.min(current, Math.max(0, cashWallets.length - 1)));
  }, [dashboard.data]);

  useEffect(() => {
    if (cashCounts.data?.ok) setAuditLogs(cashCounts.data.items.map(toCountEntry));
  }, [cashCounts.data]);

  function refreshCashRegisters() {
    dashboard.refetch();
    cashCounts.refetch();
  }

  function retryWallets() {
    dashboard.refetch();
    cashCounts.refetch();
  }

  const closeAddCardDialog = () => setIsAddCardOpen(false);
  const closeEditCardDialog = () => setIsEditCardOpen(false);
  const closeDeleteDialog = () => setIsDeleteOpen(false);
  const closeCountDialog = () => setIsCountOpen(false);
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

  const cashBox: CashBox = activeCard
    ? cashBoxes[activeCard.id] ?? {
      id: activeCard.id,
      name: activeCard.details.accountName,
      balance: activeCard.balance,
      responsible: "",
      lastCountDate: "",
      countStatus: "matched",
      difference: 0,
    }
    : {
      id: "",
      name: "",
      balance: 0,
      responsible: "",
      lastCountDate: "",
      countStatus: "matched",
      difference: 0,
    };

  const calculatedDenomMinor = useMemo(
    () => calculateCashDenominationMinor(denomCounts),
    [denomCounts],
  );

  const directCountedMinor = useMemo(() => {
    try {
      return parseDollarToMinor(countedAmountInput);
    } catch {
      return null;
    }
  }, [countedAmountInput]);

  const activeCountedAmount =
    countMode === "calculator"
      ? calculatedDenomMinor / 100
      : directCountedMinor === null ? 0 : Number(directCountedMinor) / 100;

  const activeCountedAmountValid = countMode === "calculator" || directCountedMinor !== null;
  const currentDiffPreview = activeCountedAmount - cashBox.balance;

  function switchCard(direction: -1 | 1) {
    if (cards.length <= 1) return;
    setActiveCardIndex(
      (current) =>
        (current + direction + cards.length) % cards.length,
    );
  }

  function selectCard(index: number) {
    setActiveCardIndex(index);
  }

  async function handleSaveNewCard(details: AccountCardDetails, idempotencyKey: string) {
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

    const newCard: DashboardCard = {
      id: persisted.data.id,
      details,
      balance: 0,
    };

    setCards((current) => [...current, newCard]);
    setCashBoxes((current) => ({
      ...current,
      [newCard.id]: {
        id: newCard.id,
        name: details.accountName,
        balance: 0,
        responsible: "",
        lastCountDate: "",
        countStatus: "matched",
        difference: 0,
      },
    }));
    setActiveCardIndex(cards.length);
    setIsAddCardOpen(false);
    invalidateFinanceQuery("wallets", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
    setNotice("Cash register added.");

    return true;
  }

  async function handleUpdateCard(details: AccountCardDetails): Promise<boolean> {
    if (!activeCard) return false;

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

    setCards((current) =>
      current.map((card, index) =>
        index === safeIndex ? { ...card, details } : card,
      ),
    );
    setCashBoxes((current) => ({
      ...current,
      [activeCard.id]: { ...cashBox, name: details.accountName },
    }));
    setIsEditCardOpen(false);
    invalidateFinanceQuery("wallets", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
    setNotice("Cash register saved.");

    return true;
  }

  function requestDeleteCard() {
    setIsEditCardOpen(false);
    setIsDeleteOpen(true);
  }

  function openCountDialog() {
    setCountMode("direct");
    setCountedAmountInput(cashBox.balance.toFixed(2).replace(".", ","));
    setCountPerson(cashBox.responsible);
    setCountNote("");
    setCountError("");
    setDenomCounts({
      "50": 0,
      "20": 0,
      "10": 0,
      "5": 0,
      "2": 0,
      "1": 0,
      "0.5": 0,
      "0.2": 0,
      "0.1": 0,
    });
    countIdempotencyKey.current = `count-${activeCard?.id ?? "new"}-${crypto.randomUUID()}`;
    setIsCountOpen(true);
  }

  function handleCountModeKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    modeToSelect: "direct" | "calculator",
  ) {
    if (![
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextMode = modeToSelect === "direct" ? "calculator" : "direct";
    setCountMode(nextMode);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
    [nextMode === "direct" ? 0 : 1]?.focus();
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

      setCards((current) =>
        current.filter((_, index) => index !== safeIndex),
      );
      setCashBoxes((current) => {
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

  async function handleSaveCount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (countSaving) return;
    setCountSaving(true);

    try {
    const form = event.currentTarget;

    if (!activeCountedAmountValid || activeCountedAmount < 0) {
      setCountError("Enter a valid counted amount.");
      window.requestAnimationFrame(() => {
        (
          form.elements.namedItem(
            "countedAmount",
          ) as HTMLInputElement | null
        )?.focus();
      });

      return;
    }

    const difference = activeCountedAmount - cashBox.balance;

    const status =
      Math.abs(difference) < 0.01 ? "matched" : "discrepancy";

    const auditor = countPerson.trim() || cashBox.responsible;

    if (/^[0-9a-f-]{36}$/i.test(cashBox.id)) {
      const persisted = await recordCashCount({
        walletId: cashBox.id,
        countedAmount: String(activeCountedAmount).replace(".", ","),
        auditor: countPerson.trim(),
        note: countNote.trim(),
        idempotencyKey: countIdempotencyKey.current ?? `count-${cashBox.id}-${crypto.randomUUID()}`,
      });

      if (!persisted.ok) {
        setCountError("The cash count could not be saved.");

        return;
      }
    }

    setCashBoxes((current) => ({
      ...current,
      [cashBox.id]: {
        ...cashBox,
        lastCountDate: "Today",
        countStatus: status,
        difference,
        responsible: auditor,
      },
    }));
    setAuditLogs((current) => [
      {
        id: `audit-${Date.now()}`,
        date: "Today",
        auditor,
        countedAmount: activeCountedAmount,
        bookBalance: cashBox.balance,
        difference,
        note: countNote.trim() || undefined,
      },
      ...current.slice(0, 4),
    ]);
    setCountError("");
    setIsCountOpen(false);
    countIdempotencyKey.current = null;
    invalidateFinanceQuery("wallets", "cash-counts", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
    refreshCashRegisters();
    setNotice("Cash count saved.");
    } catch {
      setCountError("The cash count could not be saved.");
    } finally {
      setCountSaving(false);
    }
  }

  return (
    <section>
      <LoadingStatus loading={loading} label="Loading cash registers" />
      <p className={styles.liveNotice} aria-live="polite">
        {notice}
      </p>

      <FundsView
        loading={loading}
        error={loadError || null}
        onRetry={retryWallets}
        cards={cards}
        activeCard={activeCard}
        activeCardIndex={safeIndex}
        cashBox={cashBox}
        auditLogs={auditLogs}
        activities={[]}
        dollar={dollar}
        onSwitchCard={switchCard}
        onSelectCard={selectCard}
        onAddCard={() => setIsAddCardOpen(true)}
        onEditCard={() => setIsEditCardOpen(true)}
        onCountCash={openCountDialog}
      />

      <AddCardModal
        key={isAddCardOpen ? "add-card-open" : "add-card-closed"}
        open={isAddCardOpen}
        onClose={closeAddCardDialog}
        onSave={handleSaveNewCard}
      />
      <EditCardModal
        key={activeCard?.id ?? "no-card"}
        open={isEditCardOpen}
        card={activeCard?.details ?? null}
        onClose={closeEditCardDialog}
        onSave={handleUpdateCard}
        onDelete={requestDeleteCard}
      />

      {isDeleteOpen ? (
        <Dialog
          label="Archive cash register"
          onClose={closeDeleteDialog}
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
              onClick={closeDeleteDialog}
              disabled={deleteSaving}
              aria-label="Close"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={dlg.body}>
            <p className={styles.confirmationName}>{activeCard?.details.accountName}</p>
          </div>
          <footer className={dlg.footer}>
            <button
              type="button"
              className={dlg.secondaryButton}
              onClick={closeDeleteDialog}
              disabled={deleteSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dlg.destructiveButton}
              onClick={confirmDeleteCard}
              disabled={deleteSaving}
              aria-busy={deleteSaving}
            >
              {deleteSaving ? "Archiving" : "Archive cash register"}
            </button>
          </footer>
        </Dialog>
      ) : null}

      {isCountOpen ? (
        <Dialog
          label="Record cash count"
          onClose={closeCountDialog}
          overlayClassName={dlg.overlay}
          dialogClassName={`${dlg.modal} ${dlg.modalWide}`}
        >
          <form onSubmit={handleSaveCount} noValidate>
            <header className={dlg.header}>
              <div className={dlg.heading}>
                <h2>Record cash count</h2>
                <p>Count the cash and compare it with the book balance.</p>
              </div>
              <button
                type="button"
                className={dlg.closeButton}
                onClick={closeCountDialog}
                disabled={countSaving}
                aria-label="Close"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={dlg.body}>
              <div
                className={styles.modeTabs}
                role="tablist"
                aria-label="Counting method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={countMode === "direct"}
                  aria-controls="count-direct-panel"
                  tabIndex={countMode === "direct" ? 0 : -1}
                  onKeyDown={(event) =>
                    handleCountModeKeyDown(event, "direct")
                  }
                  onClick={() => setCountMode("direct")}
                >
                  Total amount
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={countMode === "calculator"}
                  aria-controls="count-calculator-panel"
                  tabIndex={countMode === "calculator" ? 0 : -1}
                  onKeyDown={(event) =>
                    handleCountModeKeyDown(event, "calculator")
                  }
                  onClick={() => setCountMode("calculator")}
                >
                  Denominations
                </button>
              </div>

              {countMode === "direct" ? (
                <div
                  id="count-direct-panel"
                  role="tabpanel"
                  aria-label="Total amount"
                >
                  <label className={dlg.field}>
                    <span>Counted amount</span>
                    <div className={dlg.amountField}>
                      <input
                        name="countedAmount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        required
                        aria-invalid={Boolean(countError)}
                        aria-describedby="count-form-error"
                        value={countedAmountInput}
                        onChange={(event) =>
                          setCountedAmountInput(event.target.value)
                        }
                        placeholder="0.00"
                      />
                      <span>$</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div
                  id="count-calculator-panel"
                  className={styles.denominationGrid}
                  role="tabpanel"
                  aria-label="Denominations"
                >
                  {[
                    ["50", "$50 bills"],
                    ["20", "$20 bills"],
                    ["10", "$10 bills"],
                    ["5", "$5 bills"],
                    ["2", "$2 coins"],
                    ["1", "$1 coins"],
                    ["0.5", "$0.50 coins"],
                    ["0.2", "$0.20 coins"],
                    ["0.1", "$0.10 coins"],
                  ].map(([denomination, label]) => (
                    <label className={styles.denominationItem} key={denomination}>
                      <span>{label}</span>
                      <input
                        name={`denomination-${denomination}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        autoComplete="off"
                        value={denomCounts[denomination] || ""}
                        onChange={(event) =>
                          setDenomCounts((current) => ({
                            ...current,
                            [denomination]:
                              Number.parseInt(event.target.value, 10) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                      <output className={styles.denominationTotal}>
                        {dollar((denomCounts[denomination] || 0) * Number(denomination))}
                      </output>
                    </label>
                  ))}
                </div>
              )}

              <div className={dlg.formGrid}>
              <label className={dlg.field}>
                <span>Counted by</span>
                <input
                  name="auditor"
                  type="text"
                  autoComplete="off"
                  required
                  value={countPerson}
                  onChange={(event) => setCountPerson(event.target.value)}
                  placeholder="Name of the person checking"
                />
              </label>
              <label className={dlg.field}>
                <span>Note or reason</span>
                <input
                  name="countNote"
                  type="text"
                  autoComplete="off"
                  value={countNote}
                  onChange={(event) => setCountNote(event.target.value)}
                  placeholder="For example, cake sale"
                />
              </label>
              </div>

              <dl className={styles.countPreview} aria-label="Count preview">
                <div>
                  <dt>Book balance</dt>
                  <dd>{dollar(cashBox.balance)}</dd>
                </div>
                <div>
                  <dt>Counted</dt>
                  <dd className="total-rule">{dollar(activeCountedAmount)}</dd>
                </div>
                <div>
                  <dt>Difference</dt>
                  <dd className={Math.abs(currentDiffPreview) < 0.01 ? styles.positive : styles.negative}>
                    {currentDiffPreview > 0 ? "+" : ""}{dollar(currentDiffPreview)}
                  </dd>
                </div>
              </dl>

              {countError ? (
                <p
                  id="count-form-error"
                  className={dlg.error}
                  role="alert"
                >
                  {countError}
                </p>
              ) : null}
            </div>

            <footer className={dlg.footer}>
              <button
                type="button"
                className={dlg.secondaryButton}
                onClick={closeCountDialog}
                disabled={countSaving}
              >
                Cancel
              </button>
              <button type="submit" className={dlg.primaryButton} disabled={countSaving} aria-busy={countSaving}>
                {countSaving ? "Saving" : "Save cash count"}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}

    </section>
  );
}
