"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
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
import { FieldDropdown, type FieldDropdownOption } from "@/components/ui/field-dropdown";
import { Pagination } from "@/components/ui/pagination";

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
  { id: 1, file: "Rechnung_Abizeitung.pdf", type: "PDF", size: "245 KB", transaction: "Abizeitung Druckkosten", kind: "Ausgaben", date: "15.05.2026", amount: -1250, status: "Geprüft" },
  { id: 2, file: "Bon_Abiball.jpg", type: "JPG", size: "1,3 MB", transaction: "Abiball Deko", kind: "Ausgaben", date: "12.05.2026", amount: -86.5, status: "Geprüft" },
  { id: 3, file: "Rechnung_Busfahrt.pdf", type: "PDF", size: "312 KB", transaction: "Abifahrt Bus", kind: "Ausgaben", date: "10.05.2026", amount: -2400, status: "Geprüft" },
  { id: 4, file: "Rechnung_T-Shirts.pdf", type: "PDF", size: "198 KB", transaction: "T-Shirts Abijahrgang", kind: "Ausgaben", date: "08.05.2026", amount: -950, status: "Zu prüfen" },
  { id: 5, file: "Bon_Supermarkt.jpg", type: "JPG", size: "980 KB", transaction: "Abiball Verpflegung", kind: "Ausgaben", date: "07.05.2026", amount: -168.75, status: "Geprüft" },
  { id: 6, file: "Rechnung_DJ.pdf", type: "PDF", size: "276 KB", transaction: "Abiball DJ", kind: "Ausgaben", date: "05.05.2026", amount: -600, status: "Zu prüfen" },
  { id: 7, file: "Bon_Bäckerei.jpg", type: "JPG", size: "512 KB", transaction: "—", kind: "Nicht zugeordnet", date: "03.05.2026", amount: -54.2, status: "Ohne Zuordnung" },
  { id: 8, file: "Rechnung_Lichttechnik.pdf", type: "PDF", size: "341 KB", transaction: "Abiball Lichttechnik", kind: "Ausgaben", date: "28.04.2026", amount: -350, status: "Geprüft" },
  { id: 9, file: "Quittung_Deko.pdf", type: "PDF", size: "120 KB", transaction: "Dekoration Klassenraum", kind: "Ausgaben", date: "25.04.2026", amount: -96.4, status: "Geprüft" },
  { id: 10, file: "Bon_Getränke.jpg", type: "JPG", size: "760 KB", transaction: "Kuchenverkauf", kind: "Einnahmen", date: "22.04.2026", amount: 185.5, status: "Geprüft" },
  { id: 11, file: "Rechnung_Druck.pdf", type: "PDF", size: "288 KB", transaction: "Druck Nachzahlung", kind: "Ausgaben", date: "20.04.2026", amount: -75, status: "Geprüft" },
  { id: 12, file: "Bon_Material.jpg", type: "JPG", size: "640 KB", transaction: "Material Einkauf", kind: "Ausgaben", date: "18.04.2026", amount: -180, status: "Zu prüfen" },
  { id: 13, file: "Quittung_Spende.pdf", type: "PDF", size: "154 KB", transaction: "Spende Eltern", kind: "Einnahmen", date: "15.04.2026", amount: 250, status: "Geprüft" },
  { id: 14, file: "Rechnung_Bühne.pdf", type: "PDF", size: "402 KB", transaction: "Bühnenaufbau", kind: "Ausgaben", date: "12.04.2026", amount: -420, status: "Geprüft" },
  { id: 15, file: "Bon_Druckerei.jpg", type: "JPG", size: "890 KB", transaction: "Plakate", kind: "Ausgaben", date: "10.04.2026", amount: -120, status: "Geprüft" },
  { id: 16, file: "Rechnung_Raum.pdf", type: "PDF", size: "219 KB", transaction: "Raummiete", kind: "Ausgaben", date: "08.04.2026", amount: -300, status: "Zu prüfen" },
  { id: 17, file: "Bon_Blumen.jpg", type: "JPG", size: "438 KB", transaction: "Dekoration Abiball", kind: "Ausgaben", date: "06.04.2026", amount: -72.5, status: "Geprüft" },
];

const statusOptions = ["Alle", "Geprüft", "Zu prüfen", "Ohne Zuordnung"] as const;
const periodOptions = ["Alle", "Dieser Monat", "Letzter Monat", "Dieses Jahr"] as const;

