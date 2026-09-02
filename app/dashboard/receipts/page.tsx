"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import {
  Check,
  ChevronsUpDown,
  Clock3,
  FileText,
  Link2,
  Search,
  Upload,
  X,
} from "lucide-react";
import styles from "./receipts.module.css";
import { Dialog } from "@/components/ui/dialog";
import {
  FieldDropdown,
  type FieldDropdownOption,
} from "@/components/ui/field-dropdown";
import { Pagination } from "@/components/ui/pagination";
import { ModalSkeleton } from "@/components/ui/modal-skeleton";
import { LoadingCollection, LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import phoneStyles from "./receipts-phone.module.css";
import {
  getDashboardSnapshot,
  listReceiptsForCurrentOrganization,
} from "@/features/finance/actions/queries";
import { createReceiptDownloadUrl, reviewReceipt, uploadReceipt } from "@/features/receipts/actions/receipts";
import { archiveReceipt, updateReceiptMetadata } from "@/features/receipts/actions/receipts";
import { cachedFinanceQuery, getFinanceCacheState, invalidateFinanceQuery, subscribeFinanceQuery } from "@/lib/finance/client-cache";
import { RowActionMenu } from "@/components/ui/row-actions";
import { ReceiptReviewDialog, type ReceiptReviewDecision } from "@/components/receipts/ReceiptReviewDialog";

type ReceiptStatus = "Approved" | "Pending review" | "Invalid" | "Ohne Zuordnung";
type Receipt = {
  id: number | string;
  file: string;
  type: string;
  size: string;
  transaction: string;
  kind: string;
  date: string;
  amount: number;
  status: ReceiptStatus;
  transactionId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  uploadedByName: string;
  uploadedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
};

function formatReceiptDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type ServerReceipt = {
  id: string;
  file: string;
  type: string;
  sizeBytes: number;
  transaction: string;
  transactionId: string | null;
  assigned: boolean;
  date: string;
  amountMinor: string;
  status: string;
  canEdit: boolean;
  canDelete: boolean;
  uploadedByName: string;
  uploadedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
};

function mapReceipt(item: ServerReceipt): Receipt {
  return {
    id: item.id,
    file: item.file,
    type: item.type,
    size: `${Math.round(item.sizeBytes / 1024)} KB`,
    transaction: item.transaction,
    transactionId: item.transactionId,
    kind: "",
    date: item.date ? formatReceiptDate(item.date) : formatReceiptDate(new Date().toISOString()),
    amount: Number(item.amountMinor) / 100,
    status: item.status === "approved" ? "Approved" : item.status === "rejected" ? "Invalid" : !item.assigned ? "Ohne Zuordnung" : "Pending review",
    canEdit: item.canEdit,
    canDelete: item.canDelete,
    uploadedByName: item.uploadedByName,
    uploadedAt: item.uploadedAt,
    reviewedByName: item.reviewedByName,
    reviewedAt: item.reviewedAt,
  };
}

/*
const receipts: Receipt[] = [];
  {
    id: 1,
    file: "Rechnung_Abizeitung.pdf",
    type: "PDF",
    size: "245 KB",
    transaction: "Abizeitung Druckkosten",
    kind: "Expenses",
    date: "15.05.2026",
    amount: -1250,
    status: "Approved",
  },
  {
    id: 2,
    file: "Bon_Abiball.jpg",
    type: "JPG",
    size: "1,3 MB",
    transaction: "Abiball Deko",
    kind: "Expenses",
    date: "12.05.2026",
    amount: -86.5,
    status: "Approved",
  },
  {
    id: 3,
    file: "Rechnung_Busfahrt.pdf",
    type: "PDF",
    size: "312 KB",
    transaction: "Abifahrt Bus",
    kind: "Expenses",
    date: "10.05.2026",
    amount: -2400,
    status: "Approved",
  },
  {
    id: 4,
    file: "Rechnung_T-Shirts.pdf",
    type: "PDF",
    size: "198 KB",
    transaction: "T-Shirts Abijahrgang",
    kind: "Expenses",
    date: "08.05.2026",
    amount: -950,
    status: "Pending review",
  },
  {
    id: 5,
    file: "Bon_Supermarkt.jpg",
    type: "JPG",
    size: "980 KB",
    transaction: "Abiball Verpflegung",
    kind: "Expenses",
    date: "07.05.2026",
    amount: -168.75,
    status: "Approved",
  },
  {
    id: 6,
    file: "Rechnung_DJ.pdf",
    type: "PDF",
    size: "276 KB",
    transaction: "Abiball DJ",
    kind: "Expenses",
    date: "05.05.2026",
    amount: -600,
    status: "Pending review",
  },
  {
    id: 7,
    file: "Bakery receipt.jpg",
    type: "JPG",
    size: "512 KB",
    transaction: "—",
    kind: "Unassigned",
    date: "03.05.2026",
    amount: -54.2,
    status: "Ohne Zuordnung",
  },
  {
    id: 8,
    file: "Rechnung_Lichttechnik.pdf",
    type: "PDF",
    size: "341 KB",
    transaction: "Abiball Lichttechnik",
    kind: "Expenses",
    date: "28.04.2026",
    amount: -350,
    status: "Approved",
  },
  {
    id: 9,
    file: "Quittung_Deko.pdf",
    type: "PDF",
    size: "120 KB",
    transaction: "Dekoration Klassenraum",
    kind: "Expenses",
    date: "25.04.2026",
    amount: -96.4,
    status: "Approved",
  },
  {
    id: 10,
    file: "Drinks receipt.jpg",
    type: "JPG",
    size: "760 KB",
    transaction: "Cake sale",
    kind: "Income",
    date: "22.04.2026",
    amount: 185.5,
    status: "Approved",
  },
  {
    id: 11,
    file: "Rechnung_Druck.pdf",
    type: "PDF",
    size: "288 KB",
    transaction: "Druck Nachzahlung",
    kind: "Expenses",
    date: "20.04.2026",
    amount: -75,
    status: "Approved",
  },
  {
    id: 12,
    file: "Bon_Material.jpg",
    type: "JPG",
    size: "640 KB",
    transaction: "Material Einkauf",
    kind: "Expenses",
    date: "18.04.2026",
    amount: -180,
    status: "Pending review",
  },
  {
    id: 13,
    file: "Quittung_Spende.pdf",
    type: "PDF",
    size: "154 KB",
    transaction: "Spende Eltern",
    kind: "Income",
    date: "15.04.2026",
    amount: 250,
    status: "Approved",
  },
  {
    id: 14,
    file: "Stage invoice.pdf",
    type: "PDF",
    size: "402 KB",
    transaction: "Stage setup",
    kind: "Expenses",
    date: "12.04.2026",
    amount: -420,
    status: "Approved",
  },
  {
    id: 15,
    file: "Bon_Druckerei.jpg",
    type: "JPG",
    size: "890 KB",
    transaction: "Plakate",
    kind: "Expenses",
    date: "10.04.2026",
    amount: -120,
    status: "Approved",
  },
  {
    id: 16,
    file: "Rechnung_Raum.pdf",
    type: "PDF",
    size: "219 KB",
    transaction: "Raummiete",
    kind: "Expenses",
    date: "08.04.2026",
    amount: -300,
    status: "Pending review",
  },
  {
    id: 17,
    file: "Bon_Blumen.jpg",
    type: "JPG",
    size: "438 KB",
    transaction: "Dekoration Abiball",
    kind: "Expenses",
    date: "06.04.2026",
    amount: -72.5,
    status: "Approved",
  },
];
*/

const statusOptions = [
  "All",
  "Approved",
  "Pending review",
  "Invalid",
  "Ohne Zuordnung",
] as const;
const periodOptions = [
  "All",
  "This month",
  "Last month",
  "This year",
] as const;
/*
const transactionOptions = [
  { value: "", label: "Ohne Zuordnung", date: "", amount: "" },
  {
    value: "Abizeitung Druckkosten",
    label: "Abizeitung Druckkosten",
    date: "12.05.2024",
    amount: "-$320.00",
  },
  {
    value: "Cake sale",
    label: "Cake sale",
    date: "11.05.2024",
    amount: "+$185.50",
  },
  {
    value: "Dekoration Abiball",
    label: "Dekoration Abiball",
    date: "08.05.2024",
    amount: "-$184.90",
  },
  {
    value: "Spende Eltern",
    label: "Spende Eltern",
    date: "07.05.2024",
    amount: "+$250.00",
  },
  {
    value: "Abifahrt Bus",
    label: "Abifahrt Bus",
    date: "05.05.2024",
    amount: "-$1,200.00",
  },
  {
    value: "T-Shirts Abijahrgang",
    label: "T-Shirts Abijahrgang",
    date: "03.05.2024",
    amount: "-95$0.00",
  },
] as const; */

function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const dropdownOptions = options.map((option) => ({
    value: option,
    label: option === "All" ? `${ariaLabel}: All` : option,
  }));
  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      value={value}
      options={dropdownOptions as readonly FieldDropdownOption[]}
      onChange={onChange}
      className={styles.dropdown}
    />
  );
}

