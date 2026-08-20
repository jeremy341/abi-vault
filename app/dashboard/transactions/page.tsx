"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BusFront,
  CakeSlice,
  CalendarDays,
  Check,
  ChevronDown,
  HandCoins,
  Equal,
  FileText,
  Filter,
  Paperclip,
  Plus,
  Search,
  PartyPopper,
  TrendingUp,
  X,
} from "lucide-react";
import styles from "./transactions.module.css";
import { Dialog } from "@/components/ui/dialog";
import { FieldDropdown, type FieldDropdownOption } from "@/components/ui/field-dropdown";
import { Pagination } from "@/components/ui/pagination";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";

type Category = "Material" | "Sonstiges" | "Veranstaltung";
type FilterType = "Einnahmen" | "Ausgaben";
type ReceiptFilter = "Alle" | "Vorhanden" | "Fehlt";
type ReviewFilter = "Alle" | "Geprüft" | "Zu prüfen";
type AccountFilter = "Alle Konten" | "Bankkonto" | "Barkasse";
type Transaction = {
  id: number;
  title: string;
  category: Category;
  date: string;
  amount: number;
  receipt?: string;
  reviewStatus: "Geprüft" | "Zu prüfen";
  account: Exclude<AccountFilter, "Alle Konten">;
  tone: "violet" | "green" | "orange";
  icon: typeof FileText;
};

const initialTransactions: Transaction[] = [
  { id: 1, title: "Druck Abizeitung", category: "Material", date: "12.05.2024", amount: -320, receipt: "Rechnung_Abizeitung.pdf", reviewStatus: "Geprüft", account: "Bankkonto", tone: "violet", icon: FileText },
  { id: 2, title: "Kuchenverkauf", category: "Sonstiges", date: "11.05.2024", amount: 185.5, reviewStatus: "Geprüft", account: "Barkasse", tone: "green", icon: CakeSlice },
  { id: 3, title: "Dekoration Abiball", category: "Veranstaltung", date: "08.05.2024", amount: -184.9, receipt: "Bon_Abiball.jpg", reviewStatus: "Zu prüfen", account: "Bankkonto", tone: "orange", icon: PartyPopper },
  { id: 4, title: "Spende Eltern", category: "Sonstiges", date: "07.05.2024", amount: 250, reviewStatus: "Geprüft", account: "Barkasse", tone: "green", icon: HandCoins },
  { id: 5, title: "Busfahrt Abifahrt", category: "Veranstaltung", date: "05.05.2024", amount: -1200, receipt: "Rechnung_Busfahrt.pdf", reviewStatus: "Geprüft", account: "Bankkonto", tone: "violet", icon: BusFront },
  { id: 6, title: "Mitgliedsbeitrag", category: "Sonstiges", date: "03.05.2024", amount: 120, reviewStatus: "Geprüft", account: "Bankkonto", tone: "green", icon: HandCoins },
  { id: 7, title: "Druck Nachzahlung", category: "Material", date: "02.05.2024", amount: -75, receipt: "Rechnung_Nachdruck.pdf", reviewStatus: "Geprüft", account: "Bankkonto", tone: "violet", icon: FileText },
  { id: 8, title: "Dekoration Klassenraum", category: "Material", date: "30.04.2024", amount: -96.4, reviewStatus: "Zu prüfen", account: "Barkasse", tone: "orange", icon: PartyPopper },
  { id: 9, title: "Spende Förderverein", category: "Sonstiges", date: "28.04.2024", amount: 300, reviewStatus: "Geprüft", account: "Bankkonto", tone: "green", icon: HandCoins },
  { id: 10, title: "Busreservierung Abifahrt", category: "Veranstaltung", date: "26.04.2024", amount: -420, receipt: "Reservierung_Abifahrt.pdf", reviewStatus: "Geprüft", account: "Bankkonto", tone: "violet", icon: BusFront },
  { id: 11, title: "Kuchenzutaten Einkauf", category: "Material", date: "24.04.2024", amount: -64.8, reviewStatus: "Zu prüfen", account: "Barkasse", tone: "orange", icon: CakeSlice },
  { id: 12, title: "Tombola Preise", category: "Veranstaltung", date: "22.04.2024", amount: -142, reviewStatus: "Geprüft", account: "Barkasse", tone: "violet", icon: PartyPopper },
  { id: 13, title: "Abiball Ticketverkauf", category: "Sonstiges", date: "20.04.2024", amount: 540, reviewStatus: "Geprüft", account: "Barkasse", tone: "green", icon: HandCoins },
];

