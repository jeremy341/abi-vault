"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import styles from "./funds.module.css";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import cardStyles from "@/components/dashboard/AccountCard.module.css";
import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdaptiveFundsView from "@/components/presentation/AdaptiveFundsView";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import adaptiveStyles from "./funds-adaptive.module.css";

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
    countedAmount: 510.0,
    bookBalance: 510.0,
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

const euro = (val: number) =>
  val.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

export default function FundsPage() {
  const mode = usePresentationMode();
  const [cards, setCards] = useState<DashboardCard[]>(initialCards);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cashBox, setCashBox] = useState<CashBox>(initialCashBox);
  const [auditLogs, setAuditLogs] =
    useState<CashAuditEntry[]>(initialAuditLogs);

  // Copied State for Banking Details
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Cash Count Form with Denomination
  const [countMode, setCountMode] = useState<"direct" | "calculator">("direct");
  const [countedAmountInput, setCountedAmountInput] = useState(
    cashBox.balance.toString().replace(".", ","),
  );
  const [countPerson, setCountPerson] = useState(cashBox.responsible);
  const [countNote, setCountNote] = useState("");
  const [countError, setCountError] = useState("");

  // Denominations Breakdown: 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10
  const [denomCounts, setDenomCounts] = useState<{ [key: string]: number }>({
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

  // Transfer Form
  const [transferDirection, setTransferDirection] = useState<
    "bank-to-cash" | "cash-to-bank"
  >("bank-to-cash");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferError, setTransferError] = useState("");

  // Active Card Reference
  const safeIndex = Math.min(activeCardIndex, Math.max(0, cards.length - 1));
  const activeCard = cards[safeIndex] ?? cards[0];

  // Carousel navigation
  function switchCard(direction: -1 | 1) {
    if (cards.length <= 1) return;
    setActiveCardIndex(
      (curr) => (curr + direction + cards.length) % cards.length,
    );
  }

  // Copy helper
  function copyToClipboard(text: string, fieldId: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Save new card
  function handleSaveNewCard(details: AccountCardDetails) {
    const newCard: DashboardCard = {
      id: `bank-${Date.now()}`,
      details,
      balance: 0,
      iban: "DE89 3704 0044 **** 0000",
      bic: "COBADEFFXXX",
      bankName: "Klassenkonto",
      status: "Verbunden",
      lastSync: "Heute",
    };
    setCards((prev) => [...prev, newCard]);
    setActiveCardIndex(cards.length);
    setIsAddCardOpen(false);
  }

  // Update card
  function handleUpdateCard(details: AccountCardDetails) {
    if (!activeCard) return;
    setCards((prev) =>
      prev.map((c, idx) => (idx === safeIndex ? { ...c, details } : c)),
    );
    setIsEditCardOpen(false);
  }

  // Delete card
  function handleDeleteCard() {
    if (cards.length <= 1) {
      alert("Es muss mindestens eine Karte konfiguriert bleiben.");
      return;
    }
    setCards((prev) => prev.filter((_, idx) => idx !== safeIndex));
    setActiveCardIndex((curr) => Math.max(0, curr - 1));
    setIsEditCardOpen(false);
  }

  // Calculated sum from Denomination Calculator
  const calculatedDenomSum = useMemo(() => {
    return Object.entries(denomCounts).reduce((sum, [denom, count]) => {
      return sum + parseFloat(denom) * (count || 0);
    }, 0);
  }, [denomCounts]);

  const activeCountedAmount =
    countMode === "calculator"
      ? calculatedDenomSum
      : parseFloat(countedAmountInput.replace(",", ".")) || 0;

  const currentDiffPreview = activeCountedAmount - cashBox.balance;

  // Handle Cash Count Save
  function handleSaveCount(e: React.FormEvent) {
    e.preventDefault();
    if (activeCountedAmount < 0) {
      setCountError("Bitte einen gültigen Zählbetrag eingeben.");
      return;
    }

    const diff = activeCountedAmount - cashBox.balance;
    const status: "matched" | "discrepancy" =
      Math.abs(diff) < 0.01 ? "matched" : "discrepancy";

    setCashBox((prev) => ({
      ...prev,
      lastCountDate: "Heute",
      countStatus: status,
      difference: diff,
      responsible: countPerson.trim() || prev.responsible,
    }));

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        date: "Heute",
        auditor: countPerson.trim() || "Kassenprüfer",
        countedAmount: activeCountedAmount,
        bookBalance: cashBox.balance,
        difference: diff,
        note: countNote.trim() || undefined,
      },
      ...prev.slice(0, 4),
    ]);

    setIsCountOpen(false);
  }

  // Handle Internal Transfer
  function handleExecuteTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(transferAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Bitte einen gültigen Betrag eingeben.");
      return;
    }

    if (transferDirection === "bank-to-cash") {
      if (amount > (activeCard?.balance ?? 0)) {
        setTransferError(
          "Nicht genügend Guthaben auf dem Bankkonto verfügbar.",
        );
        return;
      }
      setCards((prev) =>
        prev.map((c, idx) =>
          idx === safeIndex ? { ...c, balance: c.balance - amount } : c,
        ),
      );
      setCashBox((prev) => ({ ...prev, balance: prev.balance + amount }));
    } else {
      if (amount > cashBox.balance) {
        setTransferError("Nicht genügend Bargeld in der Barkasse vorhanden.");
        return;
      }
      setCashBox((prev) => ({ ...prev, balance: prev.balance - amount }));
      setCards((prev) =>
        prev.map((c, idx) =>
          idx === safeIndex ? { ...c, balance: c.balance + amount } : c,
        ),
      );
    }

    setIsTransferOpen(false);
    setTransferAmount("");
    setTransferNote("");
    setTransferError("");
  }

  return (
    <section className={mode === "desktop" ? styles.page : adaptiveStyles.root}>
      {mode === "desktop" ? (
        <>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <CreditCard aria-hidden="true" />
              </span>
              <div>
                <span>Gesamt verfügbar</span>
                <strong className={styles.summaryAmount}>
                  {euro((activeCard?.balance ?? 0) + cashBox.balance)}
                </strong>
                <small>Bank und Barkasse</small>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Landmark aria-hidden="true" />
              </span>
              <div>
                <span>Bankguthaben</span>
                <strong className={styles.summaryAmount}>
                  {euro(activeCard?.balance ?? 0)}
                </strong>
                <small>API synchronisiert</small>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Banknote aria-hidden="true" />
              </span>
              <div>
                <span>Bargeldbestand</span>
                <strong className={styles.summaryAmount}>
                  {euro(cashBox.balance)}
                </strong>
                <small>Zuletzt geprüft: {cashBox.lastCountDate}</small>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Check aria-hidden="true" />
              </span>
              <div>
                <span>Abgleich</span>
                <strong className={styles.summaryStatus}>Stimmt</strong>
                <small>Keine Differenz festgestellt</small>
              </div>
            </article>
          </div>

          <Tabs defaultValue="overview" className={styles.financeWorkspace}>
            <header className={styles.workspaceHeader}>
              <div>
                <h2>Finanzverwaltung</h2>
                <p>Konten, Barkasse und Prüfungen an einem Ort.</p>
              </div>
              <TabsList variant="line" className={styles.workspaceTabs}>
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="accounts">Konten & Daten</TabsTrigger>
                <TabsTrigger value="audit">Prüfung & Zugriff</TabsTrigger>
              </TabsList>
            </header>

            <TabsContent value="overview" className={styles.tabContent}>
              <div className={styles.referenceOverviewGrid}>
                <section className={styles.cardShowcasePanel}>
                  <div className={styles.cardShowcaseBody}>
                    <button
                      type="button"
                      className={styles.carouselNav}
                      onClick={() => switchCard(-1)}
                      disabled={cards.length <= 1}
                      aria-label="Vorherige Karte"
                    >
                      <ChevronLeft aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.cardShowcaseSlot}
                      onClick={() => setIsEditCardOpen(true)}
                      aria-label="Karte bearbeiten"
                    >
                      <span
                        key={activeCard?.id ?? "add-card"}
                        className={cardStyles.switchIn}
                      >
                        {activeCard ? (
                          <AccountCard
                            variant="bank"
                            details={activeCard.details}
                            cardColor={activeCard.details.color}
                          />
                        ) : (
                          <AccountCard variant="add" />
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.carouselNav}
                      onClick={() => switchCard(1)}
                      disabled={cards.length <= 1}
                      aria-label="Nächste Karte"
                    >
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.cardPosition}>
                    <i aria-hidden="true" />
                    <span>
                      Karte {safeIndex + 1} von {cards.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddCardOpen(true)}
                      aria-label="Karte hinzufügen"
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                </section>

                <section className={styles.cashOverviewPanel}>
                  <div className={styles.cashOverviewBody}>
                    <h2>Barkasse</h2>
                    <div className={styles.cashOverviewRows}>
                      <div>
                        <span>Aktueller Bestand</span>
                        <strong className={styles.activityPositive}>
                          {euro(cashBox.balance)}
                        </strong>
                      </div>
                      <div>
                        <span>Verantwortlich</span>
                        <strong>{cashBox.responsible}</strong>
                      </div>
                      <div>
                        <span>Letzte Zählung</span>
                        <strong>{cashBox.lastCountDate}, 18:32 Uhr</strong>
                      </div>
                      <div>
                        <span>Gezählt von</span>
                        <strong>{cashBox.responsible}</strong>
                      </div>
                    </div>
                    <div className={styles.cashOverviewActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => setIsCountOpen(true)}
                      >
                        <Banknote aria-hidden="true" />
                        Kasse zählen
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setTransferDirection("cash-to-bank");
                          setIsTransferOpen(true);
                        }}
                      >
                        <ArrowRightLeft aria-hidden="true" />
                        Umbuchung
                      </button>
                    </div>
                  </div>
                </section>

                <section className={styles.reconciliationCard}>
                  <h2>Kassenabgleich</h2>
                  <div className={styles.reconciliationStatus}>
                    <span>
                      <Check aria-hidden="true" />
                    </span>
                    <strong>Stimmt</strong>
                  </div>
                  <div className={styles.reconciliationRows}>
                    <div>
                      <span>Letzte Zählung</span>
                      <strong>{cashBox.lastCountDate}, 18:32 Uhr</strong>
                    </div>
                    <div>
                      <span>Soll (laut Buchhaltung)</span>
                      <strong>{euro(cashBox.balance)}</strong>
                    </div>
                    <div>
                      <span>Ist (gezählt)</span>
                      <strong>{euro(cashBox.balance)}</strong>
                    </div>
                    <div>
                      <span>Differenz</span>
                      <strong>0,00 €</strong>
                    </div>
                  </div>
                  <div className={styles.reconciliationActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => setIsCountOpen(true)}
                    >
                      <Check aria-hidden="true" />
                      Neuen Abgleich durchführen
                    </button>
                  </div>
                </section>
              </div>

              <div className={styles.referenceLowerGrid}>
                <section className={styles.referenceActivityCard}>
                  <header className={styles.referencePanelHeader}>
                    <div>
                      <h2>Letzte Aktivitäten</h2>
                      <p>Aktuelle Bewegungen aus allen Konten</p>
                    </div>
                    <Activity aria-hidden="true" />
                  </header>
                  <div className={styles.referenceActivityRows}>
                    <div className={styles.referenceActivityHeader}>
                      <span>Datum</span>
                      <span>Typ</span>
                      <span>Beschreibung</span>
                      <span>Betrag</span>
                      <span>Benutzer</span>
                    </div>
                    {recentAccountActivity.map((entry) => (
                      <button
                        type="button"
                        className={styles.referenceActivityRow}
                        key={`${entry.label}-${entry.date}`}
                      >
                        <time>{entry.date}</time>
                        <span className={styles.activityType}>
                          {entry.type}
                        </span>
                        <span>{entry.description}</span>
                        <b
                          className={
                            entry.amount > 0
                              ? styles.activityPositive
                              : styles.activityNegative
                          }
                        >
                          {entry.amount > 0 ? "+" : "−"}
                          {euro(Math.abs(entry.amount))}
                        </b>
                        <span>{entry.user}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className={styles.referenceLink}>
                    Alle Aktivitäten anzeigen{" "}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </section>

                <section className={styles.referenceBankDetailsCard}>
                  <header className={styles.referencePanelHeader}>
                    <div>
                      <h2>Bankdetails</h2>
                      <p>Verbundene Kontodaten</p>
                    </div>
                    <Landmark aria-hidden="true" />
                  </header>
                  <div className={styles.referenceBankDetailRow}>
                    <div>
                      <span>IBAN</span>
                      <strong>
                        {activeCard?.iban ?? "DE89 3704 0044 0532 0143 21"}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(activeCard?.iban ?? "", "iban")
                      }
                      aria-label="IBAN kopieren"
                    >
                      {copiedField === "iban" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className={styles.referenceBankDetailRow}>
                    <div>
                      <span>BIC</span>
                      <strong>{activeCard?.bic ?? "COBADEFFXXX"}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(activeCard?.bic ?? "", "bic")
                      }
                      aria-label="BIC kopieren"
                    >
                      {copiedField === "bic" ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </section>
              </div>

              {/* 1. TOP TWO-COLUMN HUB: BANK CARD HUB & CASH BOX HUB */}
              <div className={styles.topHubGrid}>
                {/* LEFT HUB: Bank Card Showcase */}
                <div className={styles.hubCard}>
                  <div className={styles.hubHeader}>
                    <div className={styles.hubTitleGroup}>
                      <span className={styles.hubIconBubble}>
                        <CreditCard aria-hidden="true" />
                      </span>
                      <h2>{activeCard?.details.accountName ?? "Bankkonto"}</h2>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--ui-positive)",
                        background: "var(--ui-positive-soft)",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        fontWeight: 500,
                      }}
                    >
                      ✓ Sparkasse · API synchron
                    </span>
                  </div>

                  <div className={styles.cardDisplayArea}>
                    <div className={styles.cardStage}>
                      {cards.length > 1 && (
                        <button
                          type="button"
                          className={styles.carouselNav}
                          onClick={() => switchCard(-1)}
                          aria-label="Vorherige Karte"
                        >
                          <ChevronLeft aria-hidden="true" />
                        </button>
                      )}

                      <div
                        className={styles.cardSlot}
                        onClick={() => setIsEditCardOpen(true)}
                        title="Klicken zum Bearbeiten"
                      >
                        {activeCard ? (
                          <AccountCard
                            variant="bank"
                            details={activeCard.details}
                            cardColor={activeCard.details.color}
                          />
                        ) : (
                          <AccountCard variant="add" />
                        )}
                      </div>

                      {cards.length > 1 && (
                        <button
                          type="button"
                          className={styles.carouselNav}
                          onClick={() => switchCard(1)}
                          aria-label="Nächste Karte"
                        >
                          <ChevronRight aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Balance & Actions Row */}
                  <div className={styles.cardSummaryRow}>
                    <div className={styles.cardBalanceInfo}>
                      <span>Verfügbares Bankguthaben</span>
                      <strong>{euro(activeCard?.balance ?? 0)}</strong>
                    </div>

                    <div className={styles.cardActionButtons}>
                      <button
                        type="button"
                        className={styles.smallSecondaryButton}
                        onClick={() => setIsEditCardOpen(true)}
                      >
                        <Pencil aria-hidden="true" />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        type="button"
                        className={styles.smallPrimaryButton}
                        onClick={() => {
                          setTransferDirection("bank-to-cash");
                          setTransferError("");
                          setIsTransferOpen(true);
                        }}
                      >
                        <ArrowRightLeft aria-hidden="true" />
                        <span>Bargeld abheben</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT HUB: Cash Box & Cash Verification */}
                <div className={styles.hubCard}>
                  <div className={styles.hubHeader}>
                    <div className={styles.hubTitleGroup}>
                      <span
                        className={`${styles.hubIconBubble} ${styles.hubIconBubbleCash}`}
                      >
                        <Banknote aria-hidden="true" />
                      </span>
                      <h2>{cashBox.name}</h2>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--ui-muted-ink)",
                        background: "rgb(0 0 0 / 0.04)",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        fontWeight: 500,
                      }}
                    >
                      Physische Kasse
                    </span>
                  </div>

                  <div className={styles.cashHubBody}>
                    <div className={styles.cashBalanceHighlight}>
                      <div>
                        <span>Bargeldbestand (Handkasse)</span>
                        <strong>{euro(cashBox.balance)}</strong>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--ui-positive)",
                          fontWeight: 600,
                        }}
                      >
                        100 % abgeglichen
                      </span>
                    </div>

                    <div className={styles.reconcileStatusBox}>
                      <span className={styles.reconcileIcon}>
                        <Check aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Kassenprüfung stimmt überein</strong>
                        <span>
                          Letzter Kassensturz: {cashBox.lastCountDate}
                        </span>
                      </div>
                    </div>

                    <div className={styles.reconcileInfoList}>
                      <div className={styles.reconcileInfoRow}>
                        <span>Verantwortlicher Kassenwart</span>
                        <strong>{cashBox.responsible}</strong>
                      </div>
                      <div className={styles.reconcileInfoRow}>
                        <span>Zuletzt gezählter Betrag</span>
                        <strong>{euro(cashBox.balance)}</strong>
                      </div>
                      <div className={styles.reconcileInfoRow}>
                        <span>Festgestellte Differenz</span>
                        <strong style={{ color: "var(--ui-positive)" }}>
                          0,00 €
                        </strong>
                      </div>
                    </div>

                    <div className={styles.cashHubActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setCountMode("direct");
                          setCountedAmountInput(
                            cashBox.balance.toString().replace(".", ","),
                          );
                          setCountPerson(cashBox.responsible);
                          setCountNote("");
                          setCountError("");
                          setIsCountOpen(true);
                        }}
                        style={{ flex: 1 }}
                      >
                        <Banknote aria-hidden="true" />
                        <span>Kasse zählen</span>
                      </button>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => {
                          setTransferDirection("cash-to-bank");
                          setTransferError("");
                          setIsTransferOpen(true);
                        }}
                        style={{ flex: 1 }}
                      >
                        <ArrowRightLeft aria-hidden="true" />
                        <span>Auf Bank einzahlen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <article className={styles.activityCard}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Letzte Kontobewegungen</h2>
                    <p>Aktuelle Buchungen aus Bankkonto und Barkasse</p>
                  </div>
                  <Activity aria-hidden="true" />
                </div>
                <div className={styles.activityList}>
                  {recentAccountActivity.map((entry) => (
                    <div
                      className={styles.activityRow}
                      key={`${entry.label}-${entry.date}`}
                    >
                      <span className={styles.activityIcon} aria-hidden="true">
                        {entry.amount > 0 ? "+" : "−"}
                      </span>
                      <span className={styles.activityIdentity}>
                        <strong>{entry.label}</strong>
                        <small>{entry.meta}</small>
                      </span>
                      <time>{entry.date}</time>
                      <strong
                        className={
                          entry.amount > 0
                            ? styles.activityPositive
                            : styles.activityNegative
                        }
                      >
                        {entry.amount > 0 ? "+" : "−"}
                        {euro(Math.abs(entry.amount))}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            </TabsContent>

            <TabsContent value="accounts" className={styles.tabContent}>
              <section className={styles.accountManager}>
                <div>
                  <h3>Konten & Karten</h3>
                  <p>Bankkarten verwalten und Kontodaten bereitstellen.</p>
                </div>
                <div className={styles.accountManagerActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsEditCardOpen(true)}
                  >
                    <Pencil aria-hidden="true" />
                    Karte bearbeiten
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setIsAddCardOpen(true)}
                  >
                    <Plus aria-hidden="true" />
                    Konto hinzufügen
                  </button>
                </div>
              </section>

              {/* 2. MIDDLE SECTION: BANKING TRANSFER DETAILS & IBAN COPY HELPER */}
              <section className={styles.bankDetailsCard}>
                <div className={styles.bankDetailsHeader}>
                  <div className={styles.bankDetailsHeaderLeft}>
                    <span className={styles.hubIconBubble}>
                      <Landmark aria-hidden="true" />
                    </span>
                    <div>
                      <h3>Bankverbindung für Überweisungen</h3>
                      <p>
                        Offizielle Kontodaten für Schüler, Eltern, Sponsoren und
                        Fördervereine
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.bankDetailsGrid}>
                  <div className={styles.bankDetailBox}>
                    <div>
                      <span>IBAN</span>
                      <strong>{activeCard?.iban}</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(activeCard?.iban ?? "", "iban")
                      }
                      title="IBAN kopieren"
                      aria-label="IBAN in Zwischenablage kopieren"
                    >
                      {copiedField === "iban" ? (
                        <Check className="size-4 text-[var(--ui-positive)]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className={styles.bankDetailBox}>
                    <div>
                      <span>BIC / SWIFT</span>
                      <strong>{activeCard?.bic}</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(activeCard?.bic ?? "", "bic")
                      }
                      title="BIC kopieren"
                      aria-label="BIC in Zwischenablage kopieren"
                    >
                      {copiedField === "bic" ? (
                        <Check className="size-4 text-[var(--ui-positive)]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className={styles.bankDetailBox}>
                    <div>
                      <span>Kontoinhaber</span>
                      <strong>
                        {activeCard?.details.holder || "Abi-Komitee 2026"}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(
                          activeCard?.details.holder || "Abi-Komitee 2026",
                          "holder",
                        )
                      }
                      title="Inhaber kopieren"
                      aria-label="Inhaber in Zwischenablage kopieren"
                    >
                      {copiedField === "holder" ? (
                        <Check className="size-4 text-[var(--ui-positive)]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className={styles.bankDetailBox}>
                    <div>
                      <span>Muster-Verwendungszweck</span>
                      <strong>[Vorname Nachname] - Abi 2026</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(
                          "[Vorname Nachname] - Abi 2026",
                          "purpose",
                        )
                      }
                      title="Verwendungszweck kopieren"
                      aria-label="Verwendungszweck in Zwischenablage kopieren"
                    >
                      {copiedField === "purpose" ? (
                        <Check className="size-4 text-[var(--ui-positive)]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </section>

              <div className={styles.cardPills}>
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`${styles.cardPill} ${idx === safeIndex ? styles.cardPillActive : ""}`}
                    onClick={() => setActiveCardIndex(idx)}
                  >
                    <span
                      className={styles.cardPillDot}
                      style={{
                        backgroundColor: card.details.color || "#111114",
                      }}
                    />
                    <span>{card.details.accountName}</span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audit" className={styles.tabContent}>
              {/* 3. BOTTOM SECTION: CASH AUDIT PROTOCOL & SECURITY / SIGNATORIES */}
              <div className={styles.bottomGrid}>
                {/* Left: Kassenbuch & Prüfprotokoll */}
                <article className={styles.auditCard}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Kassenbuch & Prüfprotokoll (Audit)</h2>
                      <p>
                        Vollständiger Nachweis aller Kassenstürze der Barkasse
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.smallPrimaryButton}
                      onClick={() => {
                        setCountMode("direct");
                        setCountedAmountInput(
                          cashBox.balance.toString().replace(".", ","),
                        );
                        setCountPerson(cashBox.responsible);
                        setCountNote("");
                        setCountError("");
                        setIsCountOpen(true);
                      }}
                    >
                      <Plus aria-hidden="true" />
                      <span>Kassensturz erfassen</span>
                    </button>
                  </div>

                  <div className={styles.auditTableWrap}>
                    <div className={styles.auditTableHeader}>
                      <span>Datum</span>
                      <span>Kassenprüfer</span>
                      <span>Zählbetrag</span>
                      <span>Buchbestand</span>
                      <span>Status</span>
                    </div>

                    {auditLogs.map((log) => (
                      <div key={log.id} className={styles.auditTableRow}>
                        <span style={{ color: "var(--ui-muted-ink)" }}>
                          {log.date}
                        </span>
                        <strong>{log.auditor}</strong>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {euro(log.countedAmount)}
                        </span>
                        <span
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--ui-muted-ink)",
                          }}
                        >
                          {euro(log.bookBalance)}
                        </span>
                        <div>
                          <span className={styles.auditBadge}>✓ Stimmt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Right: Kontosicherheit & Zeichnungsberechtigte */}
                <article className={styles.securityCard}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Kassensicherheit & Zugriff</h2>
                      <p>Verwaltung und Freigaberechte</p>
                    </div>
                    <ShieldCheck
                      className="size-5 text-[var(--ui-positive)]"
                      aria-hidden="true"
                    />
                  </div>

                  <div className={styles.securityBody}>
                    <div className={styles.fourEyesBox}>
                      <span className={styles.fourEyesIcon}>
                        <Users aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Vier-Augen-Prinzip aktiv</strong>
                        <span>
                          Überweisungen & Kassenabschlüsse erfordern
                          Gegenzeichnung
                        </span>
                      </div>
                    </div>

                    <div className={styles.signatoriesList}>
                      <div className={styles.signatoryItem}>
                        <div className={styles.signatoryItemLeft}>
                          <User
                            className="size-4 text-[var(--ui-muted-ink)]"
                            aria-hidden="true"
                          />
                          <div>
                            <strong>Max Müller</strong>
                            <span>
                              Kassenwart · Vollzugriff & Kassenführung
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "var(--ui-positive)",
                          }}
                        >
                          Primär
                        </span>
                      </div>

                      <div className={styles.signatoryItem}>
                        <div className={styles.signatoryItemLeft}>
                          <User
                            className="size-4 text-[var(--ui-muted-ink)]"
                            aria-hidden="true"
                          />
                          <div>
                            <strong>Frau Schmidt</strong>
                            <span>
                              Beratungslehrerin · Zeichnungsberechtigt Bank
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 500,
                            color: "var(--ui-muted-ink)",
                          }}
                        >
                          Lehrkraft
                        </span>
                      </div>

                      <div className={styles.signatoryItem}>
                        <div className={styles.signatoryItemLeft}>
                          <User
                            className="size-4 text-[var(--ui-muted-ink)]"
                            aria-hidden="true"
                          />
                          <div>
                            <strong>Lisa Schmidt</strong>
                            <span>Stellv. Kassenwartin · Zählberechtigt</span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 500,
                            color: "var(--ui-muted-ink)",
                          }}
                        >
                          Vertretung
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <AdaptiveFundsView
          mode={mode}
          cards={cards}
          activeCard={activeCard}
          activeCardIndex={safeIndex}
          cashBox={cashBox}
          auditLogs={auditLogs}
          activities={recentAccountActivity}
          euro={euro}
          onSwitchCard={switchCard}
          onSelectCard={setActiveCardIndex}
          onAddCard={() => setIsAddCardOpen(true)}
          onEditCard={() => setIsEditCardOpen(true)}
          onCountCash={() => setIsCountOpen(true)}
          onTransfer={() => setIsTransferOpen(true)}
          onCopy={copyToClipboard}
        />
      )}

      {/* 4. MODALS */}

      {/* ADD CARD MODAL */}
      <AddCardModal
        open={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onSave={handleSaveNewCard}
      />

      {/* EDIT CARD MODAL */}
      <EditCardModal
        key={activeCard?.id ?? "no-card"}
        open={isEditCardOpen}
        card={activeCard ? activeCard.details : null}
        onClose={() => setIsEditCardOpen(false)}
        onSave={handleUpdateCard}
        onDelete={handleDeleteCard}
      />

      {/* CASH COUNT MODAL (WITH DENOMINATION CALCULATOR) */}
      {isCountOpen && (
        <Dialog
          label="Kassenzählung durchführen"
          onClose={() => setIsCountOpen(false)}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode !== "desktop" ? adaptiveStyles.adaptiveDialog : ""}`}
        >
          <form onSubmit={handleSaveCount}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span
                  style={{
                    background: "var(--ui-orange-soft)",
                    color: "var(--ui-orange)",
                  }}
                >
                  <Banknote aria-hidden="true" />
                </span>
                <div>
                  <h2>Kassensturz erfassen</h2>
                  <p>Bargeldbestand zählen und mit Buchbestand abgleichen.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsCountOpen(false)}
                aria-label="Schließen"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Count Mode Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderBottom: "1px solid var(--ui-border-subtle)",
                  paddingBottom: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className={styles.smallSecondaryButton}
                  style={{
                    backgroundColor:
                      countMode === "direct"
                        ? "var(--ui-ink)"
                        : "var(--ui-surface)",
                    color:
                      countMode === "direct"
                        ? "var(--ui-surface)"
                        : "var(--ui-ink)",
                    borderColor:
                      countMode === "direct"
                        ? "var(--ui-ink)"
                        : "var(--ui-border)",
                  }}
                  onClick={() => setCountMode("direct")}
                >
                  Direkteingabe Gesamtbetrag
                </button>
                <button
                  type="button"
                  className={styles.smallSecondaryButton}
                  style={{
                    backgroundColor:
                      countMode === "calculator"
                        ? "var(--ui-ink)"
                        : "var(--ui-surface)",
                    color:
                      countMode === "calculator"
                        ? "var(--ui-surface)"
                        : "var(--ui-ink)",
                    borderColor:
                      countMode === "calculator"
                        ? "var(--ui-ink)"
                        : "var(--ui-border)",
                  }}
                  onClick={() => setCountMode("calculator")}
                >
                  Münz- & Scheinezähler (Stückelung)
                </button>
              </div>

              {countMode === "direct" ? (
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>Tatsächlich gezählter Betrag</span>
                    <div className={styles.amountField}>
                      <input
                        type="text"
                        required
                        value={countedAmountInput}
                        onChange={(e) => setCountedAmountInput(e.target.value)}
                        placeholder="0,00"
                      />
                      <span>€</span>
                    </div>
                  </label>

                  <label className={styles.formField}>
                    <span>Gezählt von</span>
                    <input
                      type="text"
                      required
                      value={countPerson}
                      onChange={(e) => setCountPerson(e.target.value)}
                      placeholder="Name des Prüfers"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Anzahl der Scheine & Münzen eingeben:
                  </span>
                  <div className={styles.denominationGrid}>
                    {[
                      { label: "50 € Scheine", key: "50" },
                      { label: "20 € Scheine", key: "20" },
                      { label: "10 € Scheine", key: "10" },
                      { label: "5 € Scheine", key: "5" },
                      { label: "2 € Münzen", key: "2" },
                      { label: "1 € Münzen", key: "1" },
                      { label: "0,50 € Münzen", key: "0.5" },
                      { label: "0,20 € Münzen", key: "0.2" },
                    ].map((item) => (
                      <div key={item.key} className={styles.denominationItem}>
                        <span>{item.label}</span>
                        <input
                          type="number"
                          min="0"
                          value={denomCounts[item.key] || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setDenomCounts((prev) => ({
                              ...prev,
                              [item.key]: val,
                            }));
                          }}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className={`${styles.formField} ${styles.formFieldFull}`}>
                <span>Notiz / Anlass</span>
                <input
                  type="text"
                  value={countNote}
                  onChange={(e) => setCountNote(e.target.value)}
                  placeholder="z.B. Zählung nach Kuchenverkauf am Schulfest"
                />
              </label>

              {/* Live Preview / Comparison Box */}
              <div className={styles.countPreview}>
                <div>
                  <span>Buchbestand</span>
                  <strong>{euro(cashBox.balance)}</strong>
                </div>
                <div>
                  <span>Gezählt</span>
                  <strong>{euro(activeCountedAmount)}</strong>
                </div>
                <div>
                  <span>Differenz</span>
                  <strong
                    style={{
                      color:
                        Math.abs(currentDiffPreview) < 0.01
                          ? "var(--ui-positive)"
                          : "var(--ui-negative)",
                    }}
                  >
                    {currentDiffPreview > 0 ? "+" : ""}
                    {euro(currentDiffPreview)}
                  </strong>
                </div>
              </div>

              {countError && <p className={styles.formError}>{countError}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setIsCountOpen(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton}>
                Kassensturz bestätigen
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* QUICK TRANSFER MODAL */}
      {isTransferOpen && (
        <Dialog
          label="Geld umbuchen"
          onClose={() => setIsTransferOpen(false)}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode !== "desktop" ? adaptiveStyles.adaptiveDialog : ""}`}
        >
          <form onSubmit={handleExecuteTransfer}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span
                  style={{
                    background: "var(--ui-violet-soft)",
                    color: "var(--ui-violet)",
                  }}
                >
                  <ArrowRightLeft aria-hidden="true" />
                </span>
                <div>
                  <h2>Umbuchung durchführen</h2>
                  <p>Geld zwischen Bankkonto und Barkasse transferieren.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsTransferOpen(false)}
                aria-label="Schließen"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label
                  className={`${styles.formField} ${styles.formFieldFull}`}
                >
                  <span>Transfer-Richtung</span>
                  <select
                    value={transferDirection}
                    onChange={(e) =>
                      setTransferDirection(
                        e.target.value as "bank-to-cash" | "cash-to-bank",
                      )
                    }
                  >
                    <option value="bank-to-cash">
                      Bankkonto ({euro(activeCard?.balance ?? 0)}) ➔ Barkasse
                      (Bargeldabhebung)
                    </option>
                    <option value="cash-to-bank">
                      Barkasse ({euro(cashBox.balance)}) ➔ Bankkonto
                      (Bargeldeinzahlung)
                    </option>
                  </select>
                </label>

                <label
                  className={`${styles.formField} ${styles.formFieldFull}`}
                >
                  <span>Transferbetrag</span>
                  <div className={styles.amountField}>
                    <input
                      type="text"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0,00"
                    />
                    <span>€</span>
                  </div>
                </label>

                <label
                  className={`${styles.formField} ${styles.formFieldFull}`}
                >
                  <span>Verwendungszweck / Notiz</span>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="z.B. Wechselgeld für Kuchenverkauf"
                  />
                </label>
              </div>

              {transferError && (
                <p className={styles.formError}>{transferError}</p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setIsTransferOpen(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className={styles.primaryButton}>
                Umbuchung bestätigen
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
