"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Banknote, Trash2, X } from "lucide-react";
import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import AdaptiveFundsView from "@/components/presentation/AdaptiveFundsView";
import { Dialog } from "@/components/ui/dialog";
import { InlineLoading, LoadingStatus } from "@/components/ui/loading-state";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import adaptiveStyles from "./funds-adaptive.module.css";
import styles from "./funds.module.css";
import { listWalletsForCurrentOrganization } from "@/features/finance/actions/queries";
import { archiveWallet, createWallet, updateWallet } from "@/features/finance/actions/wallets";
import { recordCashCount } from "@/features/finance/actions/cash-counts";
import { createTransfer } from "@/features/finance/actions/transfers";

type DashboardCard = {
  id: string;
  details: AccountCardDetails;
  balance: number;
  iban: string;
  bic: string;
  bankName: string;
  status: string;
  lastSync: string;
};

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

const initialCards: DashboardCard[] = [
  {
    id: "bank-1",
    details: {
      accountName: "Bankkonto",
      cardNumber: "5789 1234 5678 2847",
      holder: "Mike Smith",
      expiry: "06/21",
      color: "#111114",
    },
    balance: 2850.75,
    iban: "DE89 3704 0044 0532 0143 21",
    bic: "COBADEFFXXX",
    bankName: "Sparkasse KölnBonn",
    status: "Bankkonto · API verbunden",
    lastSync: "Heute, 14:32 Uhr",
  },
  {
    id: "bank-2",
    details: {
      accountName: "Reservekonto",
      cardNumber: "4921 3456 7890 6710",
      holder: "Abi Komitee",
      expiry: "08/28",
      color: "#3b3b40",
    },
    balance: 705.55,
    iban: "DE21 3704 0044 0532 0143 89",
    bic: "COBADEFFXXX",
    bankName: "Sparkasse KölnBonn",
    status: "Bankkonto · API verbunden",
    lastSync: "Heute, 09:40 Uhr",
  },
];

const initialCashBox: CashBox = {
  id: "cash-1",
  name: "Barkasse Hauptkasse",
  balance: 625.25,
  responsible: "Max Müller",
  lastCountDate: "15.05.2024",
  countStatus: "matched",
  difference: 0,
};

const initialAuditLogs: CashAuditEntry[] = [
  {
    id: "audit-1",
    date: "15.05.2024",
    auditor: "Max Müller",
    countedAmount: 625.25,
    bookBalance: 625.25,
    difference: 0,
    note: "Regulärer Kassenabgleich",
  },
  {
    id: "audit-2",
    date: "30.04.2024",
    auditor: "Lisa Schmidt",
    countedAmount: 510,
    bookBalance: 510,
    difference: 0,
    note: "Nach Kuchenverkauf",
  },
  {
    id: "audit-3",
    date: "15.04.2024",
    auditor: "Max Müller",
    countedAmount: 340.5,
    bookBalance: 340.5,
    difference: 0,
    note: "Monatsabschluss",
  },
];

const recentAccountActivity = [
  {
    label: "Kassenprüfung",
    meta: "Barkasse",
    date: "15.05.2024, 18:32",
    type: "Kassenzählung",
    description: "Barkasse gezählt",
    user: "Max Müller",
    amount: 625.25,
  },
  {
    label: "Umbuchung",
    meta: "Klassenkonto",
    date: "15.05.2024, 16:05",
    type: "Umbuchung",
    description: "Umbuchung an Barkasse",
    user: "Max Müller",
    amount: -500,
  },
  {
    label: "Mitgliedsbeitrag",
    meta: "Klassenkonto",
    date: "15.05.2024, 09:12",
    type: "Geldeingang",
    description: "Überweisung Mitgliedsbeitrag",
    user: "System",
    amount: 150,
  },
  {
    label: "Kassenprüfung",
    meta: "Barkasse",
    date: "14.05.2024, 14:48",
    type: "Kassenzählung",
    description: "Barkasse gezählt",
    user: "Max Müller",
    amount: 600,
  },
  {
    label: "Umbuchung",
    meta: "Klassenkonto",
    date: "13.05.2024, 11:23",
    type: "Umbuchung",
    description: "Umbuchung von Barkasse",
    user: "Max Müller",
    amount: -300,
  },
];

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euro = (value: number) => money.format(value);

