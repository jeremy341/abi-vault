"use client";

import { useRef, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { X } from "lucide-react";
import styles from "./receipts.module.css";
import { Dialog } from "@/components/ui/dialog";
import { FieldDropdown } from "@/components/ui/field-dropdown";
import {
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import ledger from "../ledger.module.css";
import dlg from "@/components/dashboard/dialog.module.css";
import { LoadError } from "@/components/ui/load-error";
import { listReceiptsForCurrentOrganization } from "@/features/finance/actions/queries";
import { archiveReceipt } from "@/features/receipts/actions/receipts";
import { financeScope, invalidateFinanceQuery } from "@/lib/finance/client-cache";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { pageWindow } from "@/hooks/use-pagination";
import { financeDateKey, previousFinanceMonthKey } from "@/lib/finance/date-keys";
import {
  periodOptions,
  statusOptions,
  toReceipt,
  type Receipt,
} from "@/features/receipts/view-model";
import { useReceiptReview } from "@/features/receipts/use-receipt-review";
import { useReceiptEditor } from "@/features/receipts/use-receipt-editor";
import { ReceiptEditorDialog } from "./ReceiptEditorDialog";
import { ReceiptReviewDialog } from "@/components/receipts/ReceiptReviewDialog";
import { ReceiptsTable } from "./ReceiptsTable";

type ReceiptQueryData = Extract<Awaited<ReturnType<typeof listReceiptsForCurrentOrganization>>, { ok: true }>;

const emptyReceipts: Receipt[] = [];

function receiptsFromQuery(data: ReceiptQueryData) {
  return data.items.map(toReceipt);
}

function matchesSearch(receipt: Receipt, searchTerm: string) {
  if (!searchTerm) return true;

  const text = `${receipt.file} ${receipt.transaction}`.toLowerCase();

  return text.includes(searchTerm);
}

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
      options={dropdownOptions}
      onChange={onChange}
      className={styles.dropdown}
    />
  );
}

export default function ReceiptsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);

  const { data, loading: queryLoading, refreshing, failed } = useFinanceQuery(
    "receipts",
    listReceiptsForCurrentOrganization,
    cacheScope,
  );

  const [items, setItems] = useQueryBackedState(
    data?.ok ? data : null,
    receiptsFromQuery,
    emptyReceipts,
  );

  const receiptEditor = useReceiptEditor({
    cacheScope,
    setReceipts: setItems,
  });

  const receiptReview = useReceiptReview({
    onStatusChange: (receiptId, status) => {
      setItems((current) =>
        current.map((receipt) =>
          receipt.id.toString() === receiptId ? { ...receipt, status } : receipt,
        ),
      );
    },
  });

  const loadError = failed ? "Receipts could not be loaded." : "";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState("All");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<Receipt | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [archiveSaving, setArchiveSaving] = useState(false);
  const archiveIdempotencyKey = useRef<string | null>(null);

  const currentDateKey = financeDateKey(new Date());
  const currentMonthKey = currentDateKey.slice(0, 7);
  const previousMonthKey = previousFinanceMonthKey(currentMonthKey);
  const currentYear = currentDateKey.slice(0, 4);
  const searchTerm = query.trim().toLowerCase();

  function matchesPeriod(receipt: Receipt) {
    const month = receipt.dateKey.slice(0, 7);
    const year = receipt.dateKey.slice(0, 4);

    if (period === "All") return true;

    if (period === "This year") return year === currentYear;

    if (period === "This month") return month === currentMonthKey;

    if (period === "Last month") return month === previousMonthKey;

    return false;
  }

  const filtered = items.filter((receipt) => {
    if (!matchesSearch(receipt, searchTerm)) return false;

    if (status !== "All" && receipt.status !== status) return false;

    return matchesPeriod(receipt);
  });

  const pendingCount = items.filter((receipt) => receipt.status === "Pending review").length;
  const unassignedCount = items.filter((receipt) => receipt.status === "Unassigned").length;

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

  function openArchiveReceipt(receipt: Receipt) {
    setArchiveTarget(receipt);

    setArchiveReason("");

    setActionError("");

    archiveIdempotencyKey.current = `archive-receipt-${receipt.id}-${crypto.randomUUID()}`;
  }

  async function confirmArchiveReceipt() {
    if (!archiveTarget || archiveSaving || !archiveReason.trim()) return;

    setArchiveSaving(true);

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
    } catch {
      setActionError("The receipt could not be archived.");
    } finally {
      setArchiveSaving(false);
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
            <dd><LoadingText loading={queryLoading}>{pendingCount}</LoadingText></dd>
          </div>
          <div>
            <dt>Unassigned</dt>
            <dd><LoadingText loading={queryLoading}>{unassignedCount}</LoadingText></dd>
          </div>
        </dl>
        <button
          type="button"
          className={ledger.primaryButton}
          onClick={receiptEditor.openAdd}
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

      <ReceiptsTable
        loading={queryLoading}
        loadError={loadError}
        itemCount={items.length}
        visible={visible}
        resultCount={filtered.length}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        onResetFilters={() => {
          setQuery("");
          setStatus("All");
          setPeriod("All");
          setPage(1);
        }}
        onEdit={receiptEditor.openEdit}
        onDelete={openArchiveReceipt}
        onReview={(receipt) => {
          void receiptReview.open({ id: receipt.id.toString(), receipt });
        }}
      />

      <ReceiptEditorDialog
        open={receiptEditor.open}
        editingReceipt={receiptEditor.editingReceipt}
        fileInputRef={receiptEditor.fileInputRef}
        selectedFile={receiptEditor.selectedFile}
        filePreviewUrl={receiptEditor.filePreviewUrl}
        imagePreviewOpen={receiptEditor.imagePreviewOpen}
        fileName={receiptEditor.fileName}
        transaction={receiptEditor.transaction}
        transactionsLoading={receiptEditor.transactionsLoading}
        availableTransactions={receiptEditor.availableTransactions}
        uploadError={receiptEditor.error}
        saving={receiptEditor.saving}
        onFileChange={receiptEditor.handleFileChange}
        onFileNameChange={receiptEditor.setFileName}
        onTransactionChange={receiptEditor.setTransaction}
        onPreviewOpen={receiptEditor.openImagePreview}
        onPreviewClose={receiptEditor.closeImagePreview}
        onRemoveFile={receiptEditor.removeSelectedFile}
        onClose={receiptEditor.close}
        onSubmit={receiptEditor.save}
      />
      {archiveTarget ? (
        <Dialog
          label="Archive receipt"
          onClose={() => {
            if (!archiveSaving) setArchiveTarget(null);
          }}
          overlayClassName={dlg.overlay}
          dialogClassName={dlg.modal}
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
              disabled={archiveSaving}
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
              disabled={archiveSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dlg.destructiveButton}
              onClick={confirmArchiveReceipt}
              disabled={archiveSaving || !archiveReason.trim()}
              aria-busy={archiveSaving}
            >
              {archiveSaving ? "Archiving" : "Archive receipt"}
            </button>
          </footer>
        </Dialog>
      ) : null}

      {receiptReview.target ? (
        <ReceiptReviewDialog
          receipt={receiptReview.target.receipt}
          previewUrl={receiptReview.previewUrl}
          downloadUrl={receiptReview.downloadUrl}
          previewAsImage={receiptReview.previewAsImage}
          previewLoading={receiptReview.previewLoading}
          previewError={receiptReview.previewError}
          saving={receiptReview.saving}
          error={receiptReview.error}
          onClose={receiptReview.close}
          onDecision={(decision) => {
            void receiptReview.decide(decision);
          }}
        />
      ) : null}
    </section>
  );
}
