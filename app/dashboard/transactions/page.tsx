"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  HandCoins,
  Equal,
  FileText,
  Filter,
  Paperclip,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import styles from "./transactions.module.css";
import { Dialog } from "@/components/ui/dialog";
import {
  FieldDropdown,
  type FieldDropdownOption,
} from "@/components/ui/field-dropdown";
import { Pagination } from "@/components/ui/pagination";
import {
  LoadingCollection,
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import phoneStyles from "./transactions-phone.module.css";
import { listTransactionsForCurrentOrganization, listWalletsForCurrentOrganization } from "@/features/finance/actions/queries";
import { createManualTransactionFromUi } from "@/features/finance/actions/manual-ui";

type Category = "Material" | "Sonstiges" | "Veranstaltung";
type FilterType = "Einnahmen" | "Ausgaben";
type ReceiptFilter = "Alle" | "Vorhanden" | "Fehlt";
type ReviewFilter = "Alle" | "Geprüft" | "Zu prüfen";
type AccountFilter = string;
type Transaction = {
  id: number | string;
  title: string;
  category: Category;
  date: string;
  amount: number;
  receipt?: string;
  reviewStatus: "Geprüft" | "Zu prüfen";
  account: AccountFilter;
  walletId: string | null;
  tone: "violet" | "green" | "orange";
  icon: typeof FileText;
};


const toneClasses = {
  violet: styles.violet,
  green: styles.green,
  orange: styles.orange,
};
const parseDate = (value: string) => {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
};
const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const displayDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
const displayAmount = (amount: number) =>
  `${amount >= 0 ? "+" : "-"}${Math.abs(amount).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

type TrendDirection = "positive" | "negative" | "neutral";
type Trend = { label: string; direction: TrendDirection };

function trendFor(current: number, previous: number, increaseIsPositive = true): Trend {
  if (current === 0 && previous === 0) return { label: "—", direction: "neutral" };
  if (previous === 0) return { label: "Neu", direction: current > 0 === increaseIsPositive ? "positive" : "negative" };

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = change === 0
    ? "neutral"
    : change > 0 === increaseIsPositive
      ? "positive"
      : "negative";
  return {
    label: `${change >= 0 ? "+" : "−"}${Math.abs(change).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`,
    direction,
  };
}

function calculateTrends(items: Transaction[]): { income: Trend; expense: Trend; net: Trend } {
  if (!items.length) {
    const empty = trendFor(0, 0);
    return { income: empty, expense: empty, net: empty };
  }

  const latest = items.reduce((latestDate, item) => {
    const date = parseDate(item.date);
    return date > latestDate ? date : latestDate;
  }, parseDate(items[0].date));
  const currentMonth = latest.getMonth();
  const currentYear = latest.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const inPeriod = (item: Transaction, month: number, year: number) => {
    const date = parseDate(item.date);
    return date.getMonth() === month && date.getFullYear() === year;
  };
  const totalsFor = (month: number, year: number) => {
    const periodItems = items.filter((item) => inPeriod(item, month, year));
    const income = periodItems.filter((item) => item.amount >= 0).reduce((sum, item) => sum + item.amount, 0);
    const expense = periodItems.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
    return { income, expense, net: income - expense };
  };
  const current = totalsFor(currentMonth, currentYear);
  const previous = totalsFor(previousMonth, previousYear);
  return {
    income: trendFor(current.income, previous.income),
    expense: trendFor(current.expense, previous.expense, false),
    net: trendFor(current.net, previous.net),
  };
}

function TrendIndicator({ trend, loading }: { trend: Trend; loading: boolean }) {
  const Icon = trend.direction === "negative"
    ? TrendingDown
    : trend.direction === "neutral"
      ? Equal
      : TrendingUp;
  return (
    <span className={`${styles.trend} ${styles[trend.direction]}`}>
      <Icon aria-hidden="true" />
      <LoadingText loading={loading}>{trend.label}</LoadingText>
    </span>
  );
}

function Overlay({
  children,
  onClose,
  label,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  return (
    <Dialog
      label={label}
      onClose={onClose}
      overlayClassName={styles.overlay}
      dialogClassName={`${styles.modal} ${className ?? ""}`}
    >
      {children}
    </Dialog>
  );
}

function StyledDropdown({
  ariaLabel,
  label,
  value,
  options,
  onChange,
  className = "",
  placement = "bottom",
}: {
  ariaLabel: string;
  label?: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  placement?: "bottom" | "top";
}) {
  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      label={label}
      value={value}
      options={options as readonly FieldDropdownOption[]}
      onChange={onChange}
      className={className}
      placement={placement}
    />
  );
}

function CashRegisterCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value);
  const filtered = options.filter((option) => option.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className={styles.formField}>
      <span>Kasse</span>
      <div className={styles.cashRegisterCombobox}>
        <button type="button" className={styles.cashRegisterTrigger} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          <span>{selected?.name ?? "Kasse auswählen"}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        {open ? (
          <div className={styles.cashRegisterMenu}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kasse suchen …" aria-label="Kassen suchen" />
            <div role="listbox" aria-label="Kassen">
              {filtered.length ? filtered.map((option) => (
                <button type="button" role="option" aria-selected={option.id === value} key={option.id} onClick={() => { onChange(option.id); setOpen(false); setQuery(""); }}>
                  {option.name}
                </button>
              )) : <span className={styles.cashRegisterEmpty}>Keine Kasse gefunden.</span>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PhoneTransactionsView({
  loading,
  transactions,
  query,
  onQueryChange,
  activeFilterCount,
  totalIncome,
  totalExpense,
  netBalance,
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  totalResults,
  onPageChange,
  onOpenFilters,
  onOpenAdd,
  onSelect,
}: {
  loading: boolean;
  transactions: Transaction[];
  query: string;
  onQueryChange: (value: string) => void;
  activeFilterCount: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  onOpenFilters: () => void;
  onOpenAdd: () => void;
  onSelect: (transaction: Transaction) => void;
}) {
  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section
        className={phoneStyles.summary}
        aria-label="Transaktionsübersicht"
        data-ui-slot="summary"
      >
        <span>Netto</span>
        <strong><LoadingText loading={loading}>{displayAmount(netBalance)}</LoadingText></strong>
        <div className={phoneStyles.summaryBreakdown}>
          <b><LoadingText loading={loading}>+{displayAmount(totalIncome).replace("+", "")}</LoadingText></b>
          <b>
            <LoadingText loading={loading}>-{displayAmount(totalExpense).replace("+", "").replace("-", "")}</LoadingText>
          </b>
        </div>
      </section>

      <div className={phoneStyles.toolbar} data-ui-slot="toolbar">
        <label className={phoneStyles.search}>
          <Search aria-hidden="true" />
          <span className="sr-only">Transaktionen durchsuchen</span>
          <input
            value={query}
            disabled={loading}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Transaktionen durchsuchen …"
          />
        </label>
        <button
          type="button"
          className={phoneStyles.filterButton}
          onClick={onOpenFilters}
          disabled={loading}
          aria-label="Transaktionen filtern"
        >
          <Filter aria-hidden="true" />
          {activeFilterCount ? (
            <span className={phoneStyles.filterCount}>{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      <header className={phoneStyles.listHeader} data-ui-slot="list-header">
        <h2>Transaktionen</h2>
        <span><LoadingText loading={loading}>{totalResults} Einträge</LoadingText></span>
      </header>

      <div data-ui-slot="list-body">
        {loading ? (
          <LoadingCollection loading knownItemCount={transactions.length} emptyHeight="12rem" label="Transaktionen werden geladen…">
            <div className={phoneStyles.rows} />
          </LoadingCollection>
        ) : transactions.length ? (
          <div className={phoneStyles.rows}>
          {transactions.map((transaction) => (
            <button
              type="button"
              className={phoneStyles.row}
              key={transaction.id}
              onClick={() => onSelect(transaction)}
            >
              <span className={phoneStyles.rowMain}>
                <strong>{transaction.title}</strong>
                <span className={phoneStyles.rowMeta}>
                  <span>{transaction.category}</span>
                  <span>
                    {transaction.receipt ? "Beleg vorhanden" : "Ohne Beleg"}
                  </span>
                </span>
              </span>
              <span className={phoneStyles.rowSide}>
                <b
                  className={
                    transaction.amount >= 0
                      ? phoneStyles.positive
                      : phoneStyles.negative
                  }
                >
                  {displayAmount(transaction.amount)}
                </b>
                <small>{transaction.date}</small>
              </span>
            </button>
          ))}
          </div>
        ) : (
          <div className={phoneStyles.empty}>Keine Transaktionen gefunden.</div>
        )}
      </div>

      <footer className={phoneStyles.footer} data-ui-slot="footer">
        <span>
          <LoadingText loading={loading}>{rangeStart}-{rangeEnd} von {totalResults}</LoadingText>
        </span>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={loading ? () => undefined : onPageChange}
        />
      </footer>

      <button
        type="button"
        className={phoneStyles.addButton}
        onClick={onOpenAdd}
        disabled={loading}
        data-ui-slot="primary-action"
      >
        <Plus aria-hidden="true" /> Transaktion hinzufügen
      </button>
    </div>
  );
}

export default function TransactionsPage() {
  const mode = usePresentationMode();
  const [items, setItems] = useState<Transaction[]>([]);
  const [cashRegisters, setCashRegisters] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listTransactionsForCurrentOrganization()
      .then((result) => {
        if (!active || !result.ok) return;
        setItems(result.items.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category as Category,
          date: item.date ? displayDate(fromIso(item.date)) : displayDate(new Date()),
          amount: Number(item.amountMinor) / 100,
          receipt: item.receipt ? "receipt" : undefined,
          reviewStatus: item.reviewStatus as Transaction["reviewStatus"],
          account: "Barkasse",
          walletId: item.walletId,
          tone: item.type === "income" ? "green" : item.type === "expense" ? "violet" : "orange",
          icon: item.type === "income" ? HandCoins : item.type === "expense" ? FileText : Equal,
        })));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    listWalletsForCurrentOrganization().then((result) => {
      if (!active || !result.ok) return;
      const next = result.items.map((item) => ({ id: item.id, name: item.name }));
      setCashRegisters(next);
      setSelectedCashRegisterId((current) => current || next[0]?.id || "");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Alle" | Category>("Alle");
  const [type, setType] = useState<"Alle" | "Einnahmen" | "Ausgaben">("Alle");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [draftCategory, setDraftCategory] = useState<"Alle" | Category>("Alle");
  const [draftType, setDraftType] = useState<"Alle" | "Einnahmen" | "Ausgaben">(
    "Alle",
  );
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<FilterType[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>("Alle");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("Alle");
  const [draftCategories, setDraftCategories] = useState<Category[]>([]);
  const [draftTypes, setDraftTypes] = useState<FilterType[]>([]);
  const [draftMinAmount, setDraftMinAmount] = useState("");
  const [draftMaxAmount, setDraftMaxAmount] = useState("");
  const [draftReceiptFilter, setDraftReceiptFilter] =
    useState<ReceiptFilter>("Alle");
  const [draftReviewFilter, setDraftReviewFilter] =
    useState<ReviewFilter>("Alle");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize({
    defaultSize: 10,
    landscapeSize: 6,
    wideSize: 10,
  });
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Sonstiges");
  const [newType, setNewType] = useState<"Einnahme" | "Ausgabe">("Einnahme");

  const results = useMemo(
    () =>
      items
        .filter((item) => {
          const search = query.trim().toLowerCase();
          const date = parseDate(item.date);
          return (
            (!search ||
              `${item.title} ${item.category} ${item.date}`
                .toLowerCase()
                .includes(search)) &&
            (category === "Alle" || item.category === category) &&
            (type === "Alle" ||
              (type === "Einnahmen" ? item.amount >= 0 : item.amount < 0)) &&
            (!selectedCategories.length ||
              selectedCategories.includes(item.category)) &&
            (!selectedTypes.length ||
              selectedTypes.includes(
                item.amount >= 0 ? "Einnahmen" : "Ausgaben",
              )) &&
            (!start || date >= fromIso(start)) &&
            (!end || date <= fromIso(end)) &&
            (!minAmount ||
              Math.abs(item.amount) >= Number(minAmount.replace(",", "."))) &&
            (!maxAmount ||
              Math.abs(item.amount) <= Number(maxAmount.replace(",", "."))) &&
            (receiptFilter === "Alle" ||
              (receiptFilter === "Vorhanden"
                ? Boolean(item.receipt)
                : !item.receipt)) &&
            (reviewFilter === "Alle" || item.reviewStatus === reviewFilter)
          );
        })
        .sort(
          (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime(),
        ),
    [
      category,
      end,
      items,
      maxAmount,
      minAmount,
      query,
      receiptFilter,
      reviewFilter,
      selectedCategories,
      selectedTypes,
      start,
      type,
    ],
  );

  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const rangeStart = results.length ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(currentPage * pageSize, results.length);
  const totalIncome = items
    .filter((item) => item.amount >= 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = items
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const netBalance = totalIncome - totalExpense;
  const trends = useMemo(() => calculateTrends(items), [items]);
  const activeFilterCount = [
    query.trim() ? 1 : 0,
    category !== "Alle" ? 1 : 0,
    type !== "Alle" ? 1 : 0,
    selectedCategories.length ? 1 : 0,
    selectedTypes.length ? 1 : 0,
    start || end ? 1 : 0,
    minAmount || maxAmount ? 1 : 0,
    receiptFilter !== "Alle" ? 1 : 0,
    reviewFilter !== "Alle" ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  function resetFilters() {
    setQuery("");
    setCategory("Alle");
    setType("Alle");
    setStart("");
    setEnd("");
    setDraftCategory("Alle");
    setDraftType("Alle");
    setDraftStart("");
    setDraftEnd("");
    setSelectedCategories([]);
    setSelectedTypes([]);
    setMinAmount("");
    setMaxAmount("");
    setReceiptFilter("Alle");
    setReviewFilter("Alle");
    setDraftCategories([]);
    setDraftTypes([]);
    setDraftMinAmount("");
    setDraftMaxAmount("");
    setDraftReceiptFilter("Alle");
    setDraftReviewFilter("Alle");
    setPage(1);
  }
  function openFilters() {
    setDraftCategory(category);
    setDraftType(type);
    setDraftStart(start);
    setDraftEnd(end);
    setDraftCategories(selectedCategories);
    setDraftTypes(selectedTypes);
    setDraftMinAmount(minAmount);
    setDraftMaxAmount(maxAmount);
    setDraftReceiptFilter(receiptFilter);
    setDraftReviewFilter(reviewFilter);
    setFilterOpen(true);
  }
  function applyFilters() {
    setCategory(draftCategory);
    setType(draftType);
    setStart(draftStart);
    setEnd(draftEnd);
    setSelectedCategories(draftCategories);
    setSelectedTypes(draftTypes);
    setMinAmount(draftMinAmount);
    setMaxAmount(draftMaxAmount);
    setReceiptFilter(draftReceiptFilter);
    setReviewFilter(draftReviewFilter);
    setPage(1);
    setFilterOpen(false);
    setDateOpen(false);
  }
  function toggleDraftCategory(value: Category) {
    setDraftCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }
  function toggleDraftType(value: FilterType) {
    setDraftTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }
  async function addTransaction() {
    const amount = Number(newAmount.replace(",", "."));
    if (!newTitle.trim() || !Number.isFinite(amount) || !selectedCashRegisterId) return;
    const persisted = await createManualTransactionFromUi({
      title: newTitle.trim(),
      amount: newAmount,
      direction: newType === "Einnahme" ? "income" : "expense",
      categoryName: newType === "Einnahme" ? "Verkäufe" : newCategory,
      walletId: selectedCashRegisterId,
    });
    if (!persisted.ok) return;
    setItems((current) => [
      {
        id: persisted.id,
        title: newTitle.trim(),
        category: newCategory,
        date: displayDate(new Date()),
        amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount),
        reviewStatus: "Zu prüfen",
        account: "Barkasse",
        walletId: selectedCashRegisterId,
        tone: newType === "Einnahme" ? "green" : "violet",
        icon: newType === "Einnahme" ? HandCoins : FileText,
      },
      ...current,
    ]);
    setNewTitle("");
    setNewAmount("");
    setAddOpen(false);
    setPage(1);
  }

  const dateLabel =
    start || end
      ? `${start ? displayDate(fromIso(start)) : "Offen"} – ${end ? displayDate(fromIso(end)) : "Heute"}`
      : "Zeitraum auswählen";

  return (
    <section
      className={
        mode === "phone"
          ? phoneStyles.root
          : mode === "tablet"
            ? `${styles.page} ${styles.tabletPage}`
            : styles.page
      }
      aria-busy={loading}
    >
      <LoadingStatus loading={loading} label="Transaktionen werden geladen…" />
      {mode === "phone" ? (
        <PhoneTransactionsView
          loading={loading}
          transactions={visible}
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          activeFilterCount={activeFilterCount}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
          page={currentPage}
          pageCount={pages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalResults={results.length}
          onPageChange={setPage}
          onOpenFilters={openFilters}
          onOpenAdd={() => setAddOpen(true)}
          onSelect={setSelected}
        />
      ) : (
        <>
          <div className={styles.kpiGrid} data-ui-slot="summary">
            <article className={styles.kpiCard}>
              <span className={`${styles.kpiIcon} ${styles.incomeIcon}`}>
                <ArrowDown />
              </span>
              <div>
                <span className={styles.kpiLabel}>Einnahmen</span>
                <strong className={styles.incomeValue}>
                  <LoadingText loading={loading}>{displayAmount(totalIncome).replace("+", "")}</LoadingText>
                </strong>
              </div>
              <TrendIndicator trend={trends.income} loading={loading} />
            </article>
            <article className={styles.kpiCard}>
              <span className={`${styles.kpiIcon} ${styles.expenseIcon}`}>
                <ArrowUp />
              </span>
              <div>
                <span className={styles.kpiLabel}>Ausgaben</span>
                <strong className={styles.expenseValue}>
                  <LoadingText loading={loading}>{displayAmount(totalExpense).replace("+", "")}</LoadingText>
                </strong>
              </div>
              <TrendIndicator trend={trends.expense} loading={loading} />
            </article>
            <article className={styles.kpiCard}>
              <span className={`${styles.kpiIcon} ${styles.netIcon}`}>
                <Equal />
              </span>
              <div>
                <span className={styles.kpiLabel}>Netto</span>
                <strong><LoadingText loading={loading}>{displayAmount(netBalance)}</LoadingText></strong>
              </div>
              <TrendIndicator trend={trends.net} loading={loading} />
            </article>
          </div>

          <article className={styles.listCard} data-ui-slot="content">
            <header className={styles.listHeader}>
              <div className={styles.headingGroup}>
                <h2>Alle Transaktionen</h2>
                <span><LoadingText loading={loading}>{activeFilterCount} aktive Filter</LoadingText></span>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setAddOpen(true)}
                disabled={loading}
                data-ui-slot="primary-action"
              >
                <Plus />
                Transaktion hinzufügen
              </button>
            </header>

            <div className={styles.filters} data-ui-slot="toolbar">
              <label className={styles.searchField}>
                <Search />
                <span className="sr-only">Transaktionen durchsuchen</span>
                <input
                  value={query}
                  disabled={loading}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Transaktionen durchsuchen …"
                />
              </label>
              <StyledDropdown
                ariaLabel="Kategorie auswählen"
                value={category}
                onChange={(value) => {
                  setCategory(value as typeof category);
                  setPage(1);
                }}
                className={styles.filterDropdown}
                options={[
                  { value: "Alle", label: "Alle Kategorien" },
                  { value: "Material", label: "Material" },
                  { value: "Sonstiges", label: "Sonstiges" },
                  { value: "Veranstaltung", label: "Veranstaltung" },
                ]}
              />
              <StyledDropdown
                ariaLabel="Typ auswählen"
                value={type}
                onChange={(value) => {
                  setType(value as typeof type);
                  setPage(1);
                }}
                className={styles.filterDropdown}
                options={[
                  { value: "Alle", label: "Alle Typen" },
                  { value: "Einnahmen", label: "Einnahmen" },
                  { value: "Ausgaben", label: "Ausgaben" },
                ]}
              />
              <button
                type="button"
                className={styles.controlButton}
                onClick={() => {
                  setDraftStart(start);
                  setDraftEnd(end);
                  setDateOpen(true);
                }}
              >
                <span>{dateLabel}</span>
                <CalendarDays />
              </button>
              <button
                type="button"
                className={styles.filterButton}
                onClick={openFilters}
              >
                <Filter />
                Filter
              </button>
            </div>

            <div className={`${styles.tableWrap} ui-data-table`} data-ui-slot="list-body">
              <div className={styles.tableHeader}>
                <span>Transaktion</span>
                <span>Kategorie</span>
                <span>Datum</span>
                <span>Betrag</span>
                <span>Beleg</span>
              </div>
              <div className={styles.rows}>
                {loading ? (
                  <LoadingCollection loading knownItemCount={items.length} emptyHeight="100%" label="Transaktionen werden geladen…">
                    <div />
                  </LoadingCollection>
                ) : !visible.length ? (
                  <EmptyState
                    icon={<Search aria-hidden="true" />}
                    title="Keine Transaktionen gefunden"
                    description="Ändere die Suche oder setze die Filter zurück."
                    action={<button type="button" onClick={resetFilters}>Filter zurücksetzen</button>}
                  />
                ) : visible.map((transaction) => {
                  const Icon = transaction.icon;
                  return (
                    <button
                      type="button"
                      className={styles.row}
                      key={transaction.id}
                      onClick={() => setSelected(transaction)}
                    >
                      <span className={styles.transactionName}>
                        <span
                          className={`${styles.iconBubble} ${toneClasses[transaction.tone]}`}
                        >
                          <Icon />
                        </span>
                        <span>{transaction.title}</span>
                      </span>
                      <span data-label="Kategorie">
                        <span
                          className={`ui-badge ${styles.categoryTag} ${toneClasses[transaction.tone]}`}
                        >
                          {transaction.category}
                        </span>
                      </span>
                      <span
                        data-label="Datum"
                        className={`ui-tabular ${styles.muted}`}
                      >
                        {transaction.date}
                      </span>
                      <span
                        data-label="Betrag"
                        className={`ui-tabular ${transaction.amount >= 0 ? styles.positive : styles.negative}`}
                      >
                        {displayAmount(transaction.amount)}
                      </span>
                      <span data-label="Beleg" className={styles.receipt}>
                        {transaction.receipt ? (
                          <>
                            <Paperclip />
                            <span>{transaction.receipt}</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <footer className={styles.pagination} data-ui-slot="footer">
              <span>
                <LoadingText loading={loading}>{rangeStart}–{rangeEnd} von {results.length}</LoadingText>
              </span>
              <Pagination
                page={currentPage}
                pageCount={pages}
                onPageChange={loading ? () => undefined : setPage}
                className={styles.pageButtons}
              />
            </footer>
          </article>
        </>
      )}

      {dateOpen ? (
        <Overlay
          label="Zeitraum auswählen"
          onClose={() => setDateOpen(false)}
          className={mode === "phone" ? phoneStyles.phoneDialog : undefined}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Zeitraum auswählen</h2>
              <p>Lege den Zeitraum für die Transaktionsliste fest.</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setDateOpen(false)}
              aria-label="Dialog schließen"
            >
              <X />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.dateFields}>
              <label className={styles.formField}>
                <span>Von</span>
                <input
                  type="date"
                  value={draftStart}
                  onChange={(event) => setDraftStart(event.target.value)}
                />
              </label>
              <label className={styles.formField}>
                <span>Bis</span>
                <input
                  type="date"
                  min={draftStart}
                  value={draftEnd}
                  onChange={(event) => setDraftEnd(event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setDraftStart("");
                setDraftEnd("");
              }}
            >
              Zurücksetzen
            </button>
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setDateOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={applyFilters}
              >
                Übernehmen
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {filterOpen ? (
        <Overlay
          className={`${styles.filterModal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
          label="Transaktionen filtern"
          onClose={() => setFilterOpen(false)}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Transaktionen filtern</h2>
              <p>
                Wähle die Kriterien aus, nach denen du die Transaktionen
                anzeigen möchtest.
              </p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setFilterOpen(false)}
              aria-label="Filter schließen"
            >
              <X />
            </button>
          </div>
          <div className={`${styles.modalBody} ${styles.filterModalBody}`}>
            <div className={styles.filterColumns}>
              <fieldset className={styles.filterGroup}>
                <legend>Kategorie</legend>
                {(["Material", "Sonstiges", "Veranstaltung"] as Category[]).map(
                  (value) => (
                    <label className={styles.checkRow} key={value}>
                      <input
                        type="checkbox"
                        checked={draftCategories.includes(value)}
                        onChange={() => toggleDraftCategory(value)}
                      />
                      <span>{value}</span>
                    </label>
                  ),
                )}
              </fieldset>
              <fieldset className={styles.filterGroup}>
                <legend>Typ</legend>
                {(["Einnahmen", "Ausgaben"] as FilterType[]).map((value) => (
                  <label className={styles.checkRow} key={value}>
                    <input
                      type="checkbox"
                      checked={draftTypes.includes(value)}
                      onChange={() => toggleDraftType(value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </fieldset>
            </div>
            <div className={styles.modalSection}>
              <span className={styles.modalSectionLabel}>Betrag</span>
              <div className={styles.amountFields}>
                <label className={styles.inlineField}>
                  <span>Von</span>
                  <input
                    aria-label="Betrag von"
                    inputMode="decimal"
                    value={draftMinAmount}
                    onChange={(event) => setDraftMinAmount(event.target.value)}
                    placeholder="0,00 €"
                  />
                </label>
                <label className={styles.inlineField}>
                  <span>Bis</span>
                  <input
                    aria-label="Betrag bis"
                    inputMode="decimal"
                    value={draftMaxAmount}
                    onChange={(event) => setDraftMaxAmount(event.target.value)}
                    placeholder="1.000,00 €"
                  />
                </label>
              </div>
            </div>
            <div className={styles.filterColumns}>
              <fieldset className={styles.filterGroup}>
                <legend>Belegstatus</legend>
                <div className={styles.segmented}>
                  {(["Alle", "Vorhanden", "Fehlt"] as ReceiptFilter[]).map(
                    (value) => (
                      <button
                        type="button"
                        key={value}
                        className={
                          draftReceiptFilter === value
                            ? styles.segmentActive
                            : ""
                        }
                        onClick={() => setDraftReceiptFilter(value)}
                      >
                        {value}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
              <fieldset className={styles.filterGroup}>
                <legend>Prüfstatus</legend>
                <div className={styles.segmented}>
                  {(["Alle", "Geprüft", "Zu prüfen"] as ReviewFilter[]).map(
                    (value) => (
                      <button
                        type="button"
                        key={value}
                        className={
                          draftReviewFilter === value
                            ? styles.segmentActive
                            : ""
                        }
                        onClick={() => setDraftReviewFilter(value)}
                      >
                        {value}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
            </div>

          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                resetFilters();
                setFilterOpen(false);
              }}
            >
              Zurücksetzen
            </button>
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setFilterOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={applyFilters}
              >
                Filter anwenden
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {addOpen ? (
        <Overlay
          label="Transaktion hinzufügen"
          onClose={() => setAddOpen(false)}
          className={mode === "phone" ? phoneStyles.phoneDialog : undefined}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Transaktion hinzufügen</h2>
              <p>Erfasse eine neue Einnahme oder Ausgabe.</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setAddOpen(false)}
              aria-label="Dialog schließen"
            >
              <X />
            </button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Bezeichnung</span>
              <input
                autoFocus={mode !== "phone"}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="z. B. Sponsoring Schule"
              />
            </label>
            <CashRegisterCombobox value={selectedCashRegisterId} options={cashRegisters} onChange={setSelectedCashRegisterId} />
            <div className={styles.dateFields}>
              <StyledDropdown
                ariaLabel="Typ auswählen"
                label="Typ"
                value={newType}
                onChange={(value) => setNewType(value as typeof newType)}
                className={styles.formDropdown}
                options={[
                  { value: "Einnahme", label: "Einnahme" },
                  { value: "Ausgabe", label: "Ausgabe" },
                ]}
              />
              <StyledDropdown
                ariaLabel="Kategorie auswählen"
                label="Kategorie"
                value={newCategory}
                onChange={(value) => setNewCategory(value as Category)}
                className={styles.formDropdown}
                options={[
                  { value: "Material", label: "Material" },
                  { value: "Sonstiges", label: "Sonstiges" },
                  { value: "Veranstaltung", label: "Veranstaltung" },
                ]}
              />
            </div>
            <label className={styles.formField}>
              <span>Betrag</span>
              <input
                inputMode="decimal"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                placeholder="0,00"
              />
            </label>
          </div>
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAddOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={addTransaction}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {selected ? (
        <Overlay
          label="Transaktionsdetails"
          onClose={() => setSelected(null)}
          className={mode === "phone" ? phoneStyles.phoneDialog : undefined}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>{selected.title}</h2>
              <p>Transaktionsdetails</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setSelected(null)}
              aria-label="Details schließen"
            >
              <X />
            </button>
          </div>
          <div className={styles.detailGrid}>
            <span>Kategorie</span>
            <strong>{selected.category}</strong>
            <span>Datum</span>
            <strong>{selected.date}</strong>
            <span>Betrag</span>
            <strong
              className={
                selected.amount >= 0 ? styles.positive : styles.negative
              }
            >
              {displayAmount(selected.amount)}
            </strong>
            <span>Beleg</span>
            <strong>{selected.receipt ?? "Kein Beleg"}</strong>
          </div>
        </Overlay>
      ) : null}
    </section>
  );
}
