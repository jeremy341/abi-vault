"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { createManualTransactionFromUi } from "@/features/finance/actions/manual-ui";
import { archiveTransaction as archiveTransactionAction, correctTransactionFromUi } from "@/features/finance/actions/corrections";
import { cachedFinanceQuery, getFinanceCacheState, invalidateFinanceQuery, subscribeFinanceQuery } from "@/lib/finance/client-cache";
import { RowActionMenu } from "@/components/ui/row-actions";

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
  reviewStatus: string;
  account: AccountFilter;
  walletId: string | null;
  tone: "violet" | "green" | "orange";
  icon: typeof FileText;
  type: "income" | "expense" | "transfer";
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

type ServerTransaction = {
  id: string;
  title: string;
  category: string;
  date: string;
  amountMinor: string;
  type: "income" | "expense" | "transfer";
  receipt: boolean;
  reviewStatus: string;
  account: string;
  walletId: string | null;
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

function mapTransaction(item: ServerTransaction): Transaction {
  return {
    id: item.id,
    title: item.title,
    category: item.category as Category,
    date: item.date ? displayDate(fromIso(item.date)) : displayDate(new Date()),
    amount: Number(item.amountMinor) / 100,
    receipt: item.receipt ? "receipt" : undefined,
    reviewStatus: item.reviewStatus as Transaction["reviewStatus"],
    account: item.account,
    walletId: item.walletId,
    tone: item.type === "income" ? "green" : item.type === "expense" ? "violet" : "orange",
    icon: item.type === "income" ? HandCoins : item.type === "expense" ? FileText : Equal,
    type: item.type,
    createdBy: item.createdBy,
    canEdit: item.canEdit,
    canDelete: item.canDelete,
  };
}


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
  onEdit,
  onDelete,
  canCreate,
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
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  canCreate: boolean;
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
          {totalIncome || totalExpense ? (
            <>
              <b><LoadingText loading={loading}>+{displayAmount(totalIncome).replace("+", "")}</LoadingText></b>
              <b>
                <LoadingText loading={loading}>-{displayAmount(totalExpense).replace("+", "").replace("-", "")}</LoadingText>
              </b>
            </>
          ) : (
            <span className={phoneStyles.summaryEmpty}>Keine Bewegungen</span>
          )}
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
              <article
                className={phoneStyles.row}
                key={transaction.id}
              >
                <button
                  type="button"
                  className={phoneStyles.rowOpen}
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
                <RowActionMenu
                  label={transaction.title}
                  canEdit={transaction.canEdit}
                  canDelete={transaction.canDelete}
                  onEdit={() => onEdit(transaction)}
                  onDelete={() => onDelete(transaction)}
                />
              </article>
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
        disabled={loading || !canCreate}
        data-ui-slot="primary-action"
      >
        <Plus aria-hidden="true" /> Transaktion hinzufügen
      </button>
    </div>
  );
}