function Dropdown({ value, options, onChange, ariaLabel }: { value: string; options: readonly string[]; onChange: (value: string) => void; ariaLabel: string }) {
  const dropdownOptions = options.map((option) => ({ value: option, label: option === "Alle" ? `${ariaLabel}: Alle` : option }));
  return <FieldDropdown ariaLabel={ariaLabel} value={value} options={dropdownOptions as readonly FieldDropdownOption[]} onChange={onChange} className={styles.dropdown} />;
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
  const [transaction, setTransaction] = useState("Transaktion auswählen");
  const [isWideScreen, setIsWideScreen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 2200px)");
    const update = () => setIsWideScreen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const filtered = useMemo(() => receipts.filter((receipt) => {
    const needle = query.trim().toLowerCase();
    const month = receipt.date.slice(3, 5);
    return (!needle || `${receipt.file} ${receipt.transaction}`.toLowerCase().includes(needle))
      && (status === "Alle" || receipt.status === status)
      && (period === "Alle" || period === "Dieses Jahr" || (period === "Dieser Monat" ? month === "05" : month === "04"));
  }), [period, query, status]);
  const pageSize = isWideScreen ? 10 : 9;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function closeModal() {
    setModalOpen(false);
    setFileName("");
    setTransaction("Transaktion auswählen");
  }

  return <section className={styles.page}>
    <div className={styles.summaryGrid}>
      <article className={styles.summaryCard}><span className={styles.summaryIcon}><FileText /></span><div><span>Alle Belege</span><strong>24</strong></div></article>
      <article className={styles.summaryCard}><span className={`${styles.summaryIcon} ${styles.warningIcon}`}><Clock3 /></span><div><span>Zu prüfen</span><strong>3</strong></div></article>
      <article className={styles.summaryCard}><span className={styles.summaryIcon}><Link2 /></span><div><span>Ohne Zuordnung</span><strong>1</strong></div></article>
    </div>

    <article className={styles.listCard}>
      <header className={styles.listHeader}><h2>Belegübersicht</h2><button type="button" className={styles.primaryButton} onClick={() => setModalOpen(true)}><Upload />Beleg hinzufügen</button></header>
      <div className={styles.filters}>
        <label className={styles.searchField}><Search /><span className="sr-only">Belege suchen</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Suche nach Dateiname oder Transaktion ..." /></label>
        <Dropdown ariaLabel="Status" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} />
        <Dropdown ariaLabel="Zeitraum" value={period} options={periodOptions} onChange={setPeriod} />
      </div>
      <div className={`${styles.tableWrap} ui-data-table`}>
        <div className={styles.tableHeader}><span>Beleg</span><span>Zugeordnete Transaktion</span><span>Datum</span><span>Betrag</span><span>Status</span><span /></div>
        <div className={styles.rows}>{visible.map((receipt) => <div className={styles.row} key={receipt.id}>
          <span className={styles.fileCell}><span className={styles.fileIcon}><FileText /></span><span><strong>{receipt.file}</strong><small>{receipt.type} · {receipt.size}</small></span></span>
          <span className={styles.transactionCell}><strong>{receipt.transaction}</strong><small>{receipt.kind}</small></span>
          <span className={`ui-tabular ${styles.muted}`}>{receipt.date}</span><span className={`ui-tabular ${receipt.amount < 0 ? styles.negative : styles.positive}`}>{formatAmount(receipt.amount)}</span>
        <span className={`ui-badge ${styles.statusTag} ${receipt.status === "Geprüft" ? styles.checked : receipt.status === "Zu prüfen" ? styles.review : styles.unassigned}`}>{receipt.status === "Geprüft" ? <Check /> : receipt.status === "Zu prüfen" ? <Clock3 /> : <Link2 />}{receipt.status}</span>
          <button type="button" className={styles.moreButton} aria-label={`${receipt.file} Optionen`}><MoreVertical /></button>
        </div>)}</div>
      </div>
      <footer className={styles.pagination}><span>{filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} von ${filtered.length}` : "0 von 0"}</span><Pagination page={page} pageCount={pageCount} onPageChange={setPage} className={styles.pageButtons} /></footer>
    </article>

    {modalOpen ? <Dialog label="Beleg hinzufügen" onClose={closeModal} overlayClassName={styles.overlay} dialogClassName={styles.modal}>
      <header className={styles.modalHeader}><div><h2>Beleg hinzufügen</h2><p>Lade einen neuen Beleg hoch und ordne ihn direkt zu.</p></div><button type="button" className={styles.closeButton} aria-label="Dialog schließen" onClick={closeModal}><X /></button></header>
      <div className={styles.modalBody}><input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleFile} /><button type="button" className={styles.uploadArea} onClick={() => fileInput.current?.click()}><Upload /><strong>{fileName || "Beleg hier ablegen"}</strong><span>{fileName ? "Datei ausgewählt" : "PDF, JPG oder PNG bis 10 MB"}</span><span className={styles.uploadButton}>Datei auswählen</span></button>
        <label className={styles.formField}><span>Dateiname</span><input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="z. B. Rechnung_Mai_2026.pdf" /></label>
      <Dropdown ariaLabel="Transaktion" value={transaction} options={["Transaktion auswählen", "Abizeitung Druckkosten", "Abiball Deko", "Abifahrt Bus", "T-Shirts Abijahrgang"]} onChange={setTransaction} />
      </div>
      <footer className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={closeModal}>Abbrechen</button><button type="button" className={styles.primaryButton} onClick={closeModal}>Beleg hinzufügen</button></footer>
    </Dialog> : null}
  </section>;
}
