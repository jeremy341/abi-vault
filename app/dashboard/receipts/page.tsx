"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Clock3,
  FileText,
  Link2,
  MoreVertical,
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
  listReceiptsForCurrentOrganization,
  listTransactionsForCurrentOrganization,
} from "@/features/finance/actions/queries";
import { uploadReceipt } from "@/features/receipts/actions/receipts";
import { cachedFinanceQuery } from "@/lib/finance/client-cache";

type ReceiptStatus = "Geprüft" | "Zu prüfen" | "Ohne Zuordnung";
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
};

function formatReceiptDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const receipts: Receipt[] = [
  {
    id: 1,
    file: "Rechnung_Abizeitung.pdf",
    type: "PDF",
    size: "245 KB",
    transaction: "Abizeitung Druckkosten",
    kind: "Ausgaben",
    date: "15.05.2026",
    amount: -1250,
    status: "Geprüft",
  },
  {
    id: 2,
    file: "Bon_Abiball.jpg",
    type: "JPG",
    size: "1,3 MB",
    transaction: "Abiball Deko",
    kind: "Ausgaben",
    date: "12.05.2026",
    amount: -86.5,
    status: "Geprüft",
  },
  {
    id: 3,
    file: "Rechnung_Busfahrt.pdf",
    type: "PDF",
    size: "312 KB",
    transaction: "Abifahrt Bus",
    kind: "Ausgaben",
    date: "10.05.2026",
    amount: -2400,
    status: "Geprüft",
  },
  {
    id: 4,
    file: "Rechnung_T-Shirts.pdf",
    type: "PDF",
    size: "198 KB",
    transaction: "T-Shirts Abijahrgang",
    kind: "Ausgaben",
    date: "08.05.2026",
    amount: -950,
    status: "Zu prüfen",
  },
  {
    id: 5,
    file: "Bon_Supermarkt.jpg",
    type: "JPG",
    size: "980 KB",
    transaction: "Abiball Verpflegung",
    kind: "Ausgaben",
    date: "07.05.2026",
    amount: -168.75,
    status: "Geprüft",
  },
  {
    id: 6,
    file: "Rechnung_DJ.pdf",
    type: "PDF",
    size: "276 KB",
    transaction: "Abiball DJ",
    kind: "Ausgaben",
    date: "05.05.2026",
    amount: -600,
    status: "Zu prüfen",
  },
  {
    id: 7,
    file: "Bon_Bäckerei.jpg",
    type: "JPG",
    size: "512 KB",
    transaction: "—",
    kind: "Nicht zugeordnet",
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
    kind: "Ausgaben",
    date: "28.04.2026",
    amount: -350,
    status: "Geprüft",
  },
  {
    id: 9,
    file: "Quittung_Deko.pdf",
    type: "PDF",
    size: "120 KB",
    transaction: "Dekoration Klassenraum",
    kind: "Ausgaben",
    date: "25.04.2026",
    amount: -96.4,
    status: "Geprüft",
  },
  {
    id: 10,
    file: "Bon_Getränke.jpg",
    type: "JPG",
    size: "760 KB",
    transaction: "Kuchenverkauf",
    kind: "Einnahmen",
    date: "22.04.2026",
    amount: 185.5,
    status: "Geprüft",
  },
  {
    id: 11,
    file: "Rechnung_Druck.pdf",
    type: "PDF",
    size: "288 KB",
    transaction: "Druck Nachzahlung",
    kind: "Ausgaben",
    date: "20.04.2026",
    amount: -75,
    status: "Geprüft",
  },
  {
    id: 12,
    file: "Bon_Material.jpg",
    type: "JPG",
    size: "640 KB",
    transaction: "Material Einkauf",
    kind: "Ausgaben",
    date: "18.04.2026",
    amount: -180,
    status: "Zu prüfen",
  },
  {
    id: 13,
    file: "Quittung_Spende.pdf",
    type: "PDF",
    size: "154 KB",
    transaction: "Spende Eltern",
    kind: "Einnahmen",
    date: "15.04.2026",
    amount: 250,
    status: "Geprüft",
  },
  {
    id: 14,
    file: "Rechnung_Bühne.pdf",
    type: "PDF",
    size: "402 KB",
    transaction: "Bühnenaufbau",
    kind: "Ausgaben",
    date: "12.04.2026",
    amount: -420,
    status: "Geprüft",
  },
  {
    id: 15,
    file: "Bon_Druckerei.jpg",
    type: "JPG",
    size: "890 KB",
    transaction: "Plakate",
    kind: "Ausgaben",
    date: "10.04.2026",
    amount: -120,
    status: "Geprüft",
  },
  {
    id: 16,
    file: "Rechnung_Raum.pdf",
    type: "PDF",
    size: "219 KB",
    transaction: "Raummiete",
    kind: "Ausgaben",
    date: "08.04.2026",
    amount: -300,
    status: "Zu prüfen",
  },
  {
    id: 17,
    file: "Bon_Blumen.jpg",
    type: "JPG",
    size: "438 KB",
    transaction: "Dekoration Abiball",
    kind: "Ausgaben",
    date: "06.04.2026",
    amount: -72.5,
    status: "Geprüft",
  },
];

