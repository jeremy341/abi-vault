"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { ChevronDown, X } from "lucide-react";
import styles from "./transactions.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
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
import { getDashboardSnapshot } from "@/features/finance/actions/queries";
import { createManualTransactionFromUi } from "@/features/finance/actions/manual-ui";
import { archiveTransaction as archiveTransactionAction, correctTransactionFromUi } from "@/features/finance/actions/corrections";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { pageWindow } from "@/hooks/use-pagination";
import { RowActionMenu } from "@/components/ui/row-actions";
import { createReceiptDownloadUrl, reviewReceipt } from "@/features/receipts/actions/receipts";
import { ReceiptReviewDialog, type ReceiptReviewDecision, type ReceiptReviewDialogReceipt } from "@/components/receipts/ReceiptReviewDialog";

type Category = "Material" | "Sonstiges" | "Veranstaltung";

type FilterType = "Income" | "Expenses";

type ReceiptFilter = "All" | "Vorhanden" | "Fehlt";

type ReviewFilter = "All" | "Approved" | "Pending review" | "Invalid";

type AccountFilter = string;

const categoryFilterOptions: readonly Category[] = ["Material", "Sonstiges", "Veranstaltung"];

const transactionTypeFilterOptions: readonly FilterType[] = ["Income", "Expenses"];

const receiptFilterOptions: readonly ReceiptFilter[] = ["All", "Vorhanden", "Fehlt"];

const reviewFilterOptions: readonly ReviewFilter[] = ["All", "Approved", "Pending review", "Invalid"];