type TransactionOption = {
  value: string;
  label: string;
  date: string;
  amount: string;
};

function TransactionCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly TransactionOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.date} ${option.amount}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <label className={styles.formField}>
      <span>Transaction zuordnen</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={styles.comboboxTrigger}
              aria-expanded={open}
              aria-label="Select transaction"
            />
          }
        >
          <span>{selected?.label || "Select transaction"}</span>
          <ChevronsUpDown aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionAvoidance={{
            side: "shift",
            align: "shift",
            fallbackAxisSide: "none",
          }}
          className={styles.comboboxContent}
        >
          <label className={styles.comboboxSearch}>
            <Search aria-hidden="true" />
            <span className="sr-only">Transactions durchsuchen</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, date, or amount …"
            />
          </label>
          <div
            className={styles.comboboxList}
            role="listbox"
            aria-label="Available transactions"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value || "unassigned"}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={styles.comboboxOption}
                  onClick={() => {
                    onChange(option.value);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.date ? (
                      <small>{option.date}</small>
                    ) : (
                      <small>Assign receipt later</small>
                    )}
                  </span>
                  {option.amount ? (
                    <b
                      className={
                        option.amount.startsWith("+")
                          ? styles.positive
                          : styles.negative
                      }
                    >
                      {option.amount}
                    </b>
                  ) : null}
                  {option.value === value ? (
                    <Check
                      className={styles.comboboxCheck}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ))
            ) : (
              <p className={styles.comboboxEmpty}>
                No passende Transaction gefunden.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}