const statusOptions = [
  "Alle",
  "Geprüft",
  "Zu prüfen",
  "Ohne Zuordnung",
] as const;
const periodOptions = [
  "Alle",
  "Dieser Monat",
  "Letzter Monat",
  "Dieses Jahr",
] as const;
const transactionOptions = [
  { value: "", label: "Ohne Zuordnung", date: "", amount: "" },
  {
    value: "Abizeitung Druckkosten",
    label: "Abizeitung Druckkosten",
    date: "12.05.2024",
    amount: "-320,00 €",
  },
  {
    value: "Kuchenverkauf",
    label: "Kuchenverkauf",
    date: "11.05.2024",
    amount: "+185,50 €",
  },
  {
    value: "Dekoration Abiball",
    label: "Dekoration Abiball",
    date: "08.05.2024",
    amount: "-184,90 €",
  },
  {
    value: "Spende Eltern",
    label: "Spende Eltern",
    date: "07.05.2024",
    amount: "+250,00 €",
  },
  {
    value: "Abifahrt Bus",
    label: "Abifahrt Bus",
    date: "05.05.2024",
    amount: "-1.200,00 €",
  },
  {
    value: "T-Shirts Abijahrgang",
    label: "T-Shirts Abijahrgang",
    date: "03.05.2024",
    amount: "-950,00 €",
  },
] as const;

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
    label: option === "Alle" ? `${ariaLabel}: Alle` : option,
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
      <span>Transaktion zuordnen</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={styles.comboboxTrigger}
              aria-expanded={open}
              aria-label="Transaktion auswählen"
            />
          }
        >
          <span>{selected?.label || "Transaktion auswählen"}</span>
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
            <span className="sr-only">Transaktionen durchsuchen</span>
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, Datum oder Betrag suchen …"
            />
          </label>
          <div
            className={styles.comboboxList}
            role="listbox"
            aria-label="Verfügbare Transaktionen"
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
                      <small>Beleg später zuordnen</small>
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
                Keine passende Transaktion gefunden.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}