const toneClasses = { violet: styles.violet, green: styles.green, orange: styles.orange };
const parseDate = (value: string) => { const [day, month, year] = value.split(".").map(Number); return new Date(year, month - 1, day); };
const fromIso = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); };
const displayDate = (date: Date) => `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
const displayAmount = (amount: number) => `${amount >= 0 ? "+" : "-"}${Math.abs(amount).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function Overlay({ children, onClose, label, className }: { children: React.ReactNode; onClose: () => void; label: string; className?: string }) {
  return <Dialog label={label} onClose={onClose} overlayClassName={styles.overlay} dialogClassName={`${styles.modal} ${className ?? ""}`}>{children}</Dialog>;
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
  return <FieldDropdown ariaLabel={ariaLabel} label={label} value={value} options={options as readonly FieldDropdownOption[]} onChange={onChange} className={className} placement={placement} />;
}

export default function TransactionsPage() {
  const [items, setItems] = useState(initialTransactions);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Alle" | Category>("Alle");
  const [type, setType] = useState<"Alle" | "Einnahmen" | "Ausgaben">("Alle");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [draftCategory, setDraftCategory] = useState<"Alle" | Category>("Alle");
  const [draftType, setDraftType] = useState<"Alle" | "Einnahmen" | "Ausgaben">("Alle");
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<FilterType[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>("Alle");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("Alle");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("Alle Konten");
  const [draftCategories, setDraftCategories] = useState<Category[]>([]);
  const [draftTypes, setDraftTypes] = useState<FilterType[]>([]);
  const [draftMinAmount, setDraftMinAmount] = useState("");
  const [draftMaxAmount, setDraftMaxAmount] = useState("");
  const [draftReceiptFilter, setDraftReceiptFilter] = useState<ReceiptFilter>("Alle");
  const [draftReviewFilter, setDraftReviewFilter] = useState<ReviewFilter>("Alle");
  const [draftAccountFilter, setDraftAccountFilter] = useState<AccountFilter>("Alle Konten");
  const [filterOpen, setFilterOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize({ defaultSize: 10, landscapeSize: 6, wideSize: 10 });
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Sonstiges");
  const [newType, setNewType] = useState<"Einnahme" | "Ausgabe">("Einnahme");
  const [newAccount, setNewAccount] = useState<Exclude<AccountFilter, "Alle Konten">>("Barkasse");

  const results = useMemo(() => items.filter((item) => {
    const search = query.trim().toLowerCase();
    const date = parseDate(item.date);
    return (!search || `${item.title} ${item.category} ${item.date}`.toLowerCase().includes(search))
      && (category === "Alle" || item.category === category)
      && (type === "Alle" || (type === "Einnahmen" ? item.amount >= 0 : item.amount < 0))
      && (!selectedCategories.length || selectedCategories.includes(item.category))
      && (!selectedTypes.length || selectedTypes.includes(item.amount >= 0 ? "Einnahmen" : "Ausgaben"))
      && (!start || date >= fromIso(start))
      && (!end || date <= fromIso(end))
      && (!minAmount || Math.abs(item.amount) >= Number(minAmount.replace(",", ".")))
      && (!maxAmount || Math.abs(item.amount) <= Number(maxAmount.replace(",", ".")))
      && (receiptFilter === "Alle" || (receiptFilter === "Vorhanden" ? Boolean(item.receipt) : !item.receipt))
      && (reviewFilter === "Alle" || item.reviewStatus === reviewFilter)
      && (accountFilter === "Alle Konten" || item.account === accountFilter);
  }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()), [accountFilter, category, end, items, maxAmount, minAmount, query, receiptFilter, reviewFilter, selectedCategories, selectedTypes, start, type]);

  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = results.length ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(currentPage * pageSize, results.length);
  const totalIncome = items.filter((item) => item.amount >= 0).reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = items.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const netBalance = totalIncome - totalExpense;
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
    accountFilter !== "Alle Konten" ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  function resetFilters() {
    setQuery(""); setCategory("Alle"); setType("Alle"); setStart(""); setEnd("");
    setDraftCategory("Alle"); setDraftType("Alle"); setDraftStart(""); setDraftEnd("");
    setSelectedCategories([]); setSelectedTypes([]); setMinAmount(""); setMaxAmount(""); setReceiptFilter("Alle"); setReviewFilter("Alle"); setAccountFilter("Alle Konten");
    setDraftCategories([]); setDraftTypes([]); setDraftMinAmount(""); setDraftMaxAmount(""); setDraftReceiptFilter("Alle"); setDraftReviewFilter("Alle"); setDraftAccountFilter("Alle Konten"); setPage(1);
  }
  function openFilters() {
    setDraftCategory(category); setDraftType(type); setDraftStart(start); setDraftEnd(end); setDraftCategories(selectedCategories); setDraftTypes(selectedTypes); setDraftMinAmount(minAmount); setDraftMaxAmount(maxAmount); setDraftReceiptFilter(receiptFilter); setDraftReviewFilter(reviewFilter); setDraftAccountFilter(accountFilter); setAccountMenuOpen(false); setFilterOpen(true);
  }
  function applyFilters() {
    setCategory(draftCategory); setType(draftType); setStart(draftStart); setEnd(draftEnd); setSelectedCategories(draftCategories); setSelectedTypes(draftTypes); setMinAmount(draftMinAmount); setMaxAmount(draftMaxAmount); setReceiptFilter(draftReceiptFilter); setReviewFilter(draftReviewFilter); setAccountFilter(draftAccountFilter); setPage(1); setFilterOpen(false); setDateOpen(false);
  }
  function toggleDraftCategory(value: Category) { setDraftCategories((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function toggleDraftType(value: FilterType) { setDraftTypes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function addTransaction() {
    const amount = Number(newAmount.replace(",", "."));
    if (!newTitle.trim() || !Number.isFinite(amount)) return;
    setItems((current) => [{
      id: Date.now(), title: newTitle.trim(), category: newCategory, date: displayDate(new Date()),
      amount: newType === "Ausgabe" ? -Math.abs(amount) : Math.abs(amount), reviewStatus: "Zu prüfen", account: newAccount, tone: newType === "Einnahme" ? "green" : "violet",
      icon: newType === "Einnahme" ? HandCoins : FileText,
    }, ...current]);
    setNewTitle(""); setNewAmount(""); setNewAccount("Barkasse"); setAddOpen(false); setPage(1);
  }

  const dateLabel = start || end
    ? `${start ? displayDate(fromIso(start)) : "Offen"} – ${end ? displayDate(fromIso(end)) : "Heute"}`
    : "Zeitraum auswählen";

  return <section className={styles.page}>
    <div className={styles.kpiGrid}>
      <article className={styles.kpiCard}>
        <span className={`${styles.kpiIcon} ${styles.incomeIcon}`}><ArrowDown /></span>
        <div><span className={styles.kpiLabel}>Einnahmen</span><strong className={styles.incomeValue}>{displayAmount(totalIncome).replace("+", "")}</strong></div>
        <span className={`${styles.trend} ${styles.positive}`}><TrendingUp /> +18,6 %</span>
      </article>
      <article className={styles.kpiCard}>
        <span className={`${styles.kpiIcon} ${styles.expenseIcon}`}><ArrowUp /></span>
        <div><span className={styles.kpiLabel}>Ausgaben</span><strong className={styles.expenseValue}>{displayAmount(totalExpense).replace("+", "")}</strong></div>
        <span className={`${styles.trend} ${styles.negative}`}><TrendingUp /> +9,3 %</span>
      </article>
      <article className={styles.kpiCard}>
        <span className={`${styles.kpiIcon} ${styles.netIcon}`}><Equal /></span>
        <div><span className={styles.kpiLabel}>Netto</span><strong>{displayAmount(netBalance)}</strong></div>
        <span className={`${styles.trend} ${styles.positive}`}><TrendingUp /> +31,4 %</span>
      </article>
    </div>

    <article className={styles.listCard}>
      <header className={styles.listHeader}>
        <div className={styles.headingGroup}><h2>Alle Transaktionen</h2><span>{activeFilterCount} aktive Filter</span></div>
        <button type="button" className={styles.primaryButton} onClick={() => setAddOpen(true)}><Plus />Transaktion hinzufügen</button>
      </header>

      <div className={styles.filters}>
        <label className={styles.searchField}><Search /><span className="sr-only">Transaktionen durchsuchen</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Transaktionen durchsuchen..." /></label>
        <StyledDropdown ariaLabel="Kategorie auswählen" value={category} onChange={(value) => { setCategory(value as typeof category); setPage(1); }} className={styles.filterDropdown} options={[{ value: "Alle", label: "Alle Kategorien" }, { value: "Material", label: "Material" }, { value: "Sonstiges", label: "Sonstiges" }, { value: "Veranstaltung", label: "Veranstaltung" }]} />
        <StyledDropdown ariaLabel="Typ auswählen" value={type} onChange={(value) => { setType(value as typeof type); setPage(1); }} className={styles.filterDropdown} options={[{ value: "Alle", label: "Alle Typen" }, { value: "Einnahmen", label: "Einnahmen" }, { value: "Ausgaben", label: "Ausgaben" }]} />
        <button type="button" className={styles.controlButton} onClick={() => { setDraftStart(start); setDraftEnd(end); setDateOpen(true); }}><span>{dateLabel}</span><CalendarDays /></button>
        <button type="button" className={styles.filterButton} onClick={openFilters}><Filter />Filter</button>
      </div>

      <div className={`${styles.tableWrap} ui-data-table`}>
        <div className={styles.tableHeader}><span>Transaktion</span><span>Kategorie</span><span>Datum</span><span>Betrag</span><span>Beleg</span></div>
        <div className={styles.rows}>
          {visible.map((transaction) => { const Icon = transaction.icon; return <button type="button" className={styles.row} key={transaction.id} onClick={() => setSelected(transaction)}>
            <span className={styles.transactionName}><span className={`${styles.iconBubble} ${toneClasses[transaction.tone]}`}><Icon /></span><span>{transaction.title}</span></span>
            <span data-label="Kategorie"><span className={`ui-badge ${styles.categoryTag} ${toneClasses[transaction.tone]}`}>{transaction.category}</span></span>
            <span data-label="Datum" className={`ui-tabular ${styles.muted}`}>{transaction.date}</span>
            <span data-label="Betrag" className={`ui-tabular ${transaction.amount >= 0 ? styles.positive : styles.negative}`}>{displayAmount(transaction.amount)}</span>
            <span data-label="Beleg" className={styles.receipt}>{transaction.receipt ? <><Paperclip /><span>{transaction.receipt}</span></> : <span>—</span>}</span>
          </button>; })}
        </div>
      </div>

      {!visible.length ? <div className={styles.emptyState}><Search /><strong>Keine Transaktionen gefunden</strong><span>Ändere die Suche oder setze die Filter zurück.</span><button type="button" onClick={resetFilters}>Filter zurücksetzen</button></div> : null}

      <footer className={styles.pagination}>
        <span>{rangeStart}–{rangeEnd} von {results.length}</span>
        <Pagination page={currentPage} pageCount={pages} onPageChange={setPage} className={styles.pageButtons} />
      </footer>
    </article>

    {dateOpen ? <Overlay label="Zeitraum auswählen" onClose={() => setDateOpen(false)}><div className={styles.modalHeader}><div><h2>Zeitraum auswählen</h2><p>Lege den Zeitraum für die Transaktionsliste fest.</p></div><button type="button" className={styles.iconButton} onClick={() => setDateOpen(false)} aria-label="Dialog schließen"><X /></button></div><div className={styles.modalBody}><div className={styles.dateFields}><label className={styles.formField}><span>Von</span><input type="date" value={draftStart} onChange={(event) => setDraftStart(event.target.value)} /></label><label className={styles.formField}><span>Bis</span><input type="date" min={draftStart} value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} /></label></div></div><div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={() => { setDraftStart(""); setDraftEnd(""); }}>Zurücksetzen</button><div><button type="button" className={styles.secondaryButton} onClick={() => setDateOpen(false)}>Abbrechen</button><button type="button" className={styles.primaryButton} onClick={applyFilters}>Übernehmen</button></div></div></Overlay> : null}

    {filterOpen ? <Overlay className={styles.filterModal} label="Transaktionen filtern" onClose={() => setFilterOpen(false)}><div className={styles.modalHeader}><div><h2>Transaktionen filtern</h2><p>Wähle die Kriterien aus, nach denen du die Transaktionen anzeigen möchtest.</p></div><button type="button" className={styles.iconButton} onClick={() => setFilterOpen(false)} aria-label="Filter schließen"><X /></button></div><div className={`${styles.modalBody} ${styles.filterModalBody}`}>
      <div className={styles.filterColumns}><fieldset className={styles.filterGroup}><legend>Kategorie</legend>{(["Material", "Sonstiges", "Veranstaltung"] as Category[]).map((value) => <label className={styles.checkRow} key={value}><input type="checkbox" checked={draftCategories.includes(value)} onChange={() => toggleDraftCategory(value)} /><span>{value}</span></label>)}</fieldset><fieldset className={styles.filterGroup}><legend>Typ</legend>{(["Einnahmen", "Ausgaben"] as FilterType[]).map((value) => <label className={styles.checkRow} key={value}><input type="checkbox" checked={draftTypes.includes(value)} onChange={() => toggleDraftType(value)} /><span>{value}</span></label>)}</fieldset></div>
      <div className={styles.modalSection}><span className={styles.modalSectionLabel}>Betrag</span><div className={styles.amountFields}><label className={styles.inlineField}><span>Von</span><input aria-label="Betrag von" inputMode="decimal" value={draftMinAmount} onChange={(event) => setDraftMinAmount(event.target.value)} placeholder="0,00 €" /></label><label className={styles.inlineField}><span>Bis</span><input aria-label="Betrag bis" inputMode="decimal" value={draftMaxAmount} onChange={(event) => setDraftMaxAmount(event.target.value)} placeholder="1.000,00 €" /></label></div></div>
      <div className={styles.filterColumns}>
        <fieldset className={styles.filterGroup}>
          <legend>Belegstatus</legend>
          <div className={styles.segmented}>
            {(["Alle", "Vorhanden", "Fehlt"] as ReceiptFilter[]).map((value) => (
              <button type="button" key={value} className={draftReceiptFilter === value ? styles.segmentActive : ""} onClick={() => setDraftReceiptFilter(value)}>{value}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.filterGroup}>
          <legend>Prüfstatus</legend>
          <div className={styles.segmented}>
            {(["Alle", "Geprüft", "Zu prüfen"] as ReviewFilter[]).map((value) => (
              <button type="button" key={value} className={draftReviewFilter === value ? styles.segmentActive : ""} onClick={() => setDraftReviewFilter(value)}>{value}</button>
            ))}
          </div>
        </fieldset>
      </div>

      <StyledDropdown
        ariaLabel="Konto oder Kasse auswählen"
        label="Konto / Kasse"
        value={draftAccountFilter}
        onChange={(value) => setDraftAccountFilter(value as AccountFilter)}
        className={styles.formDropdown}
        placement="bottom"
        options={[
          { value: "Alle Konten", label: "Alle Konten" },
          { value: "Bankkonto", label: "Bankkonto" },
          { value: "Barkasse", label: "Barkasse" },
        ]}
      />
    </div>
    <div className={styles.modalFooter}>
      <button type="button" className={styles.secondaryButton} onClick={() => { resetFilters(); setFilterOpen(false); }}>Zurücksetzen</button>
      <div>
        <button type="button" className={styles.secondaryButton} onClick={() => setFilterOpen(false)}>Abbrechen</button>
        <button type="button" className={styles.primaryButton} onClick={applyFilters}>Filter anwenden</button>
      </div>
    </div>
  </Overlay> : null}

    {addOpen ? <Overlay label="Transaktion hinzufügen" onClose={() => setAddOpen(false)}><div className={styles.modalHeader}><div><h2>Transaktion hinzufügen</h2><p>Erfasse eine neue Einnahme oder Ausgabe.</p></div><button type="button" className={styles.iconButton} onClick={() => setAddOpen(false)} aria-label="Dialog schließen"><X /></button></div><div className={styles.modalBody}>
      <label className={styles.formField}><span>Bezeichnung</span><input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="z. B. Sponsoring Schule" /></label>
      <div className={styles.dateFields}>
        <StyledDropdown ariaLabel="Typ auswählen" label="Typ" value={newType} onChange={(value) => setNewType(value as typeof newType)} className={styles.formDropdown} options={[{ value: "Einnahme", label: "Einnahme" }, { value: "Ausgabe", label: "Ausgabe" }]} />
        <StyledDropdown ariaLabel="Kategorie auswählen" label="Kategorie" value={newCategory} onChange={(value) => setNewCategory(value as Category)} className={styles.formDropdown} options={[{ value: "Material", label: "Material" }, { value: "Sonstiges", label: "Sonstiges" }, { value: "Veranstaltung", label: "Veranstaltung" }]} />
      </div>
      <label className={styles.formField}><span>Betrag</span><input inputMode="decimal" value={newAmount} onChange={(event) => setNewAmount(event.target.value)} placeholder="0,00" /></label>
      <StyledDropdown ariaLabel="Konto auswählen" label="Konto" value={newAccount} onChange={(value) => setNewAccount(value as Exclude<AccountFilter, "Alle Konten">)} className={styles.formDropdown} options={[{ value: "Bankkonto", label: "Bankkonto" }, { value: "Barkasse", label: "Barkasse" }]} />
    </div><div className={styles.modalFooter}><span /><div><button type="button" className={styles.secondaryButton} onClick={() => setAddOpen(false)}>Abbrechen</button><button type="button" className={styles.primaryButton} onClick={addTransaction}>Hinzufügen</button></div></div></Overlay> : null}

    {selected ? <Overlay label="Transaktionsdetails" onClose={() => setSelected(null)}><div className={styles.modalHeader}><div><h2>{selected.title}</h2><p>Transaktionsdetails</p></div><button type="button" className={styles.iconButton} onClick={() => setSelected(null)} aria-label="Details schließen"><X /></button></div><div className={styles.detailGrid}><span>Kategorie</span><strong>{selected.category}</strong><span>Datum</span><strong>{selected.date}</strong><span>Betrag</span><strong className={selected.amount >= 0 ? styles.positive : styles.negative}>{displayAmount(selected.amount)}</strong><span>Beleg</span><strong>{selected.receipt ?? "Kein Beleg"}</strong></div></Overlay> : null}
  </section>;
}