function formatAmount(amount: number) {
  return `${amount < 0 ? "-" : "+"}${Math.abs(amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })} $`;
}

function PhoneReceiptsView({
  loading,
  receipts,
  query,
  onQueryChange,
  status,
  onStatusChange,
  period,
  onPeriodChange,
  page,
  pageCount,
  total,
  pendingCount,
  unassignedCount,
  rangeStart,
  rangeEnd,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onReview,
}: {
  loading: boolean;
  receipts: Receipt[];
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  period: string;
  onPeriodChange: (value: string) => void;
  page: number;
  pageCount: number;
  total: number;
  pendingCount: number;
  unassignedCount: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (receipt: Receipt) => void;
  onDelete: (receipt: Receipt) => void;
  onReview: (receipt: Receipt) => void;
}) {
  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section className={phoneStyles.summary} aria-label="Receiptstatus" data-ui-slot="summary">
        <div className={phoneStyles.summaryItem}>
          <span>All</span>
          <strong><LoadingText loading={loading}>{total}</LoadingText></strong>
        </div>
        <div className={phoneStyles.summaryItem}>
          <span>Pending review</span>
          <strong><LoadingText loading={loading}>{pendingCount}</LoadingText></strong>
        </div>
        <div className={phoneStyles.summaryItem}>
          <span>Ohne Zuordnung</span>
          <strong><LoadingText loading={loading}>{unassignedCount}</LoadingText></strong>
        </div>
      </section>

      <div className={phoneStyles.toolbar} data-ui-slot="toolbar">
        <label className={phoneStyles.search}>
          <Search aria-hidden="true" />
          <span className="sr-only">Receipts suchen</span>
          <input
            value={query}
            disabled={loading}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Filename or transaction …"
          />
        </label>
        <button
          type="button"
          className={phoneStyles.uploadButton}
          onClick={onAdd}
          disabled={loading}
          aria-label="Add receipt"
        >
          <Upload aria-hidden="true" />
        </button>
        <div className={phoneStyles.filterRow}>
          <Dropdown
            ariaLabel="Status"
            value={status}
            options={statusOptions}
            onChange={onStatusChange}
          />
          <Dropdown
            ariaLabel="Zeitraum"
            value={period}
            options={periodOptions}
            onChange={onPeriodChange}
          />
        </div>
      </div>

      <header className={phoneStyles.listHeader} data-ui-slot="list-header">
        <h2>Receipts</h2>
        <span><LoadingText loading={loading}>{total} Fileen</LoadingText></span>
      </header>

      <div className={phoneStyles.rows} data-ui-slot="list-body">
        <LoadingCollection loading={loading} knownItemCount={receipts.length} emptyHeight="10rem" label="Receipts are loading…">
          {receipts.length ? receipts.map((receipt) => (
          <article className={phoneStyles.row} key={receipt.id}>
            <FileText aria-hidden="true" />
            <span className={phoneStyles.rowMain}>
              <strong>{receipt.file}</strong>
              <small>Uploaded by {receipt.uploadedByName}</small>
              <span>
                {receipt.transaction === "—"
                  ? "Unassigned"
                  : receipt.transaction}
              </span>
            </span>
            <span className={phoneStyles.rowSide}>
              <b
                className={
                  receipt.amount >= 0
                    ? phoneStyles.positive
                    : phoneStyles.negative
                }
              >
                {formatAmount(receipt.amount)}
              </b>
              <small
                className={
                  receipt.status === "Approved" ? "" : phoneStyles.review
                }
              >
                {receipt.status}
              </small>
            </span>
            <RowActionMenu
              label={receipt.file}
              canEdit={receipt.canEdit}
              canDelete={receipt.canDelete}
              onEdit={() => onEdit(receipt)}
              onDelete={() => onDelete(receipt)}
              onReceipt={() => onReview(receipt)}
              receiptLabel={receipt.status === "Pending review" ? "Review receipt" : "View receipt"}
            />
          </article>
          )) : <div className={phoneStyles.empty}>No receipts found.</div>}
        </LoadingCollection>
      </div>

      <footer className={phoneStyles.footer} data-ui-slot="footer">
        <span>
          <LoadingText loading={loading}>{rangeStart}-{rangeEnd} by {total}</LoadingText>
        </span>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={loading ? () => undefined : onPageChange}
        />
      </footer>
    </div>
  );
}