export default function FundsPage() {
  const mode = usePresentationMode();
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cashBox, setCashBox] = useState<CashBox>({
    id: "",
    name: "Barkasse",
    balance: 0,
    responsible: "",
    lastCountDate: "",
    countStatus: "matched",
    difference: 0,
  });
  const [auditLogs, setAuditLogs] =
    useState<CashAuditEntry[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [countMode, setCountMode] = useState<"direct" | "calculator">(
    "direct",
  );
  const [countedAmountInput, setCountedAmountInput] = useState(
    cashBox.balance.toString().replace(".", ","),
  );
  const [countPerson, setCountPerson] = useState(cashBox.responsible);
  const [countNote, setCountNote] = useState("");
  const [countError, setCountError] = useState("");
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

  const [transferDirection, setTransferDirection] = useState<
    "bank-to-cash" | "cash-to-bank"
  >("bank-to-cash");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferError, setTransferError] = useState("");

  useEffect(() => {
    let active = true;
    listWalletsForCurrentOrganization()
      .then((result) => {
        if (!active || !result.ok) return;
        const bankWallets = result.items.filter((item) => item.type !== "cash");
        setCards(bankWallets.map((wallet, index) => ({
          id: wallet.id,
          details: {
            accountName: wallet.name,
            cardNumber: `•••• •••• •••• ${wallet.connected?.iban_last4 ?? "0000"}`,
            holder: wallet.connected?.account_holder ?? "Abi Komitee",
            expiry: "—",
            color: index % 2 ? "#3b3b40" : "#111114",
          },
          balance: Number(wallet.balanceMinor) / 100,
          iban: wallet.connected?.iban_last4 ? `•••• ${wallet.connected.iban_last4}` : "",
          bic: wallet.connected?.bic ?? "",
          bankName: wallet.connected?.display_name ?? "Manuelles Konto",
          status: wallet.connected ? "Bankkonto · API verbunden" : "Bankkonto · manuell",
          lastSync: wallet.connected ? "Synchronisierung aktiv" : "Noch nicht synchronisiert",
        })));
        const cash = result.items.find((item) => item.type === "cash");
        if (cash) {
          setCashBox((current) => ({ ...current, id: cash.id, name: cash.name, balance: Number(cash.balanceMinor) / 100 }));
        } else {
          setCashBox((current) => ({ ...current, balance: 0 }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const closeAddCardDialog = useCallback(() => setIsAddCardOpen(false), []);
  const closeEditCardDialog = useCallback(() => setIsEditCardOpen(false), []);
  const closeDeleteDialog = useCallback(() => setIsDeleteOpen(false), []);
  const closeCountDialog = useCallback(() => setIsCountOpen(false), []);
  const closeTransferDialog = useCallback(() => setIsTransferOpen(false), []);

  useEffect(() => {
    if (!isDeleteOpen && !isCountOpen && !isTransferOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCountOpen, isDeleteOpen, isTransferOpen]);

  const safeIndex = Math.min(activeCardIndex, Math.max(0, cards.length - 1));
  const activeCard = cards[safeIndex] ?? cards[0];

  const calculatedDenomSum = useMemo(
    () =>
      Object.entries(denomCounts).reduce(
        (sum, [denomination, count]) =>
          sum + Number.parseFloat(denomination) * (count || 0),
        0,
      ),
    [denomCounts],
  );

  const activeCountedAmount =
    countMode === "calculator"
      ? calculatedDenomSum
      : Number.parseFloat(countedAmountInput.replace(",", ".")) || 0;
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

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setNotice("IBAN kopiert.");
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setNotice("IBAN konnte nicht kopiert werden.");
    }
  }

  async function handleSaveNewCard(details: AccountCardDetails) {
    const persisted = await createWallet({
      name: details.accountName,
      type: "manual_bank",
      responsibleClerkUserId: null,
      bankConnectionId: null,
      idempotencyKey: `wallet-${crypto.randomUUID()}`,
    });
    if (!persisted.success) {
      setNotice("Konto konnte nicht gespeichert werden.");
      return;
    }
    const newCard: DashboardCard = {
      id: persisted.data.id,
      details,
      balance: 0,
      iban: "DE89 3704 0044 **** 0000",
      bic: "COBADEFFXXX",
      bankName: "Klassenkonto",
      status: "Verbunden",
      lastSync: "Heute",
    };
    setCards((current) => [...current, newCard]);
    setActiveCardIndex(cards.length);
    setIsAddCardOpen(false);
    setNotice("Karte hinzugefügt.");
  }

  async function handleUpdateCard(details: AccountCardDetails) {
    if (!activeCard) return;
    const result = await updateWallet({
      walletId: activeCard.id,
      name: details.accountName,
      reason: "Konto über die Kartenverwaltung aktualisiert",
    });
    if (!result.success) {
      setNotice("Kartendaten konnten nicht gespeichert werden.");
      return;
    }
    setCards((current) =>
      current.map((card, index) =>
        index === safeIndex ? { ...card, details } : card,
      ),
    );
    setIsEditCardOpen(false);
    setNotice("Kartendaten gespeichert.");
  }

  function requestDeleteCard() {
    if (cards.length <= 1) {
      setIsEditCardOpen(false);
      setNotice("Mindestens eine Karte muss verbunden bleiben.");
      return;
    }
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
    setIsCountOpen(true);
  }

  function openTransferDialog() {
    setTransferDirection("bank-to-cash");
    setTransferAmount("");
    setTransferNote("");
    setTransferError("");
    setIsTransferOpen(true);
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
    if (!activeCard) return;
    const result = await archiveWallet({
      walletId: activeCard.id,
      reason: "Konto über die Kartenverwaltung archiviert",
    });
    if (!result.success) {
      setNotice("Karte konnte nicht entfernt werden.");
      return;
    }
    setCards((current) =>
      current.filter((_, index) => index !== safeIndex),
    );
    setActiveCardIndex((current) => Math.max(0, current - 1));
    setIsDeleteOpen(false);
    setNotice("Karte entfernt.");
  }

  async function handleSaveCount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (activeCountedAmount < 0) {
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
        note: countNote.trim(),
      });
      if (!persisted.ok) {
        setCountError("Der Kassensturz konnte nicht gespeichert werden.");
        return;
      }
    }

    setCashBox((current) => ({
      ...current,
      lastCountDate: "Heute",
      countStatus: status,
      difference,
      responsible: auditor,
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
    setNotice("Kassensturz gespeichert.");
  }

  async function handleExecuteTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = Number.parseFloat(transferAmount.replace(",", "."));

    if (Number.isNaN(amount) || amount <= 0) {
      setTransferError("Bitte einen gültigen Betrag eingeben.");
      window.requestAnimationFrame(() => {
        (
          form.elements.namedItem(
            "transferAmount",
          ) as HTMLInputElement | null
        )?.focus();
      });
      return;
    }

    const fromWalletId = transferDirection === "bank-to-cash" ? activeCard?.id : cashBox.id;
    const toWalletId = transferDirection === "bank-to-cash" ? cashBox.id : activeCard?.id;
    if (fromWalletId && toWalletId && /^[0-9a-f-]{36}$/i.test(fromWalletId) && /^[0-9a-f-]{36}$/i.test(toWalletId)) {
      const persisted = await createTransfer({
        fromWalletId,
        toWalletId,
        amount: transferAmount,
        note: transferNote,
      });
      if (!persisted.ok) {
        setTransferError("Die Umbuchung konnte nicht gespeichert werden.");
        return;
      }
    }

    if (transferDirection === "bank-to-cash") {
      if (amount > (activeCard?.balance ?? 0)) {
        setTransferError(
          "Nicht genügend Guthaben auf dem Bankkonto verfügbar.",
        );
        window.requestAnimationFrame(() => {
          (
            form.elements.namedItem(
              "transferAmount",
            ) as HTMLInputElement | null
          )?.focus();
        });
        return;
      }
      setCards((current) =>
        current.map((card, index) =>
          index === safeIndex
            ? { ...card, balance: card.balance - amount }
            : card,
        ),
      );
      setCashBox((current) => ({
        ...current,
        balance: current.balance + amount,
      }));
    } else {
      if (amount > cashBox.balance) {
        setTransferError("Nicht genügend Bargeld in der Barkasse vorhanden.");
        window.requestAnimationFrame(() => {
          (
            form.elements.namedItem(
              "transferAmount",
            ) as HTMLInputElement | null
          )?.focus();
        });
        return;
      }
      setCashBox((current) => ({
        ...current,
        balance: current.balance - amount,
      }));
      setCards((current) =>
        current.map((card, index) =>
          index === safeIndex
            ? { ...card, balance: card.balance + amount }
            : card,
        ),
      );
    }

    setTransferAmount("");
    setTransferNote("");
    setTransferError("");
    setIsTransferOpen(false);
    setNotice("Umbuchung durchgeführt.");
  }

  return (
    <section
      className={`${adaptiveStyles.root} ${mode === "desktop" ? adaptiveStyles.desktopPageRoot : ""}`}
      aria-busy={loading}
    >
      <LoadingStatus loading={loading} label="Kasse wird geladen…" />
      {loading ? <div className={adaptiveStyles.loadingOverlay}><InlineLoading label="Kasse wird geladen…" /></div> : null}
      <p className={styles.liveNotice} aria-live="polite">
        {notice}
      </p>

      <AdaptiveFundsView
        mode={mode}
        cards={cards}
        activeCard={activeCard}
        activeCardIndex={safeIndex}
        cashBox={cashBox}
        auditLogs={auditLogs}
        activities={[]}
        copiedField={copiedField}
        euro={euro}
        onSwitchCard={switchCard}
        onSelectCard={selectCard}
        onAddCard={() => setIsAddCardOpen(true)}
        onEditCard={() => setIsEditCardOpen(true)}
        onCountCash={openCountDialog}
        onTransfer={openTransferDialog}
        onCopy={copyToClipboard}
      />

      <AddCardModal
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
          label="Karte löschen"
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
                <h2>Karte löschen?</h2>
                <p>Die Kontodaten werden aus dieser Ansicht entfernt.</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeDeleteDialog}
              aria-label="Schließen"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={styles.confirmationBody}>
            <strong>{activeCard?.details.accountName}</strong>
            <span>{activeCard?.bankName}</span>
          </div>
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeDeleteDialog}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={styles.destructiveButton}
              onClick={confirmDeleteCard}
            >
              Karte löschen
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
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton}>
                Kassensturz speichern
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}

      {isTransferOpen ? (
        <Dialog
          label="Geld umbuchen"
          onClose={closeTransferDialog}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode !== "desktop" ? adaptiveStyles.adaptiveDialog : ""}`}
        >
          <form onSubmit={handleExecuteTransfer} noValidate>
            <header className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span>
                  <ArrowRightLeft aria-hidden="true" />
                </span>
                <div>
                  <h2>Umbuchung</h2>
                  <p>Geld zwischen Bankkonto und Barkasse verschieben.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeTransferDialog}
                aria-label="Schließen"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Richtung</span>
                  <select
                    name="transferDirection"
                    value={transferDirection}
                    onChange={(event) =>
                      setTransferDirection(
                        event.target.value as
                          | "bank-to-cash"
                          | "cash-to-bank",
                      )
                    }
                  >
                    <option value="bank-to-cash">
                      Bankkonto ({euro(activeCard?.balance ?? 0)}) zu Barkasse
                    </option>
                    <option value="cash-to-bank">
                      Barkasse ({euro(cashBox.balance)}) zu Bankkonto
                    </option>
                  </select>
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Betrag</span>
                  <div className={styles.amountField}>
                    <input
                      name="transferAmount"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      required
                      aria-invalid={Boolean(transferError)}
                      aria-describedby="transfer-form-error"
                      value={transferAmount}
                      onChange={(event) => setTransferAmount(event.target.value)}
                      placeholder="0,00"
                    />
                    <span>€</span>
                  </div>
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Verwendungszweck oder Notiz</span>
                  <input
                    name="transferNote"
                    type="text"
                    autoComplete="off"
                    value={transferNote}
                    onChange={(event) => setTransferNote(event.target.value)}
                    placeholder="Zum Beispiel Wechselgeld"
                  />
                </label>
              </div>
              {transferError ? (
                <p
                  id="transfer-form-error"
                  className={styles.formError}
                  role="alert"
                >
                  {transferError}
                </p>
              ) : null}
            </div>
            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeTransferDialog}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton}>
                Umbuchung bestätigen
              </button>
            </footer>
          </form>
        </Dialog>
      ) : null}
    </section>
  );
}