type Transaction = {
  id: number | string;
  title: string;
  category: Category;
  date: string;
  amount: number;
  receipt?: string;
  receiptId: string | null;
  receiptType: string | null;
  reviewStatus: string;
  createdByName: string | null;
  createdAt: string;
  account: AccountFilter;
  walletId: string | null;
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
  receiptFile: string | null;
  receiptId: string | null;
  receiptType: string | null;
  reviewStatus: string;
  createdByName: string | null;
  createdAt: string;
  account: string;
  walletId: string | null;
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

function toTransaction(serverTransaction: ServerTransaction): Transaction {
  return {
    id: serverTransaction.id,
    title: serverTransaction.title,
    category: serverTransaction.category as Category,
    date: serverTransaction.date ? formatShortDate(fromIso(serverTransaction.date)) : formatShortDate(new Date()),
    amount: Number(serverTransaction.amountMinor) / 100,
    receipt: serverTransaction.receiptFile ?? (serverTransaction.receipt ? "receipt" : undefined),
    receiptId: serverTransaction.receiptId,
    receiptType: serverTransaction.receiptType,
    reviewStatus: serverTransaction.reviewStatus as Transaction["reviewStatus"],
    createdByName: serverTransaction.createdByName,
    createdAt: serverTransaction.createdAt,
    account: serverTransaction.account,
    walletId: serverTransaction.walletId,
    type: serverTransaction.type,
    createdBy: serverTransaction.createdBy,
    canEdit: serverTransaction.canEdit,
    canDelete: serverTransaction.canDelete,
  };
}


const parseDate = (value: string) => {
  const [day, month, year] = value.split(".").map(Number);

  return new Date(year, month - 1, day);
};

const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatShortDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

const money = (amount: number) =>
  `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatAmount = (amount: number) => `${amount >= 0 ? "+" : "\u2212"}${money(amount)}`;

const formatTotal = (amount: number) => money(amount);

const formatLongDate = (value: string) =>
  parseDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

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
  const typedOptions = options as readonly FieldDropdownOption[];

  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      label={label}
      value={value}
      options={typedOptions}
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
      <span>Cash register</span>
      <div className={styles.cashRegisterCombobox}>
        <button type="button" className={styles.cashRegisterTrigger} aria-haspopup="listbox" aria-expanded={open} aria-label={`Cash register: ${selected?.name ?? "none selected"}`} onClick={() => setOpen((current) => !current)}>
          <span>{selected?.name ?? "Select cash register"}</span>
          <ChevronDown aria-hidden="true" className={styles.comboChevron} />
        </button>
        {open ? (
          <div className={styles.cashRegisterMenu}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cash registers" aria-label="Search cash registers" />
            <div role="listbox" aria-label="Cash registers">
              {filtered.length ? filtered.map((option) => (
                <button type="button" role="option" aria-selected={option.id === value} key={option.id} onClick={() => { onChange(option.id); setOpen(false); setQuery(""); }}>
                  {option.name}
                </button>
              )) : <span className={styles.cashRegisterEmpty}>No cash registers found.</span>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const { data, loading: queryLoading, refreshing, failed } = useFinanceQuery("dashboard-snapshot", getDashboardSnapshot, cacheScope);
  const [items, setItems] = useState<Transaction[]>(() => data?.ok ? data.transactions.map(toTransaction) : []);
  const [cashRegisters, setCashRegisters] = useState<Array<{ id: string; name: string }>>(() => data?.ok ? data.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name })) : []);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState(() => data?.ok ? data.wallets[0]?.id ?? "" : "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const idempotencyKey = useRef<string | null>(null);
  const archiveIdempotencyKey = useRef<string | null>(null);
  const loadError = failed ? "Transactions could not be loaded." : "";
  useEffect(() => {
    if (!data?.ok) return;

    setItems(data.transactions.map(toTransaction));
    const nextWallets = data.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }));
    setCashRegisters(nextWallets);
    setSelectedCashRegisterId((current: string) => current || nextWallets[0]?.id || "");
  }, [data]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Category>("All");
  const [type, setType] = useState<"All" | "Income" | "Expenses">("All");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [draftCategory, setDraftCategory] = useState<"All" | Category>("All");

  const [draftType, setDraftType] = useState<"All" | "Income" | "Expenses">(
    "All",
  );

  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<FilterType[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>("All");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("All");
  const [draftCategories, setDraftCategories] = useState<Category[]>([]);
  const [draftTypes, setDraftTypes] = useState<FilterType[]>([]);
  const [draftMinAmount, setDraftMinAmount] = useState("");
  const [draftMaxAmount, setDraftMaxAmount] = useState("");

  const [draftReceiptFilter, setDraftReceiptFilter] =
    useState<ReceiptFilter>("All");

  const [draftReviewFilter, setDraftReviewFilter] =
    useState<ReviewFilter>("All");

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
  const [receiptReviewTarget, setReceiptReviewTarget] = useState<{ id: string; receipt: ReceiptReviewDialogReceipt } | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewLoading, setReceiptPreviewLoading] = useState(false);
  const [receiptPreviewError, setReceiptPreviewError] = useState("");
  const [receiptReviewError, setReceiptReviewError] = useState("");

  const results = useMemo(
    () =>
      items
        .filter((transaction) => {
          const search = query.trim().toLowerCase();
          const date = parseDate(transaction.date);

          return (
            (!search ||
              `${transaction.title} ${transaction.category} ${transaction.date}`
                .toLowerCase()
                .includes(search)) &&
            (category === "All" || transaction.category === category) &&
            (type === "All" ||
              (type === "Income" ? transaction.amount >= 0 : transaction.amount < 0)) &&
            (!selectedCategories.length ||
              selectedCategories.includes(transaction.category)) &&
            (!selectedTypes.length ||
              selectedTypes.includes(
                transaction.amount >= 0 ? "Income" : "Expenses",
              )) &&
            (!start || date >= fromIso(start)) &&
            (!end || date <= fromIso(end)) &&
            (!minAmount ||
              Math.abs(transaction.amount) >= Number(minAmount.replace(",", "."))) &&
            (!maxAmount ||
              Math.abs(transaction.amount) <= Number(maxAmount.replace(",", "."))) &&
            (receiptFilter === "All" ||
              (receiptFilter === "Vorhanden"
                ? Boolean(transaction.receipt)
                : !transaction.receipt)) &&
            (reviewFilter === "All" || transaction.reviewStatus === reviewFilter)
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

  const { pageCount, currentPage, offset, rangeStart, rangeEnd } = pageWindow(results.length, pageSize, page);

  const visible = results.slice(
    offset,
    currentPage * pageSize,
  );

  const totalIncome = items
    .filter((transaction) => transaction.amount >= 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = items
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const netBalance = totalIncome - totalExpense;

  const activeFilterCount = [
    query.trim() ? 1 : 0,
    category !== "All" ? 1 : 0,
    type !== "All" ? 1 : 0,
    selectedCategories.length ? 1 : 0,
    selectedTypes.length ? 1 : 0,
    start || end ? 1 : 0,
    minAmount || maxAmount ? 1 : 0,
    receiptFilter !== "All" ? 1 : 0,
    reviewFilter !== "All" ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  function resetFilters() {
    setQuery("");
    setCategory("All");
    setType("All");
    setStart("");
    setEnd("");
    setDraftCategory("All");
    setDraftType("All");
    setDraftStart("");
    setDraftEnd("");
    setSelectedCategories([]);
    setSelectedTypes([]);
    setMinAmount("");
    setMaxAmount("");
    setReceiptFilter("All");
    setReviewFilter("All");
    setDraftCategories([]);
    setDraftTypes([]);
    setDraftMinAmount("");
    setDraftMaxAmount("");
    setDraftReceiptFilter("All");
    setDraftReviewFilter("All");
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
        ? current.filter((selectedCategory) => selectedCategory !== value)
        : [...current, value],
    );
  }

  function toggleDraftType(value: FilterType) {
    setDraftTypes((current) =>
      current.includes(value)
        ? current.filter((selectedType) => selectedType !== value)
        : [...current, value],
    );
  }

  const loading = queryLoading || !data;

  async function addTransaction() {
    if (saving) return;
    const amount = Number(newAmount.replace(",", "."));

    if (!newTitle.trim() || !Number.isFinite(amount) || (!editing && !selectedCashRegisterId) || (editing && !correctionReason.trim())) {
      setFormError(editing ? "Complete the description, amount, and correction reason." : "Complete the cash register, description, and amount.");

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
          categoryName: newType === "Einnahme" ? "Sales" : newCategory,
          reason: correctionReason,
          idempotencyKey: idempotencyKey.current,
        });

        if (!corrected.success) {
          setFormError(corrected.error.message);

          return;
        }

        setItems((current) => current.map((transaction) => transaction.id === editing.id ? {
          ...transaction,
          id: corrected.data.id,
          title: newTitle.trim(),
          amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount),
          type: newType === "Einnahme" ? "income" : "expense",
          category: newCategory,
          canEdit: true,
        } : transaction));
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
        categoryName: newType === "Einnahme" ? "Sales" : newCategory,
        walletId: selectedCashRegisterId,
        idempotencyKey: idempotencyKey.current,
      });

      if (!persisted.ok) {
        setFormError("The transaction could not be saved.");

        return;
      }

      const selectedCashRegister = cashRegisters.find((cashRegister) => cashRegister.id === selectedCashRegisterId);
    setItems((current) => [
      {
        id: persisted.data.id,
        title: newTitle.trim(),
        category: newCategory,
        date: formatShortDate(new Date()),
        amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount),
        reviewStatus: "Pending review",
        receiptId: null,
        receiptType: null,
        createdByName: null,
        createdAt: new Date().toISOString(),
        account: selectedCashRegister?.name ?? "Unassigned",
        walletId: selectedCashRegisterId,
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

  async function openReceiptReview(transaction: Transaction) {
    if (!transaction.receiptId) return;
    setReceiptReviewTarget({
      id: transaction.receiptId,
        receipt: {
        file: transaction.receipt ?? "Receipt",
        type: transaction.receiptType === "application/pdf" ? "PDF" : "Bild",
        transaction: transaction.title,
        date: transaction.date,
        amount: transaction.amount,
          status: transaction.reviewStatus,
          createdByName: transaction.createdByName,
          createdAt: transaction.createdAt,
      },
    });
    setReceiptPreviewUrl(null);
    setReceiptPreviewError("");
    setReceiptReviewError("");
    setReceiptPreviewLoading(true);
    const download = await createReceiptDownloadUrl(transaction.receiptId);

    if (download.success) setReceiptPreviewUrl(download.data.url);
    else setReceiptPreviewError(download.error.message);
    setReceiptPreviewLoading(false);
  }

  async function decideReceiptReview(decision: ReceiptReviewDecision) {
    if (!receiptReviewTarget || saving) return;
    setSaving(true);
    setReceiptReviewError("");

    try {
      const review = await reviewReceipt({ receiptId: receiptReviewTarget.id, status: decision });

      if (!review.success) {
        setReceiptReviewError(review.error.message);

        return;
      }

      const nextStatus = decision === "approved" ? "Approved" : decision === "rejected" ? "Invalid" : "Pending review";
      setItems((current) => current.map((transaction) => transaction.receiptId === receiptReviewTarget.id ? { ...transaction, reviewStatus: nextStatus } : transaction));
      setReceiptReviewTarget(null);
      invalidateFinanceQuery("transactions", "receipts", "dashboard-snapshot", "report-snapshot", "report-kpis");
    } finally {
      setSaving(false);
    }
  }

  async function confirmArchiveTransaction() {
    if (!archiveTarget || saving || !archiveReason.trim()) return;
    setSaving(true);
    setActionError("");

    try {
      const archived = await archiveTransactionAction({
        transactionId: archiveTarget.id.toString(),
        reason: archiveReason,
        idempotencyKey: archiveIdempotencyKey.current ?? `archive-${archiveTarget.id}`,
      });

      if (!archived.success) {
        setActionError(archived.error.message);

        return;
      }

      setItems((current) => current.filter((transaction) => transaction.id !== archiveTarget.id));
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
      ? `${start ? formatLongDate(formatShortDate(fromIso(start))) : "Start"} to ${end ? formatLongDate(formatShortDate(fromIso(end))) : "today"}`
      : "Select period";

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading transactions" />
      {refreshing && !loading ? <span className="sr-only" role="status">Updating transactions</span> : null}
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Income</dt>
            <dd><LoadingText loading={loading}>{formatTotal(totalIncome)}</LoadingText></dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd><LoadingText loading={loading}>{formatTotal(totalExpense)}</LoadingText></dd>
          </div>
          <div>
            <dt>Net</dt>
            <dd className={`${ledger.net} total-rule`}><LoadingText loading={loading}>{formatAmount(netBalance)}</LoadingText></dd>
          </div>
        </dl>
        <button
          type="button"
          className={ledger.primaryButton}
          onClick={() => { setEditing(null); setFormError(""); setAddOpen(true); }}
          disabled={loading || !selectedCashRegisterId || Boolean(loadError)}
        >
          Add transaction
        </button>
      </div>

      <div className={`${ledger.toolbar} ${ledger.toolbarWide}`}>
        <label className={ledger.searchField}>
          <span className="sr-only">Search transactions</span>
          <input
            value={query}
            disabled={loading}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search transactions"
          />
        </label>
        <StyledDropdown
          ariaLabel="Select category"
          value={category}
          onChange={(value) => {
            setCategory(value as typeof category);
            setPage(1);
          }}
          className={styles.filterDropdown}
          options={[
            { value: "All", label: "All categories" },
            { value: "Material", label: "Material" },
            { value: "Sonstiges", label: "Sonstiges" },
            { value: "Veranstaltung", label: "Veranstaltung" },
          ]}
        />
        <StyledDropdown
          ariaLabel="Select type"
          value={type}
          onChange={(value) => {
            setType(value as typeof type);
            setPage(1);
          }}
          className={styles.filterDropdown}
          options={[
            { value: "All", label: "All types" },
            { value: "Income", label: "Income" },
            { value: "Expenses", label: "Expenses" },
          ]}
        />
        <button
          type="button"
          className={ledger.secondaryButton}
          onClick={() => {
            setDraftStart(start);
            setDraftEnd(end);
            setDateOpen(true);
          }}
        >
          {dateLabel}
        </button>
        <button type="button" className={ledger.secondaryButton} onClick={openFilters}>
          {activeFilterCount ? `Filters (${activeFilterCount})` : "Filters"}
        </button>
      </div>

      <div className={ledger.tableWrap}>
        {loading ? (
          <LoadingCollection loading knownItemCount={items.length} emptyHeight="14rem" label="Loading transactions">
            <div />
          </LoadingCollection>
        ) : loadError ? null : !visible.length ? (
          <EmptyState
            title="No transactions found"
            description="Change the search or reset the filters."
            action={<button type="button" onClick={resetFilters}>Reset filters</button>}
          />
        ) : (
          <table className={`${ledger.table} ${ledger.clickable}`}>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col" className={ledger.hideOnPhone}>Category</th>
                <th scope="col" className={ledger.hideOnPhone}>Date</th>
                <th scope="col" className={ledger.hideOnPhone}>Receipt</th>
                <th scope="col" className={ledger.hideOnPhone}>Status</th>
                <th scope="col" className={ledger.amount}>Amount</th>
                <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((transaction) => {
                const missingReceipt = !transaction.receipt && transaction.type === "expense";
                const needsReview = Boolean(transaction.receipt) && transaction.reviewStatus !== "Approved";

                return (
                  <tr
                    key={transaction.id}
                    tabIndex={0}
                    onClick={() => setSelected(transaction)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;

                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(transaction);
                      }
                    }}
                  >
                    <td>
                      <span className={ledger.title}>{transaction.title}</span>
                      <span className={ledger.phoneMeta}>
                        {transaction.category}, {formatLongDate(transaction.date)}
                        {missingReceipt ? <b>, receipt missing</b> : needsReview ? <b>, {transaction.reviewStatus.toLowerCase()}</b> : null}
                      </span>
                    </td>
                    <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{transaction.category}</td>
                    <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{formatLongDate(transaction.date)}</td>
                    <td className={ledger.hideOnPhone}>
                      {transaction.receipt ? <span className={ledger.muted}>Attached</span> : missingReceipt ? <b>Missing</b> : null}
                    </td>
                    <td className={ledger.hideOnPhone}>
                      {transaction.receipt ? (
                        <span className={transaction.reviewStatus === "Approved" ? ledger.muted : transaction.reviewStatus === "Invalid" ? ledger.invalid : ledger.attention}>
                          {transaction.reviewStatus}
                        </span>
                      ) : null}
                    </td>
                    <td className={ledger.amount}>{formatAmount(transaction.amount)}</td>
                    <td className={ledger.actions} onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        label={transaction.title}
                        canEdit={transaction.canEdit}
                        canDelete={transaction.canDelete}
                        onEdit={() => openEdit(transaction)}
                        onDelete={() => openArchive(transaction)}
                        onReceipt={transaction.receiptId ? () => { void openReceiptReview(transaction); } : undefined}
                        receiptLabel={transaction.receiptId ? transaction.reviewStatus === "Pending review" ? "Review receipt" : "View receipt" : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className={ledger.pagination}>
        <span>
          <LoadingText loading={loading}>{rangeStart} to {rangeEnd} of {results.length}</LoadingText>
        </span>
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={loading ? () => undefined : setPage}
          className={ledger.pageButtons}
        />
      </footer>

      {dateOpen ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label="Select period"
          onClose={() => setDateOpen(false)}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Select period</h2>
              <p>Set the period for the transaction list.</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setDateOpen(false)}
              aria-label="Close dialog"
            >
              <X />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.dateFields}>
              <label className={styles.formField}>
                <span>From</span>
                <input
                  type="date"
                  value={draftStart}
                  onChange={(event) => setDraftStart(event.target.value)}
                />
              </label>
              <label className={styles.formField}>
                <span>To</span>
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
              Reset
            </button>
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setDateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={applyFilters}
              >
                Apply
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {filterOpen ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${styles.filterModal}`}
          label="Filter transactions"
          onClose={() => setFilterOpen(false)}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Filter transactions</h2>
              <p>
                Filter the list.
              </p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
            >
              <X />
            </button>
          </div>
          <div className={`${styles.modalBody} ${styles.filterModalBody}`}>
            <div className={styles.filterColumns}>
              <fieldset className={styles.filterGroup}>
                <legend>Category</legend>
                {categoryFilterOptions.map(
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
                <legend>Type</legend>
                {transactionTypeFilterOptions.map((value) => (
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
              <span className={styles.modalSectionLabel}>Amount</span>
              <div className={styles.dateFields}>
                <label className={styles.inlineField}>
                  <span>From</span>
                  <input
                    aria-label="Amount from"
                    inputMode="decimal"
                    value={draftMinAmount}
                    onChange={(event) => setDraftMinAmount(event.target.value)}
                    placeholder="$0.00"
                  />
                </label>
                <label className={styles.inlineField}>
                  <span>To</span>
                  <input
                    aria-label="Amount to"
                    inputMode="decimal"
                    value={draftMaxAmount}
                    onChange={(event) => setDraftMaxAmount(event.target.value)}
                    placeholder="$0.00"
                  />
                </label>
              </div>
            </div>
            <div className={styles.filterColumns}>
              <fieldset className={styles.filterGroup}>
                <legend>Receipt status</legend>
                <div className={styles.segmented}>
                  {receiptFilterOptions.map(
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
                        {value === "Vorhanden" ? "Present" : value === "Fehlt" ? "Missing" : value}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
              <fieldset className={styles.filterGroup}>
                <legend>Review status</legend>
                <div className={styles.segmented}>
                  {reviewFilterOptions.map(
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
              Reset
            </button>
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setFilterOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={applyFilters}
              >
                Apply filters
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {addOpen ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label={editing ? "Edit transaction" : "Add transaction"}
          onClose={closeTransactionModal}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>{editing ? "Edit transaction" : "Add transaction"}</h2>
              <p>{editing ? "The change will be recorded as a correction in the cash book." : "Record a new income or expense."}</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={closeTransactionModal}
              disabled={saving}
              aria-label="Close dialog"
            >
              <X />
            </button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Description</span>
              <input
                autoFocus={typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="e.g. Sponsorship"
              />
            </label>
            <div className={editing ? styles.editWalletNote : undefined}>
              <CashRegisterCombobox value={editing?.walletId ?? selectedCashRegisterId} options={cashRegisters} onChange={setSelectedCashRegisterId} />
              {editing ? <small>The cash register of a posted transaction cannot be changed.</small> : null}
            </div>
            <div className={styles.dateFields}>
              <StyledDropdown
                ariaLabel="Select type"
                label="Type"
                value={newType}
                onChange={(value) => {
                  setNewType(value as typeof newType);
                }}
                className={styles.formDropdown}
                options={[
                  { value: "Einnahme", label: "Income" },
                  { value: "Ausgabe", label: "Expense" },
                ]}
              />
              <StyledDropdown
                ariaLabel="Select category"
                label="Category"
                value={newCategory}
                onChange={(value) => {
                  setNewCategory(value as Category);
                }}
                className={styles.formDropdown}
                options={[
                  { value: "Material", label: "Material" },
                  { value: "Sonstiges", label: "Sonstiges" },
                  { value: "Veranstaltung", label: "Veranstaltung" },
                ]}
              />
            </div>
            <label className={styles.formField}>
              <span>Amount</span>
              <input
                inputMode="decimal"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                placeholder="0,00"
              />
            </label>
            {editing ? (
              <label className={styles.formField}>
                <span>Correction reason</span>
                <textarea
                  value={correctionReason}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  placeholder="e.g. the amount on the receipt was incorrect"
                  rows={3}
                />
              </label>
            ) : null}
          </div>
          {formError ? <p className={styles.error} role="alert">{formError}</p> : null}
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeTransactionModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={addTransaction}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? "Saving" : editing ? "Save correction" : "Add"}
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {selected ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label="Transaction details"
          onClose={() => setSelected(null)}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>{selected.title}</h2>
              <p>Transaction details</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              <X />
            </button>
          </div>
          <div className={styles.detailGrid}>
            <span>Category</span>
            <strong>{selected.category}</strong>
            <span>Date</span>
            <strong>{formatLongDate(selected.date)}</strong>
            <span>Amount</span>
            <strong>{formatAmount(selected.amount)}</strong>
            <span>Receipt</span>
            <strong>{selected.receipt ?? "No receipt"}</strong>
          </div>
        </Dialog>
      ) : null}

      {receiptReviewTarget ? (
        <ReceiptReviewDialog
          receipt={receiptReviewTarget.receipt}
          previewUrl={receiptPreviewUrl}
          previewLoading={receiptPreviewLoading}
          previewError={receiptPreviewError}
          saving={saving}
          error={receiptReviewError}
          onClose={() => setReceiptReviewTarget(null)}
          onDecision={(decision) => { void decideReceiptReview(decision); }}
        />
      ) : null}

      {archiveTarget ? (
        <Dialog
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
          label="Archive transaction"
          onClose={() => { if (!saving) setArchiveTarget(null); }}
        >
          <div className={styles.modalHeader}>
            <div>
              <h2>Archive transaction?</h2>
              <p>It stays in the review log but no longer counts in totals.</p>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => setArchiveTarget(null)} disabled={saving} aria-label="Close dialog"><X /></button>
          </div>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Reason</span>
              <textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why should the transaction be archived?" rows={3} autoFocus />
            </label>
            {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
          </div>
          <div className={styles.modalFooter}>
            <span />
            <div>
              <button type="button" className={styles.secondaryButton} onClick={() => setArchiveTarget(null)} disabled={saving}>Cancel</button>
              <button type="button" className={styles.primaryButton} onClick={confirmArchiveTransaction} disabled={saving || !archiveReason.trim()} aria-busy={saving}>{saving ? "Archiving" : "Archive"}</button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