export default function ReceiptsPage() {
  const mode = usePresentationMode();
  const { userId, orgId } = useAppAuth();
  const cacheScope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  const initialReceipts = getFinanceCacheState<Awaited<ReturnType<typeof listReceiptsForCurrentOrganization>>>("receipts", cacheScope);
  const [items, setItems] = useState<Receipt[]>(() => initialReceipts.data?.ok ? initialReceipts.data.items.map(mapReceipt) : []);
  const [loading, setLoading] = useState(!initialReceipts.data?.ok);
  const [refreshing, setRefreshing] = useState(Boolean(initialReceipts.data?.ok && !initialReceipts.fresh));
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState("All");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Receipt | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [transaction, setTransaction] = useState("");
  const [availableTransactions, setAvailableTransactions] =
    useState<readonly TransactionOption[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Receipt | null>(null);
  const [reviewPreviewUrl, setReviewPreviewUrl] = useState<string | null>(null);
  const [reviewPreviewLoading, setReviewPreviewLoading] = useState(false);
  const [reviewPreviewError, setReviewPreviewError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const archiveIdempotencyKey = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    const applyResult = (result: Awaited<ReturnType<typeof listReceiptsForCurrentOrganization>>) => {
        if (!active) return;
        if (!result.ok) {
          setLoadError("Receipts could not be loaded.");
          return;
        }
        setItems(result.items.map(mapReceipt));
        setLoadError("");
      };
    const unsubscribe = subscribeFinanceQuery("receipts", (value) => applyResult(value as Awaited<ReturnType<typeof listReceiptsForCurrentOrganization>>), cacheScope);
    cachedFinanceQuery("receipts", listReceiptsForCurrentOrganization, { scope: cacheScope })
      .then(applyResult)
      .catch(() => {
        if (active) setLoadError("Receipts could not be loaded.");
      })
      .finally(() => {
        if (active) { setLoading(false); setRefreshing(false); }
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cacheScope]);

  useEffect(() => {
    let active = true;
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, { scope: cacheScope })
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setUploadError("Transactions could not be loaded.");
          return;
        }
        setAvailableTransactions([
          { value: "", label: "Ohne Zuordnung", date: "", amount: "" },
          ...result.transactions.map((item) => ({
            value: item.id,
            label: item.title,
            date: item.date ? formatReceiptDate(item.date) : "",
            amount: `${Number(item.amountMinor) >= 0 ? "+" : "-"}${Math.abs(Number(item.amountMinor) / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })} $`,
          })),
        ]);
      })
      .catch(() => {
        if (active) setUploadError("Transactions could not be loaded.");
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cacheScope]);

  const filtered = useMemo(
    () =>
      items.filter((receipt) => {
        const needle = query.trim().toLowerCase();
        const month = receipt.date.slice(3, 5);
        return (
          (!needle ||
            `${receipt.file} ${receipt.transaction}`
              .toLowerCase()
              .includes(needle)) &&
          (status === "All" || receipt.status === status) &&
          (period === "All" ||
            period === "This year" ||
            (period === "This month" ? month === "05" : month === "04"))
        );
      }),
    [items, period, query, status],
  );
  const pageSize = useResponsivePageSize({
    defaultSize: 9,
    landscapeSize: 6,
    wideSize: 10,
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  }

  useEffect(() => {
    if (!selectedFile?.type.startsWith("image/")) {
      setFilePreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedFile]);

  function removeSelectedFile() {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileName("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function openEditReceipt(receipt: Receipt) {
    setEditingReceipt(receipt);
    setFileName(receipt.file);
    setTransaction(receipt.transactionId ?? "");
    setUploadError("");
    setModalOpen(true);
  }

  function openArchiveReceipt(receipt: Receipt) {
    setArchiveTarget(receipt);
    setArchiveReason("");
    setActionError("");
    archiveIdempotencyKey.current = `archive-receipt-${receipt.id}-${crypto.randomUUID()}`;
  }

  async function openReviewReceipt(receipt: Receipt) {
    setReviewTarget(receipt);
    setReviewError("");
    setReviewPreviewUrl(null);
    setReviewPreviewError("");
    setReviewPreviewLoading(true);
    const result = await createReceiptDownloadUrl(receipt.id.toString());
    if (result.success) setReviewPreviewUrl(result.data.url);
    else setReviewPreviewError(result.error.message);
    setReviewPreviewLoading(false);
  }

  async function confirmReviewReceipt(decision: ReceiptReviewDecision) {
    if (!reviewTarget || saving) return;
    setSaving(true);
    setReviewError("");
    try {
      const result = await reviewReceipt({
        receiptId: reviewTarget.id.toString(),
        status: decision,
      });
      if (!result.success) {
        setReviewError(result.error.message);
        return;
      }
      const nextStatus: ReceiptStatus = decision === "approved" ? "Approved" : decision === "rejected" ? "Invalid" : "Pending review";
      setItems((current) => current.map((item) => item.id === reviewTarget.id ? { ...item, status: nextStatus } : item));
      setReviewTarget(null);
      invalidateFinanceQuery("receipts", "transactions", "dashboard-snapshot", "report-snapshot", "report-kpis");
    } finally {
      setSaving(false);
    }
  }

  async function submitReceipt() {
    if (saving) return;
    if (editingReceipt) {
      if (!fileName.trim()) {
        setUploadError("Please enter a filename.");
        return;
      }
      setSaving(true);
      setUploadError("");
      try {
        const result = await updateReceiptMetadata({
          receiptId: editingReceipt.id.toString(),
          fileName: fileName.trim(),
          transactionId: /^[0-9a-f-]{36}$/i.test(transaction) ? transaction : null,
        });
        if (!result.success) {
          setUploadError(result.error.message);
          return;
        }
        setItems((current) => current.map((item) => item.id === editingReceipt.id ? {
          ...item,
          file: fileName.trim(),
          transactionId: /^[0-9a-f-]{36}$/i.test(transaction) ? transaction : null,
          transaction: availableTransactions.find((option) => option.value === transaction)?.label ?? "Unassigned",
          status: transaction ? item.status : "Ohne Zuordnung",
        } : item));
        invalidateFinanceQuery("receipts", "transactions", "dashboard-snapshot", "report-snapshot", "report-kpis");
        closeModal();
      } finally {
        setSaving(false);
      }
      return;
    }
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setSaving(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    if (/^[0-9a-f-]{36}$/i.test(transaction)) formData.append("transactionId", transaction);
    try {
      const result = await uploadReceipt(formData);
      if (result.success) {
        invalidateFinanceQuery("receipts", "transactions", "dashboard-snapshot", "report-snapshot", "report-kpis");
        closeModal();
      } else {
        setUploadError("The receipt could not be uploaded.");
      }
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingReceipt(null);
    setFileName("");
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setTransaction("");
  }

  async function confirmArchiveReceipt() {
    if (!archiveTarget || saving || !archiveReason.trim()) return;
    setSaving(true);
    setActionError("");
    try {
      const result = await archiveReceipt({
        receiptId: archiveTarget.id.toString(),
        reason: archiveReason,
        idempotencyKey: archiveIdempotencyKey.current ?? `archive-receipt-${archiveTarget.id}`,
      });
      if (!result.success) {
        setActionError(result.error.message);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== archiveTarget.id));
      setArchiveTarget(null);
      setArchiveReason("");
      archiveIdempotencyKey.current = null;
      invalidateFinanceQuery("receipts", "transactions", "dashboard-snapshot", "report-snapshot", "report-kpis");
    } finally {
      setSaving(false);
    }
  }

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
      <LoadingStatus loading={loading} label="Receipts are loading…" />
      {refreshing && !loading ? <span className="sr-only" role="status">Receipts are updating…</span> : null}
      {loadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{loadError}</p> : null}
      {mode === "phone" ? (
        <PhoneReceiptsView
          loading={loading}
          receipts={visible}
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          period={period}
          onPeriodChange={(value) => {
            setPeriod(value);
            setPage(1);
          }}
          page={currentPage}
          pageCount={pageCount}
          total={filtered.length}
          pendingCount={items.filter((item) => item.status === "Pending review").length}
          unassignedCount={items.filter((item) => item.status === "Ohne Zuordnung").length}
          rangeStart={filtered.length ? (currentPage - 1) * pageSize + 1 : 0}
          rangeEnd={Math.min(currentPage * pageSize, filtered.length)}
          onPageChange={setPage}
          onAdd={() => setModalOpen(true)}
          onEdit={openEditReceipt}
          onDelete={openArchiveReceipt}
          onReview={openReviewReceipt}
        />
      ) : (
        <>
          <div className={styles.summaryGrid} data-ui-slot="summary">
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <FileText />
              </span>
              <div>
                <span>All Receipts</span>
                <strong><LoadingText loading={loading}>{items.length}</LoadingText></strong>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.warningIcon}`}>
                <Clock3 />
              </span>
              <div>
                <span>Pending review</span>
                <strong><LoadingText loading={loading}>{items.filter((item) => item.status === "Pending review").length}</LoadingText></strong>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Link2 />
              </span>
              <div>
                <span>Ohne Zuordnung</span>
                <strong><LoadingText loading={loading}>{items.filter((item) => item.status === "Ohne Zuordnung").length}</LoadingText></strong>
              </div>
            </article>
          </div>

          <article className={styles.listCard} data-ui-slot="content">
            <header className={styles.listHeader}>
              <h2>Receipt overview</h2>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setModalOpen(true)}
                disabled={loading}
                data-ui-slot="primary-action"
              >
                <Upload />
                Add receipt
              </button>
            </header>
            <div className={styles.filters} data-ui-slot="toolbar">
              <label className={styles.searchField}>
                <Search />
                <span className="sr-only">Receipts suchen</span>
                <input
                  value={query}
                  disabled={loading}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by filename or transaction …"
                />
              </label>
              <Dropdown
                ariaLabel="Status"
                value={status}
                options={statusOptions}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
              <Dropdown
                ariaLabel="Zeitraum"
                value={period}
                options={periodOptions}
                onChange={setPeriod}
              />
            </div>
            <div className={`${styles.tableWrap} ui-data-table`} data-ui-slot="list-body">
              <div className={styles.tableHeader}>
                <span>Receipt</span>
                <span>Zugeordnete Transaction</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
                <span />
              </div>
              <div className={styles.rows}>
                {loading ? (
                  <LoadingCollection loading knownItemCount={items.length} emptyHeight="100%" label="Receipts are loading…"><div /></LoadingCollection>
                ) : !visible.length ? (
                  <EmptyState
                    title="No Receipts gefunden"
                    description="Change the search or reset the filters."
                    action={<button type="button" onClick={() => { setQuery(""); setStatus("All"); setPeriod("All"); setPage(1); }}>Reset filters</button>}
                  />
                ) : null}
                {!loading && visible.map((receipt) => (
                  <div className={styles.row} key={receipt.id}>
                    <span className={styles.fileCell}>
                      <span className={styles.fileIcon}>
                        <FileText />
                      </span>
                      <span>
                        <strong>{receipt.file}</strong>
                        <small>Uploaded by {receipt.uploadedByName}</small>
                      </span>
                    </span>
                    <span
                      data-label="Transaction"
                      className={styles.transactionCell}
                    >
                      <strong>{receipt.transaction}</strong>
                    </span>
                    <span
                      data-label="Date"
                      className={`ui-tabular ${styles.muted}`}
                    >
                      {receipt.date}
                    </span>
                    <span
                      data-label="Amount"
                      className={`ui-tabular ${receipt.amount < 0 ? styles.negative : styles.positive}`}
                    >
                      {formatAmount(receipt.amount)}
                    </span>
                    <span
                      data-label="Status"
                      className={`ui-badge ${styles.statusTag} ${receipt.status === "Approved" ? styles.checked : receipt.status === "Pending review" ? styles.review : receipt.status === "Invalid" ? styles.rejected : styles.unassigned}`}
                    >
                      {receipt.status === "Approved" ? (
                        <Check />
                      ) : receipt.status === "Pending review" ? (
                        <Clock3 />
                      ) : receipt.status === "Invalid" ? (
                        <X />
                      ) : (
                        <Link2 />
                      )}
                      {receipt.status}
                    </span>
                    <RowActionMenu
                      label={receipt.file}
                      canEdit={receipt.canEdit}
                      canDelete={receipt.canDelete}
                      onEdit={() => openEditReceipt(receipt)}
                      onDelete={() => openArchiveReceipt(receipt)}
                      onReceipt={() => { void openReviewReceipt(receipt); }}
                      receiptLabel={receipt.status === "Pending review" ? "Review receipt" : "View receipt"}
                    />
                  </div>
                ))}
              </div>
            </div>
            <footer className={styles.pagination} data-ui-slot="footer">
              <span>
                <LoadingText loading={loading}>{filtered.length
                  ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} by ${filtered.length}`
                  : "0 by 0"}</LoadingText>
              </span>
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                onPageChange={loading ? () => undefined : setPage}
                className={styles.pageButtons}
              />
            </footer>
          </article>
        </>
      )}

      {modalOpen ? (
        <Dialog
          label={editingReceipt ? "Edit receipt" : "Add receipt"}
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <header className={styles.modalHeader}>
            <div>
              <h2>{editingReceipt ? "Edit receipt" : "Add receipt"}</h2>
              <p>{editingReceipt ? "Change the filename or assignment. The review status remains unchanged." : "Upload a new receipt and assign it immediately."}</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close dialog"
              onClick={closeModal}
            >
              <X />
            </button>
          </header>
          <div className={styles.modalBody}>
            {!editingReceipt ? (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  hidden
                  onChange={handleFile}
                />
                {selectedFile ? (
                  <div className={styles.uploadPreview}>
                    {filePreviewUrl ? <img src={filePreviewUrl} alt={`Preview of ${selectedFile.name}`} className={styles.uploadPreviewImage} /> : <FileText className={styles.uploadPreviewIcon} aria-hidden="true" />}
                    <div className={styles.uploadPreviewMeta}>
                      <strong>{selectedFile.name}</strong>
                      <span>{selectedFile.type === "application/pdf" ? "PDF document" : "Image file"}</span>
                    </div>
                    <button type="button" className={styles.removeFileButton} onClick={removeSelectedFile} aria-label="Remove selected file"><X aria-hidden="true" /></button>
                  </div>
                ) : (
                  <button type="button" className={styles.uploadArea} onClick={() => fileInput.current?.click()}>
                    <Upload />
                    <strong>Drop receipt here</strong>
                    <span>PDF or JPG/PNG up to 5 MB. On mobile, the camera is also available.</span>
                    <span className={styles.uploadButton}>Choose file</span>
                  </button>
                )}
              </>
            ) : null}
            <label className={styles.formField}>
              <span>Filename</span>
              <input
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="z. B. Rechnung_Mai_2026.pdf"
              />
            </label>
            {transactionsLoading ? (
              <ModalSkeleton />
            ) : (
              <TransactionCombobox
                value={transaction}
                onChange={setTransaction}
                options={availableTransactions}
              />
            )}
          </div>
          {uploadError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{uploadError}</p> : null}
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={submitReceipt}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (editingReceipt ? "Saving …" : "Uploading …") : editingReceipt ? "Save changes" : "Add receipt"}
            </button>
          </footer>
        </Dialog>
      ) : null}

      {archiveTarget ? (
        <Dialog
          label="Receipt archivieren"
          onClose={() => { if (!saving) setArchiveTarget(null); }}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <header className={styles.modalHeader}>
            <div>
              <h2>Receipt archivieren?</h2>
              <p>The file is kept for traceability and removed from the active list.</p>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setArchiveTarget(null)} disabled={saving} aria-label="Close dialog"><X /></button>
          </header>
          <div className={styles.modalBody}>
            <label className={styles.formField}>
              <span>Reason</span>
              <input autoFocus value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why should the receipt be archived?" />
            </label>
            {actionError ? <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{actionError}</p> : null}
          </div>
          <footer className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={() => setArchiveTarget(null)} disabled={saving}>Cancel</button>
            <button type="button" className={styles.primaryButton} onClick={confirmArchiveReceipt} disabled={saving || !archiveReason.trim()} aria-busy={saving}>{saving ? "Archiving …" : "Archive"}</button>
          </footer>
        </Dialog>
      ) : null}

      {reviewTarget ? (
        <ReceiptReviewDialog
          receipt={reviewTarget}
          previewUrl={reviewPreviewUrl}
          previewLoading={reviewPreviewLoading}
          previewError={reviewPreviewError}
          saving={saving}
          error={reviewError}
          onClose={() => setReviewTarget(null)}
          onDecision={(decision) => { void confirmReviewReceipt(decision); }}
        />
      ) : null}
    </section>
  );
}
