"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import {
  Check,
  ChevronsUpDown,
  FileText,
  Search,
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
import {
  LoadingCollection,
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import ledger from "../ledger.module.css";
import dlg from "@/components/dashboard/dialog.module.css";
import { LoadError } from "@/components/ui/load-error";
import {
  getDashboardSnapshot,
  listReceiptsForCurrentOrganization,
} from "@/features/finance/actions/queries";
import {
  createReceiptDownloadUrl,
  reviewReceipt,
  uploadReceipt,
} from "@/features/receipts/actions/receipts";
import {
  archiveReceipt,
  updateReceiptMetadata,
} from "@/features/receipts/actions/receipts";
import {
  cachedFinanceQuery,
  financeScope,
  invalidateFinanceQuery,
} from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { pageWindow } from "@/hooks/use-pagination";
import { RowActionMenu } from "@/components/ui/row-actions";
import {
  ReceiptReviewDialog,
  type ReceiptReviewDecision,
} from "@/components/receipts/ReceiptReviewDialog";

type ReceiptStatus =
  | "Approved"
  | "Pending review"
  | "Invalid"
  | "Unassigned";

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

function formatShortDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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

function toReceipt(receipt: ServerReceipt): Receipt {
  return {
    id: receipt.id,
    file: receipt.file,
    type: receipt.type,
    size: `${Math.round(receipt.sizeBytes / 1024)} KB`,
    transaction: receipt.transaction,
    transactionId: receipt.transactionId,
    kind: "",
    date: receipt.date
      ? formatShortDate(receipt.date)
      : formatShortDate(new Date().toISOString()),
    amount: Number(receipt.amountMinor) / 100,
    status:
      receipt.status === "approved"
        ? "Approved"
        : receipt.status === "rejected"
          ? "Invalid"
          : !receipt.assigned
            ? "Unassigned"
            : "Pending review",
    canEdit: receipt.canEdit,
    canDelete: receipt.canDelete,
    uploadedByName: receipt.uploadedByName,
    uploadedAt: receipt.uploadedAt,
    reviewedByName: receipt.reviewedByName,
    reviewedAt: receipt.reviewedAt,
  };
}


const statusOptions: readonly string[] = [
  "All",
  "Approved",
  "Pending review",
  "Invalid",
  "Unassigned",
];

const periodOptions: readonly string[] = ["All", "This month", "Last month", "This year"];

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

  const typedDropdownOptions = dropdownOptions as readonly FieldDropdownOption[];

  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      value={value}
      options={typedDropdownOptions}
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
    <label className={dlg.field}>
      <span>Transaction</span>
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
            <span className="sr-only">Search transactions</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, date or amount"
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
                No matching transactions.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}

function longDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(amount: number) {
  return `${amount < 0 ? "−" : "+"}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReceiptsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);

  const { data, loading: queryLoading, refreshing, failed } = useFinanceQuery(
    "receipts",
    listReceiptsForCurrentOrganization,
    cacheScope,
  );

  const [items, setItems] = useState<Receipt[]>(() =>
    data?.ok ? data.items.map(toReceipt) : [],
  );

  const loadError = failed ? "Receipts could not be loaded." : "";
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
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const filePreviewUrl = useMemo(
    () =>
      selectedFile?.type.startsWith("image/")
        ? URL.createObjectURL(selectedFile)
        : null,
    [selectedFile],
  );

  const [transaction, setTransaction] = useState("");

  const [availableTransactions, setAvailableTransactions] = useState<
    readonly TransactionOption[]
  >([]);

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
    if (data?.ok) setItems(data.items.map(toReceipt));
  }, [data]);

  useEffect(() => {
    let active = true;
    cachedFinanceQuery("dashboard-snapshot", getDashboardSnapshot, {
      scope: cacheScope,
    })
      .then((snapshot) => {
        if (!active) return;

        if (!snapshot.ok) {
          setUploadError("Transactions could not be loaded.");

          return;
        }

        setAvailableTransactions([
          { value: "", label: "Unassigned", date: "", amount: "" },
          ...snapshot.transactions.map((dashboardTransaction) => ({
            value: dashboardTransaction.id,
            label: dashboardTransaction.title,
            date: dashboardTransaction.date
              ? formatShortDate(dashboardTransaction.date)
              : "",
            amount: formatAmount(Number(dashboardTransaction.amountMinor) / 100),
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

  const { pageCount, currentPage, offset, rangeStart, rangeEnd } = pageWindow(
    filtered.length,
    pageSize,
    page,
  );

  const visible = filtered.slice(offset, offset + pageSize);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  }

  useEffect(
    () => () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    },
    [filePreviewUrl],
  );

  useEffect(() => {
    if (!imagePreviewOpen) return;

    const trigger = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setImagePreviewOpen(false);
      }

      if (event.key === "Tab") event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      trigger?.focus();
    };
  }, [imagePreviewOpen]);

  function removeSelectedFile() {
    setSelectedFile(null);
    setImagePreviewOpen(false);
    setFileName("");
    setImagePreviewOpen(false);

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

      const nextStatus: ReceiptStatus =
        decision === "approved"
          ? "Approved"
          : decision === "rejected"
            ? "Invalid"
            : "Pending review";

      setItems((current) =>
        current.map((receipt) =>
          receipt.id === reviewTarget.id ? { ...receipt, status: nextStatus } : receipt,
        ),
      );
      setReviewTarget(null);
      invalidateFinanceQuery(
        "receipts",
        "transactions",
        "dashboard-snapshot",
        "report-snapshot",
        "report-kpis",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitReceipt() {
    if (saving) return;

    if (editingReceipt) {
      if (!fileName.trim()) {
        setUploadError("Enter a filename.");

        return;
      }

      setSaving(true);
      setUploadError("");

      try {
        const result = await updateReceiptMetadata({
          receiptId: editingReceipt.id.toString(),
          fileName: fileName.trim(),
          transactionId: /^[0-9a-f-]{36}$/i.test(transaction)
            ? transaction
            : null,
        });

        if (!result.success) {
          setUploadError(result.error.message);

          return;
        }

        setItems((current) =>
          current.map((receipt) =>
            receipt.id === editingReceipt.id
              ? {
                  ...receipt,
                  file: fileName.trim(),
                  transactionId: /^[0-9a-f-]{36}$/i.test(transaction)
                    ? transaction
                    : null,
                  transaction:
                    availableTransactions.find(
                      (option) => option.value === transaction,
                    )?.label ?? "Unassigned",
                  status: transaction ? receipt.status : "Unassigned",
                }
              : receipt,
          ),
        );
        invalidateFinanceQuery(
          "receipts",
          "transactions",
          "dashboard-snapshot",
          "report-snapshot",
          "report-kpis",
        );
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

    if (/^[0-9a-f-]{36}$/i.test(transaction))
      formData.append("transactionId", transaction);

    try {
      const result = await uploadReceipt(formData);

      if (result.success) {
        invalidateFinanceQuery(
          "receipts",
          "transactions",
          "dashboard-snapshot",
          "report-snapshot",
          "report-kpis",
        );
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
        idempotencyKey:
          archiveIdempotencyKey.current ??
          `archive-receipt-${archiveTarget.id}`,
      });

      if (!result.success) {
        setActionError(result.error.message);

        return;
      }

      setItems((current) =>
        current.filter((receipt) => receipt.id !== archiveTarget.id),
      );
      setArchiveTarget(null);
      setArchiveReason("");
      archiveIdempotencyKey.current = null;
      invalidateFinanceQuery(
        "receipts",
        "transactions",
        "dashboard-snapshot",
        "report-snapshot",
        "report-kpis",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={ledger.page} aria-busy={queryLoading}>
      <LoadingStatus loading={queryLoading} label="Loading receipts" />
      {refreshing && !queryLoading ? (
        <span className="sr-only" role="status">
          Updating receipts
        </span>
      ) : null}
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>All receipts</dt>
            <dd><LoadingText loading={queryLoading}>{items.length}</LoadingText></dd>
          </div>
          <div>
            <dt>Pending review</dt>
            <dd><LoadingText loading={queryLoading}>{items.filter((receipt) => receipt.status === "Pending review").length}</LoadingText></dd>
          </div>
          <div>
            <dt>Unassigned</dt>
            <dd><LoadingText loading={queryLoading}>{items.filter((receipt) => receipt.status === "Unassigned").length}</LoadingText></dd>
          </div>
        </dl>
        <button
          type="button"
          className={ledger.primaryButton}
          onClick={() => setModalOpen(true)}
          disabled={queryLoading}
        >
          Add receipt
        </button>
      </div>

      <div className={ledger.toolbar}>
        <label className={ledger.searchField}>
          <span className="sr-only">Search receipts</span>
          <input
            value={query}
            disabled={queryLoading}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by file or transaction"
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
          ariaLabel="Period"
          value={period}
          options={periodOptions}
          onChange={setPeriod}
        />
      </div>

      <div className={ledger.tableWrap}>
        {queryLoading ? (
          <LoadingCollection loading knownItemCount={items.length} emptyHeight="14rem" label="Loading receipts">
            <div />
          </LoadingCollection>
        ) : loadError ? null : !visible.length ? (
          <EmptyState
            title="No receipts found"
            description="Change the search or reset the filters."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                  setPeriod("All");
                  setPage(1);
                }}
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <table className={ledger.table}>
            <thead>
              <tr>
                <th scope="col">Receipt</th>
                <th scope="col" className={ledger.hideOnPhone}>Transaction</th>
                <th scope="col" className={ledger.hideOnPhone}>Date</th>
                <th scope="col" className={ledger.amount}>Amount</th>
                <th scope="col" className={ledger.hideOnPhone}>Status</th>
                <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((receipt) => (
                <tr key={receipt.id}>
                  <td>
                    <span className={ledger.title}>{receipt.file}</span>
                    <span className={ledger.rowMeta}>Uploaded by {receipt.uploadedByName}</span>
                    <span className={ledger.phoneMeta}>
                      {receipt.transaction}, {longDate(receipt.date)}
                      {receipt.status !== "Approved" ? <b>, {receipt.status.toLowerCase()}</b> : null}
                    </span>
                  </td>
                  <td className={ledger.hideOnPhone}>{receipt.transaction}</td>
                  <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{longDate(receipt.date)}</td>
                  <td className={ledger.amount}>{receipt.status === "Unassigned" ? "" : formatAmount(receipt.amount)}</td>
                  <td className={ledger.hideOnPhone}>
                    <span className={receipt.status === "Approved" ? ledger.muted : receipt.status === "Invalid" ? ledger.invalid : ledger.attention}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className={ledger.actions}>
                    <RowActionMenu
                      label={receipt.file}
                      canEdit={receipt.canEdit}
                      canDelete={receipt.canDelete}
                      onEdit={() => openEditReceipt(receipt)}
                      onDelete={() => openArchiveReceipt(receipt)}
                      onReceipt={() => {
                        void openReviewReceipt(receipt);
                      }}
                      receiptLabel={receipt.status === "Pending review" ? "Review receipt" : "View receipt"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className={ledger.pagination}>
        <span>
          <LoadingText loading={queryLoading}>
            {filtered.length
              ? `${rangeStart} to ${rangeEnd} of ${filtered.length}`
              : "0 of 0"}
          </LoadingText>
        </span>
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={queryLoading ? () => undefined : setPage}
          className={ledger.pageButtons}
        />
      </footer>

      {modalOpen ? (
        <Dialog
          label={editingReceipt ? "Edit receipt" : "Add receipt"}
          onClose={closeModal}
          overlayClassName={dlg.overlay}
          dialogClassName={`${dlg.modal}`}
        >
          <header className={dlg.header}>
            <div className={dlg.heading}>
              <h2>{editingReceipt ? "Edit receipt" : "Add receipt"}</h2>
              <p>
                {editingReceipt
                  ? "Change the filename or transaction. The review status does not change."
                  : "Upload a receipt and assign it to a transaction."}
              </p>
            </div>
            <button
              type="button"
              className={dlg.closeButton}
              aria-label="Close"
              onClick={closeModal}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={dlg.body}>
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
                    {filePreviewUrl ? (
                      <button
                        type="button"
                        className={styles.uploadPreviewButton}
                        onClick={() => setImagePreviewOpen(true)}
                        aria-label={`Open full preview of ${selectedFile.name}`}
                      >
                        <img
                          width="1200"
                          height="900"
                          src={filePreviewUrl}
                          alt={`Preview of ${selectedFile.name}`}
                          className={styles.uploadPreviewImage}
                        />
                      </button>
                    ) : (
                      <FileText
                        className={styles.uploadPreviewIcon}
                        aria-hidden="true"
                      />
                    )}
                    <div className={styles.uploadPreviewMeta}>
                      <strong>{selectedFile.name}</strong>
                      <span>
                        {selectedFile.type === "application/pdf"
                          ? "PDF document"
                          : "Image file"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeFileButton}
                      onClick={removeSelectedFile}
                      aria-label={`Remove ${selectedFile.name}`}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadArea}
                    onClick={() => fileInput.current?.click()}
                  >
                    <span className={styles.uploadText}>
                      <strong>Add a file</strong>
                      <span>
                        PDF, JPG or PNG up to 5 MB. On a phone you can use the camera.
                      </span>
                    </span>
                    <span className={styles.uploadButton}>Choose file</span>
                  </button>
                )}
              </>
            ) : null}
            <label className={dlg.field}>
              <span>Filename</span>
              <input
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="For example, receipt-may-2026.pdf"
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
          {uploadError ? (
            <p
              className={dlg.dialogError}
              role="alert"
            >
              {uploadError}
            </p>
          ) : null}
          <footer className={dlg.footer}>
            <button
              type="button"
              className={dlg.secondaryButton}
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dlg.primaryButton}
              onClick={submitReceipt}
              disabled={saving}
              aria-busy={saving}
            >
              {saving
                ? editingReceipt
                  ? "Saving"
                  : "Uploading"
                : editingReceipt
                  ? "Save changes"
                  : "Add receipt"}
            </button>
          </footer>
        </Dialog>
      ) : null}

      {modalOpen && imagePreviewOpen && filePreviewUrl && selectedFile ? (
        <div
          className={styles.imageLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Full preview of ${selectedFile.name}`}
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            type="button"
            className={styles.imageLightboxClose}
            onClick={() => setImagePreviewOpen(false)}
            aria-label="Close image preview"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
          <img
            width="1600"
            height="1200"
            src={filePreviewUrl}
            alt={`Full preview of ${selectedFile.name}`}
            className={styles.imageLightboxImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      {archiveTarget ? (
        <Dialog
          label="Archive receipt"
          onClose={() => {
            if (!saving) setArchiveTarget(null);
          }}
          overlayClassName={dlg.overlay}
          dialogClassName={`${dlg.modal}`}
        >
          <header className={dlg.header}>
            <div className={dlg.heading}>
              <h2>Archive receipt?</h2>
              <p>
                The file is kept for traceability and removed from the active
                list.
              </p>
            </div>
            <button
              type="button"
              className={dlg.closeButton}
              onClick={() => setArchiveTarget(null)}
              disabled={saving}
              aria-label="Close"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={dlg.body}>
            <label className={dlg.field}>
              <span>Reason</span>
              <input
                autoFocus
                value={archiveReason}
                onChange={(event) => setArchiveReason(event.target.value)}
                placeholder="Why is this receipt archived?"
              />
            </label>
            {actionError ? (
              <p
                className={dlg.dialogError}
                role="alert"
              >
                {actionError}
              </p>
            ) : null}
          </div>
          <footer className={dlg.footer}>
            <button
              type="button"
              className={dlg.secondaryButton}
              onClick={() => setArchiveTarget(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dlg.destructiveButton}
              onClick={confirmArchiveReceipt}
              disabled={saving || !archiveReason.trim()}
              aria-busy={saving}
            >
              {saving ? "Archiving" : "Archive receipt"}
            </button>
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
          onDecision={(decision) => {
            void confirmReviewReceipt(decision);
          }}
        />
      ) : null}
    </section>
  );
}
