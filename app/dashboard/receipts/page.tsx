"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";

type ReceiptStatus = "Geprüft" | "Zu prüfen" | "Ohne Zuordnung";
type Receipt = {
  id: number;
  file: string;
  type: string;
  size: string;
  transaction: string;
  kind: string;
  date: string;
  amount: number;
  status: ReceiptStatus;
};

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

function TransactionCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = transactionOptions.find((option) => option.value === value);
  const filteredOptions = transactionOptions.filter((option) =>
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
              placeholder="Name, Datum oder Betrag suchen ..."
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

export default function ReceiptsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [period, setPeriod] = useState("Alle");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [transaction, setTransaction] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      receipts.filter((receipt) => {
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
    [period, query, status],
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

  function closeModal() {
    setModalOpen(false);
    setFileName("");
    setTransaction("");
  }

  return (
    <section className={styles.page}>
      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileText />
          </span>
          <div>
            <span>Alle Belege</span>
            <strong>24</strong>
          </div>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.warningIcon}`}>
            <Clock3 />
          </span>
          <div>
            <span>Zu prüfen</span>
            <strong>3</strong>
          </div>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Link2 />
          </span>
          <div>
            <span>Ohne Zuordnung</span>
            <strong>1</strong>
          </div>
        </article>
      </div>

      <article className={styles.listCard}>
        <header className={styles.listHeader}>
          <h2>Belegübersicht</h2>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setModalOpen(true)}
          >
            <Upload />
            Beleg hinzufügen
          </button>
        </header>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search />
            <span className="sr-only">Belege suchen</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Suche nach Dateiname oder Transaktion ..."
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
        <div className={`${styles.tableWrap} ui-data-table`}>
          <div className={styles.tableHeader}>
            <span>Beleg</span>
            <span>Zugeordnete Transaktion</span>
            <span>Datum</span>
            <span>Betrag</span>
            <span>Status</span>
            <span />
          </div>
          <div className={styles.rows}>
            {visible.map((receipt) => (
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
        <footer className={styles.pagination}>
          <span>
            {filtered.length
              ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} von ${filtered.length}`
              : "0 von 0"}
          </span>
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            className={styles.pageButtons}
          />
        </footer>
      </article>

      {modalOpen ? (
        <Dialog
          label="Beleg hinzufügen"
          onClose={closeModal}
          overlayClassName={styles.overlay}
          dialogClassName={styles.modal}
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
              accept=".pdf,.jpg,.jpeg,.png"
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
                {fileName ? "Datei ausgewählt" : "PDF, JPG oder PNG bis 10 MB"}
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
            <TransactionCombobox
              value={transaction}
              onChange={setTransaction}
            />
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
              onClick={closeModal}
            >
              Beleg hinzufügen
            </button>
          </footer>
        </Dialog>
      ) : null}
    </section>
  );
}