function formatAmount(amount: number) {
  return `${amount < 0 ? "-" : "+"}${Math.abs(amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;
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
}) {
  return (
    <div className={phoneStyles.root} aria-busy={loading}>
      <section className={phoneStyles.summary} aria-label="Belegstatus" data-ui-slot="summary">
        <div className={phoneStyles.summaryItem}>
          <span>Alle</span>
          <strong><LoadingText loading={loading}>{total}</LoadingText></strong>
        </div>
        <div className={phoneStyles.summaryItem}>
          <span>Zu prüfen</span>
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
          <span className="sr-only">Belege suchen</span>
          <input
            value={query}
            disabled={loading}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Dateiname oder Transaktion …"
          />
        </label>
        <button
          type="button"
          className={phoneStyles.uploadButton}
          onClick={onAdd}
          disabled={loading}
          aria-label="Beleg hinzufügen"
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
        <h2>Belege</h2>
        <span><LoadingText loading={loading}>{total} Dateien</LoadingText></span>
      </header>

      <div className={phoneStyles.rows} data-ui-slot="list-body">
        <LoadingCollection loading={loading} knownItemCount={receipts.length} emptyHeight="10rem" label="Belege werden geladen…">
          {receipts.length ? receipts.map((receipt) => (
          <article className={phoneStyles.row} key={receipt.id}>
            <FileText aria-hidden="true" />
            <span className={phoneStyles.rowMain}>
              <strong>{receipt.file}</strong>
              <span>
                {receipt.transaction === "—"
                  ? "Nicht zugeordnet"
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
                  receipt.status === "Geprüft" ? "" : phoneStyles.review
                }
              >
                {receipt.status}
              </small>
            </span>
          </article>
          )) : <div className={phoneStyles.empty}>Keine Belege gefunden.</div>}
        </LoadingCollection>
      </div>

      <footer className={phoneStyles.footer} data-ui-slot="footer">
        <span>
          <LoadingText loading={loading}>{rangeStart}-{rangeEnd} von {total}</LoadingText>
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
  const [items, setItems] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [period, setPeriod] = useState("Alle");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [transaction, setTransaction] = useState("");
  const [availableTransactions, setAvailableTransactions] =
    useState<readonly TransactionOption[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    cachedFinanceQuery("receipts", listReceiptsForCurrentOrganization)
      .then((result) => {
        if (!active || !result.ok) return;
        setItems(result.items.map((item) => ({
          id: item.id,
          file: item.file,
          type: item.type,
          size: `${Math.round(item.sizeBytes / 1024)} KB`,
          transaction: item.transaction,
          kind: "",
          date: item.date ? formatReceiptDate(item.date) : formatReceiptDate(new Date().toISOString()),
          amount: Number(item.amountMinor) / 100,
          status: item.status === "approved" ? "Geprüft" : item.status === "rejected" ? "Ohne Zuordnung" : "Zu prüfen",
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
    cachedFinanceQuery("transactions", listTransactionsForCurrentOrganization)
      .then((result) => {
        if (!active || !result.ok) return;
        setAvailableTransactions([
          { value: "", label: "Ohne Zuordnung", date: "", amount: "" },
          ...result.items.map((item) => ({
            value: item.id,
            label: item.title,
            date: item.date ? formatReceiptDate(item.date) : "",
            amount: `${Number(item.amountMinor) >= 0 ? "+" : "-"}${Math.abs(Number(item.amountMinor) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`,
          })),
        ]);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
          (status === "Alle" || receipt.status === status) &&
          (period === "Alle" ||
            period === "Dieses Jahr" ||
            (period === "Dieser Monat" ? month === "05" : month === "04"))
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
    if (file) setFileName(file.name);
  }

  async function submitReceipt() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (/^[0-9a-f-]{36}$/i.test(transaction)) formData.append("transactionId", transaction);
    const result = await uploadReceipt(formData);
    if (result.success) closeModal();
  }

  function closeModal() {
    setModalOpen(false);
    setFileName("");
    setTransaction("");
  }

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
      <LoadingStatus loading={loading} label="Belege werden geladen…" />
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
          pendingCount={items.filter((item) => item.status === "Zu prüfen").length}
          unassignedCount={items.filter((item) => item.status === "Ohne Zuordnung").length}
          rangeStart={filtered.length ? (currentPage - 1) * pageSize + 1 : 0}
          rangeEnd={Math.min(currentPage * pageSize, filtered.length)}
          onPageChange={setPage}
          onAdd={() => setModalOpen(true)}
        />
      ) : (
        <>
          <div className={styles.summaryGrid} data-ui-slot="summary">
            <article className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <FileText />
              </span>
              <div>
                <span>Alle Belege</span>
                <strong><LoadingText loading={loading}>{items.length}</LoadingText></strong>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.warningIcon}`}>
                <Clock3 />
              </span>
              <div>
                <span>Zu prüfen</span>
                <strong><LoadingText loading={loading}>{items.filter((item) => item.status === "Zu prüfen").length}</LoadingText></strong>
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
              <h2>Belegübersicht</h2>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setModalOpen(true)}
                disabled={loading}
                data-ui-slot="primary-action"
              >
                <Upload />
                Beleg hinzufügen
              </button>
            </header>
            <div className={styles.filters} data-ui-slot="toolbar">
              <label className={styles.searchField}>
                <Search />
                <span className="sr-only">Belege suchen</span>
                <input
                  value={query}
                  disabled={loading}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Suche nach Dateiname oder Transaktion …"
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
                <span>Beleg</span>
                <span>Zugeordnete Transaktion</span>
                <span>Datum</span>
                <span>Betrag</span>
                <span>Status</span>
                <span />
              </div>
              <div className={styles.rows}>
                {loading ? (
                  <LoadingCollection loading knownItemCount={items.length} emptyHeight="100%" label="Belege werden geladen…"><div /></LoadingCollection>
                ) : !visible.length ? (
                  <EmptyState
                    title="Keine Belege gefunden"
                    description="Ändere die Suche oder setze die Filter zurück."
                    action={<button type="button" onClick={() => { setQuery(""); setStatus("Alle"); setPeriod("Alle"); setPage(1); }}>Filter zurücksetzen</button>}
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
                      </span>
                    </span>
                    <span
                      data-label="Transaktion"
                      className={styles.transactionCell}
                    >
                      <strong>{receipt.transaction}</strong>
                    </span>
                    <span
                      data-label="Datum"
                      className={`ui-tabular ${styles.muted}`}
                    >
                      {receipt.date}
                    </span>
                    <span
                      data-label="Betrag"
                      className={`ui-tabular ${receipt.amount < 0 ? styles.negative : styles.positive}`}
                    >
                      {formatAmount(receipt.amount)}
                    </span>
                    <span
                      data-label="Status"
                      className={`ui-badge ${styles.statusTag} ${receipt.status === "Geprüft" ? styles.checked : receipt.status === "Zu prüfen" ? styles.review : styles.unassigned}`}
                    >
                      {receipt.status === "Geprüft" ? (
                        <Check />
                      ) : receipt.status === "Zu prüfen" ? (
                        <Clock3 />
                      ) : (
                        <Link2 />
                      )}
                      {receipt.status}
                    </span>
                    <button
                      type="button"
                      className={styles.moreButton}
                      aria-label={`${receipt.file} Optionen`}
                    >
                      <MoreVertical />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <footer className={styles.pagination} data-ui-slot="footer">
              <span>
                <LoadingText loading={loading}>{filtered.length
                  ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} von ${filtered.length}`
                  : "0 von 0"}</LoadingText>
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
          label="Beleg hinzufügen"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={`${styles.modal} ${mode === "phone" ? phoneStyles.phoneDialog : ""}`}
        >
          <header className={styles.modalHeader}>
            <div>
              <h2>Beleg hinzufügen</h2>
              <p>Lade einen neuen Beleg hoch und ordne ihn direkt zu.</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Dialog schließen"
              onClick={closeModal}
            >
              <X />
            </button>
          </header>
          <div className={styles.modalBody}>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,image/*"
              capture="environment"
              hidden
              onChange={handleFile}
            />
            <button
              type="button"
              className={styles.uploadArea}
              onClick={() => fileInput.current?.click()}
            >
              <Upload />
              <strong>{fileName || "Beleg hier ablegen"}</strong>
              <span>
                {fileName
                  ? "Datei ausgewählt"
                  : "PDF oder Bild bis 10 MB. Auf dem Handy ist auch die Kamera verfügbar."}
              </span>
              <span className={styles.uploadButton}>Datei auswählen</span>
            </button>
            <label className={styles.formField}>
              <span>Dateiname</span>
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
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeModal}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={submitReceipt}
            >
              Beleg hinzufügen
            </button>
          </footer>
        </Dialog>
      ) : null}
    </section>
  );
}