export default function TransactionsPage() {
  const mode = usePresentationMode();
  const { userId, orgId } = useAuth();
  const cacheScope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  type DashboardResult = Awaited<ReturnType<typeof getDashboardSnapshot>>;
  const initialSnapshot = getFinanceCacheState<DashboardResult>("dashboard-snapshot", cacheScope);
  const [items, setItems] = useState<Transaction[]>(() => initialSnapshot.data?.ok ? initialSnapshot.data.transactions.map(mapTransaction) : []);
  const [cashRegisters, setCashRegisters] = useState<Array<{ id: string; name: string }>>(() => initialSnapshot.data?.ok ? initialSnapshot.data.wallets.map((item) => ({ id: item.id, name: item.name })) : []);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState(() => initialSnapshot.data?.ok ? initialSnapshot.data.wallets[0]?.id ?? "" : "");
  const [transactionsLoading, setTransactionsLoading] = useState(!initialSnapshot.data?.ok);
  const [walletLoading, setWalletLoading] = useState(!initialSnapshot.data?.ok);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(Boolean(initialSnapshot.data?.ok && !initialSnapshot.fresh));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const idempotencyKey = useRef<string | null>(null);
  const archiveIdempotencyKey = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    const applyResult = (result: DashboardResult) => {
      if (!active) return;
      if (!result.ok) {
        setLoadError("Die Transaktionen konnten nicht geladen werden.");
        return;
      }
      setItems(result.transactions.map(mapTransaction));
      const nextWallets = result.wallets.map((item) => ({ id: item.id, name: item.name }));
      setCashRegisters(nextWallets);
      setSelectedCashRegisterId((current: string) => current || nextWallets[0]?.id || "");
      setLoadError("");
      setTransactionsLoading(false);
      setWalletLoading(false);
    };
    const unsubscribe = subscribeFinanceQuery("dashboard-snapshot", (value) => applyResult(value as DashboardResult), cacheScope);
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, { scope: cacheScope })
      .then(applyResult)
      .catch(() => {
        if (active) setLoadError("Die Transaktionen konnten nicht geladen werden.");
      })
      .finally(() => {
        if (active) { setTransactionsLoading(false); setRefreshing(false); }
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cacheScope]);
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
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Transaction | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [actionError, setActionError] = useState("");
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
  const [correctionReason, setCorrectionReason] = useState("");

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

  const loading = transactionsLoading || walletLoading;

  async function addTransaction() {
    if (saving) return;
    const amount = Number(newAmount.replace(",", "."));
    if (!newTitle.trim() || !Number.isFinite(amount) || (!editing && !selectedCashRegisterId) || (editing && !correctionReason.trim())) {
      setFormError(editing ? "Bitte Bezeichnung, Betrag und Korrekturgrund ausfüllen." : "Bitte Kasse, Bezeichnung und Betrag vollständig ausfüllen.");
      return;
    }
    setSaving(true);
    setFormError("");
    idempotencyKey.current ??= `ui-${crypto.randomUUID()}`;
    try {
      if (editing) {
        const corrected = await correctTransactionFromUi({
          transactionId: editing.id.toString(),
          title: newTitle.trim(),
          amount: newAmount,
          direction: newType === "Einnahme" ? "income" : "expense",
          categoryName: newType === "Einnahme" ? "Verkäufe" : newCategory,
          reason: correctionReason,
          idempotencyKey: idempotencyKey.current,
        });
        if (!corrected.success) {
          setFormError(corrected.error.message);
          return;
        }
        setItems((current) => current.map((item) => item.id === editing.id ? {
          ...item,
          id: corrected.data.id,
          title: newTitle.trim(),
          amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount),
          type: newType === "Einnahme" ? "income" : "expense",
          category: newCategory,
          canEdit: true,
        } : item));
        setAddOpen(false);
        setEditing(null);
        setCorrectionReason("");
        invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");
        idempotencyKey.current = null;
        return;
      }
      const persisted = await createManualTransactionFromUi({
        title: newTitle.trim(),
        amount: newAmount,
        direction: newType === "Einnahme" ? "income" : "expense",
        categoryName: newType === "Einnahme" ? "Verkäufe" : newCategory,
        walletId: selectedCashRegisterId,
        idempotencyKey: idempotencyKey.current,
      });
      if (!persisted.ok) {
        setFormError("Die Transaktion konnte nicht gespeichert werden.");
        return;
      }
      const selectedCashRegister = cashRegisters.find((item) => item.id === selectedCashRegisterId);
    setItems((current) => [
      {
        id: persisted.id,
        title: newTitle.trim(),
        category: newCategory,
        date: displayDate(new Date()),
        amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount),
        reviewStatus: "Zu prüfen",
        account: selectedCashRegister?.name ?? "Nicht zugeordnet",
        walletId: selectedCashRegisterId,
        tone: newType === "Einnahme" ? "green" : "violet",
        icon: newType === "Einnahme" ? HandCoins : FileText,
        type: newType === "Einnahme" ? "income" : "expense",
        createdBy: null,
        canEdit: true,
        canDelete: false,
      },
      ...current,
    ]);
    setNewTitle("");
    setNewAmount("");
    setAddOpen(false);
    setPage(1);
      invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");
      idempotencyKey.current = null;
    } finally {
      setSaving(false);
    }
  }

  function openEdit(transaction: Transaction) {
    setSelected(null);
    setEditing(transaction);
    setNewTitle(transaction.title);
    setNewAmount(Math.abs(transaction.amount).toFixed(2).replace(".", ","));
    setNewType(transaction.type === "income" ? "Einnahme" : "Ausgabe");
    setNewCategory(transaction.category);
    setCorrectionReason("");
    setFormError("");
    setAddOpen(true);
  }

  function closeTransactionModal() {
    if (saving) return;
    setAddOpen(false);
    setEditing(null);
    setCorrectionReason("");
    setFormError("");
  }

  function openArchive(transaction: Transaction) {
    setSelected(null);
    setArchiveTarget(transaction);
    setArchiveReason("");
    setActionError("");
    archiveIdempotencyKey.current = `archive-${transaction.id}-${crypto.randomUUID()}`;
  }

  async function confirmArchiveTransaction() {
    if (!archiveTarget || saving || !archiveReason.trim()) return;
    setSaving(true);
    setActionError("");
    try {
      const result = await archiveTransactionAction({
        transactionId: archiveTarget.id.toString(),
        reason: archiveReason,
        idempotencyKey: archiveIdempotencyKey.current ?? `archive-${archiveTarget.id}`,
      });
      if (!result.success) {
        setActionError(result.error.message);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== archiveTarget.id));
      setArchiveTarget(null);
      setArchiveReason("");
      archiveIdempotencyKey.current = null;
      invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");
    } finally {
      setSaving(false);
    }
  }

  const dateLabel =
    start || end
      ? `${start ? displayDate(fromIso(start)) : "Offen"} – ${end ? displayDate(fromIso(end)) : "Heute"}`
      : "Zeitraum auswählen";

  return (
    <section
      className={
        mode === "phone"
          ? phoneStyles.pageShell
          : mode === "tablet"
            ? `${styles.page} ${styles.tabletPage}`
            : styles.page
      }
      aria-busy={loading}
    >
      <LoadingStatus loading={loading} label="Transaktionen werden geladen…" />
      {refreshing && !loading ? <span className="sr-only" role="status">Transaktionen werden aktualisiert…</span> : null}
      {loadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p> : null}
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
          onOpenAdd={() => { setEditing(null); setFormError(""); setAddOpen(true); }}
          onSelect={setSelected}
          onEdit={openEdit}
          onDelete={openArchive}
          canCreate={Boolean(selectedCashRegisterId) && !loadError}
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
                onClick={() => { setEditing(null); setFormError(""); setAddOpen(true); }}
                disabled={loading || !selectedCashRegisterId || Boolean(loadError)}
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
                <span aria-hidden="true" />
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
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.row}
                      key={transaction.id}
                      onClick={() => setSelected(transaction)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(transaction);
                        }
                      }}
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
                      <RowActionMenu
                        label={transaction.title}
                        canEdit={transaction.canEdit}
                        canDelete={transaction.canDelete}
                        onEdit={() => openEdit(transaction)}
                        onDelete={() => openArchive(transaction)}
                      />
                    </div>
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
          label={editing ? "Transaktion bearbeiten" : "Transaktion hinzufügen"}
          onClose={closeTransactionModal}
          className={mode === "phone" ? phoneStyles.phoneDialog : undefined}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>{editing ? "Transaktion bearbeiten" : "Transaktion hinzufügen"}</h2>
              <p>{editing ? "Die Änderung wird als Korrektur im Kassenbuch festgehalten." : "Erfasse eine neue Einnahme oder Ausgabe."}</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={closeTransactionModal}
              disabled={saving}
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
            <div className={editing ? styles.editWalletNote : undefined}>
              <CashRegisterCombobox value={editing?.walletId ?? selectedCashRegisterId} options={cashRegisters} onChange={setSelectedCashRegisterId} />
              {editing ? <small>Die Kasse einer gebuchten Transaktion kann nicht geändert werden.</small> : null}
            </div>
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
            {editing ? (
              <label className={styles.formField}>
                <span>Grund der Korrektur</span>
                <textarea
                  value={correctionReason}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  placeholder="z. B. Betrag auf dem Beleg war falsch"
                  rows={3}
                />
              </label>
            ) : null}
          </div>
          {formError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{formError}</p> : null}
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeTransactionModal}
                disabled={saving}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={addTransaction}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? "Wird gespeichert …" : editing ? "Korrektur speichern" : "Hinzufügen"}
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

      {archiveTarget ? (
        <Overlay
          label="Transaktion archivieren"
          onClose={() => { if (!saving) setArchiveTarget(null); }}
          className={mode === "phone" ? phoneStyles.phoneDialog : undefined}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Transaktion archivieren?</h2>
              <p>Die Buchung bleibt im Prüfprotokoll erhalten und wird aus den aktiven Summen entfernt.</p>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => setArchiveTarget(null)} disabled={saving} aria-label="Dialog schließen"><X /></button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Grund</span>
              <textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Warum soll die Transaktion archiviert werden?" rows={3} autoFocus />
            </label>
            {actionError ? <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{actionError}</p> : null}
          </div>
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button type="button" className={styles.secondaryButton} onClick={() => setArchiveTarget(null)} disabled={saving}>Abbrechen</button>
              <button type="button" className={styles.primaryButton} onClick={confirmArchiveTransaction} disabled={saving || !archiveReason.trim()} aria-busy={saving}>{saving ? "Wird archiviert …" : "Archivieren"}</button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </section>
  );
}
