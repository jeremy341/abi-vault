"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Banknote, Trash2, X } from "lucide-react";
import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import AdaptiveFundsView from "@/components/presentation/AdaptiveFundsView";
import { Dialog } from "@/components/ui/dialog";
import { LoadingStatus } from "@/components/ui/loading-state";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import adaptiveStyles from "./funds-adaptive.module.css";
import styles from "./funds.module.css";
import { getDashboardSnapshot, listCashCountsForCurrentOrganization, type CashCountListItem } from "@/features/finance/actions/queries";
import { cachedFinanceQuery, getFinanceCacheState } from "@/lib/finance/client-cache";
import { invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { archiveWallet, createWallet, updateWallet } from "@/features/finance/actions/wallets";
import { recordCashCount } from "@/features/finance/actions/cash-counts";
import { parseEuroToMinor } from "@/lib/finance/money";
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
    ? "Heute"
    : date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapWalletToCashBox(wallet: WalletWithCount): CashBox {
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

function mapCashCountToAuditEntry(item: CashCountListItem): CashAuditEntry {
  return {
    id: item.id,
    date: formatCountDate(item.createdAt),
    auditor: item.countedByName ?? "Unbekannt",
    countedAmount: Number(item.countedAmountMinor) / 100,
    bookBalance: Number(item.bookAmountMinor) / 100,
    difference: Number(item.differenceMinor) / 100,
    note: item.note ?? undefined,
  };
}

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euro = (value: number) => money.format(value);

export default function FundsPage() {
  const mode = usePresentationMode();
  const { userId, orgId } = useAuth();
  const cacheScope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  type DashboardResult = Awaited<ReturnType<typeof getDashboardSnapshot>>;
  const initialSnapshot = getFinanceCacheState<DashboardResult>("dashboard-snapshot", cacheScope);
  type CashCountResult = Awaited<ReturnType<typeof listCashCountsForCurrentOrganization>>;
  const initialCashCounts = getFinanceCacheState<CashCountResult>("cash-counts", cacheScope);
  const initialWallets = initialSnapshot.data?.ok ? initialSnapshot.data.wallets : [];
  const [cards, setCards] = useState<DashboardCard[]>(() => initialWallets.map(mapWalletToCashRegisterCard));
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cashBoxes, setCashBoxes] = useState<Record<string, CashBox>>(() => Object.fromEntries(initialWallets.map((wallet) => [wallet.id, mapWalletToCashBox(wallet)])));
  const [auditLogs, setAuditLogs] = useState<CashAuditEntry[]>(() => initialCashCounts.data?.ok ? initialCashCounts.data.items.map(mapCashCountToAuditEntry) : []);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(!initialSnapshot.data?.ok);
  const [loadError, setLoadError] = useState("");

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

  const loadWallets = useCallback(async () => {
    try {
      const result = await cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, { scope: cacheScope });
      if (!result.ok) {
        setLoadError("Die Kassen konnten nicht geladen werden.");
        return;
      }

      setLoadError("");
      const cashWallets = result.wallets.filter((item) => item.type === "cash");
      setCards(cashWallets.map(mapWalletToCashRegisterCard));
      setCashBoxes(Object.fromEntries(cashWallets.map((wallet) => [wallet.id, mapWalletToCashBox(wallet)])));
      setActiveCardIndex((current) => Math.min(current, Math.max(0, cashWallets.length - 1)));
    } catch {
      setLoadError("Die Kassen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [cacheScope]);

  const loadCashCounts = useCallback(async () => {
    try {
      const result = await cachedFinanceQuery("cash-counts", listCashCountsForCurrentOrganization, { scope: cacheScope });
      if (result.ok) setAuditLogs(result.items.map(mapCashCountToAuditEntry));
    } catch {
      // The Kasse data remains usable when the optional audit history is unavailable.
    }
  }, [cacheScope]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWallets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWallets]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCashCounts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCashCounts]);

  const retryWallets = useCallback(() => {
    invalidateFinanceQuery("wallets", "cash-counts", "dashboard-snapshot", "transactions", "report-snapshot", "report-kpis");
    setLoadError("");
    setLoading(true);
    void loadWallets();
  }, [loadWallets]);

  const closeAddCardDialog = useCallback(() => setIsAddCardOpen(false), []);
  const closeEditCardDialog = useCallback(() => setIsEditCardOpen(false), []);
  const closeDeleteDialog = useCallback(() => setIsDeleteOpen(false), []);
  const closeCountDialog = useCallback(() => setIsCountOpen(false), []);
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
      return parseEuroToMinor(countedAmountInput);
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
    setNotice("Kasse hinzugefügt.");
    return true;
  }

  async function handleUpdateCard(details: AccountCardDetails): Promise<boolean> {
    if (!activeCard) return false;
    const result = await updateWallet({
      walletId: activeCard.id,
      name: details.accountName,
      reason: "Kasse über die Kassenverwaltung aktualisiert",
      cardNumberVisual: details.cardNumber,
      cardHolderVisual: details.holder,
      cardExpiryVisual: details.expiry,
      cardColorVisual: details.color,
    });
    if (!result.success) {
      setNotice("Kartendaten konnten nicht gespeichert werden.");
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
    setNotice("Kartendaten gespeichert.");
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
        reason: "Kasse über die Kassenverwaltung archiviert",
      });
      if (!result.success) {
        setNotice("Kasse konnte nicht archiviert werden.");
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
      setNotice("Kasse archiviert.");
    } catch {
      setNotice("Kasse konnte nicht archiviert werden.");
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
      setCountError("Bitte einen gültigen Zählbetrag eingeben.");
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
        setCountError("Der Kassensturz konnte nicht gespeichert werden.");
        return;
      }
    }

    setCashBoxes((current) => ({
      ...current,
      [cashBox.id]: {
        ...cashBox,
        lastCountDate: "Heute",
        countStatus: status,
        difference,
        responsible: auditor,
      },
    }));
    setAuditLogs((current) => [
      {
        id: `audit-${Date.now()}`,
        date: "Heute",
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
    void loadWallets();
    void loadCashCounts();
    setNotice("Kassensturz gespeichert.");
    } catch {
      setCountError("Der Kassensturz konnte nicht gespeichert werden.");
    } finally {
      setCountSaving(false);
    }
  }

  return (
    <section
      className={`${adaptiveStyles.root} ${mode === "desktop" ? adaptiveStyles.desktopPageRoot : ""}`}
    >
      <LoadingStatus loading={loading} label="Kasse wird geladen…" />
      <p className={styles.liveNotice} aria-live="polite">
        {notice}
      </p>

      <AdaptiveFundsView
        mode={mode}
        loading={loading}
        error={loadError || null}
        onRetry={retryWallets}
        cards={cards}
        activeCard={activeCard}
        activeCardIndex={safeIndex}
        cashBox={cashBox}
        auditLogs={auditLogs}
        activities={[]}
        euro={euro}
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
          label="Kasse archivieren"
          onClose={closeDeleteDialog}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${styles.confirmationModal}`}
        >
          <header className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              <span className={styles.dangerIcon}>
                <Trash2 aria-hidden="true" />
              </span>
              <div>
                <h2>Kasse archivieren?</h2>
                <p>Die Kasse wird aus den aktiven Ansichten entfernt. Historische Buchungen bleiben erhalten.</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeDeleteDialog}
              disabled={deleteSaving}
              aria-label="Schließen"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={styles.confirmationBody}>
            <strong>{activeCard?.details.accountName}</strong>
            <span>Ledger-basiert · Kartendarstellung</span>
          </div>
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeDeleteDialog}
              disabled={deleteSaving}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={styles.destructiveButton}
              onClick={confirmDeleteCard}
              disabled={deleteSaving}
              aria-busy={deleteSaving}
            >
              {deleteSaving ? "Wird archiviert …" : "Kasse archivieren"}
            </button>
          </footer>
        </Dialog>
      ) : null}

      {isCountOpen ? (
        <Dialog
          label="Kassenzählung durchführen"
          onClose={closeCountDialog}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode !== "desktop" ? adaptiveStyles.adaptiveDialog : ""}`}
        >
          <form onSubmit={handleSaveCount} noValidate>
            <header className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span>
                  <Banknote aria-hidden="true" />
                </span>
                <div>
                  <h2>Kassensturz erfassen</h2>
                  <p>Bargeld zählen und mit dem Buchbestand abgleichen.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeCountDialog}
                disabled={countSaving}
                aria-label="Schließen"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.modalBody}>
              <div
                className={styles.modeTabs}
                role="tablist"
                aria-label="Zählmethode"
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
                  Gesamtbetrag
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
                  Stückelung
                </button>
              </div>

              {countMode === "direct" ? (
                <div
                  id="count-direct-panel"
                  className={styles.formGrid}
                  role="tabpanel"
                  aria-label="Gesamtbetrag"
                >
                  <label className={styles.formField}>
                    <span>Gezählter Betrag</span>
                    <div className={styles.amountField}>
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
                        placeholder="0,00"
                      />
                      <span>€</span>
                    </div>
                  </label>
                  <label className={styles.formField}>
                    <span>Gezählt von</span>
                    <input
                      name="auditor"
                      type="text"
                      autoComplete="off"
                      required
                      value={countPerson}
                      onChange={(event) => setCountPerson(event.target.value)}
                      placeholder="Name der prüfenden Person"
                    />
                  </label>
                </div>
              ) : (
                <div
                  id="count-calculator-panel"
                  className={styles.denominationGrid}
                  role="tabpanel"
                  aria-label="Stückelung"
                >
                  {[
                    ["50", "50 € Scheine"],
                    ["20", "20 € Scheine"],
                    ["10", "10 € Scheine"],
                    ["5", "5 € Scheine"],
                    ["2", "2 € Münzen"],
                    ["1", "1 € Münzen"],
                    ["0.5", "0,50 € Münzen"],
                    ["0.2", "0,20 € Münzen"],
                    ["0.1", "0,10 € Münzen"],
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
                    </label>
                  ))}
                </div>
              )}

              <label className={`${styles.formField} ${styles.formFieldFull}`}>
                <span>Notiz oder Anlass</span>
                <input
                  name="countNote"
                  type="text"
                  autoComplete="off"
                  value={countNote}
                  onChange={(event) => setCountNote(event.target.value)}
                  placeholder="Zum Beispiel Kuchenverkauf"
                />
              </label>

              <div className={styles.countPreview} aria-label="Zählvorschau">
                <div><span>Buchbestand</span><strong>{euro(cashBox.balance)}</strong></div>
                <div><span>Gezählt</span><strong>{euro(activeCountedAmount)}</strong></div>
                <div>
                  <span>Differenz</span>
                  <strong className={Math.abs(currentDiffPreview) < 0.01 ? styles.positive : styles.negative}>
                    {currentDiffPreview > 0 ? "+" : ""}{euro(currentDiffPreview)}
                  </strong>
                </div>
              </div>

              {countError ? (
                <p
                  id="count-form-error"
                  className={styles.formError}
                  role="alert"
                >
                  {countError}
                </p>
              ) : null}
            </div>

            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeCountDialog}
                disabled={countSaving}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton} disabled={countSaving} aria-busy={countSaving}>
                {countSaving ? "Wird gespeichert …" : "Kassensturz speichern"}
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}

    </section>
  );
}
