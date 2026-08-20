"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ReceiptText,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FieldDropdown } from "@/components/ui/field-dropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import styles from "./reports.module.css";

const cashflowData = [
  { month: "Jan", income: 860, expenses: 520 },
  { month: "Feb", income: 1120, expenses: 740 },
  { month: "Mär", income: 940, expenses: 1010 },
  { month: "Apr", income: 1380, expenses: 890 },
  { month: "Mai", income: 1210, expenses: 1640 },
  { month: "Jun", income: 1395.5, expenses: 2503.1 },
];

const categories = [
  { name: "Veranstaltung", amount: 1740, share: 58 },
  { name: "Material", amount: 384.9, share: 32 },
  { name: "Sonstiges", amount: 185.5, share: 10 },
];

const goals = [
  { name: "Abiball", saved: 2100, target: 3000 },
  { name: "Abizeitung", saved: 540, target: 1200 },
  { name: "Reserve", saved: 800, target: 1000 },
];

const reviewItems = [
  { title: "3 Belege warten auf Prüfung", detail: "Zuletzt aktualisiert heute, 12:18 Uhr", tone: "warning" },
  { title: "1 Bargeldzahlung ohne Beleg", detail: "Kuchenverkauf vom 11.05.2024", tone: "neutral" },
  { title: "1 Beleg ohne Transaktionszuordnung", detail: "Bon_Bäckerei.jpg", tone: "neutral" },
  { title: "Kassenabgleich vollständig", detail: "Letzter Kassensturz am 15.05.2024", tone: "positive" },
];

const chartConfig = {
  income: {
    label: "Einnahmen",
    theme: { light: "#18181b", dark: "#f4f4f5" },
  },
  expenses: {
    label: "Ausgaben",
    theme: { light: "#a1a1aa", dark: "#71717a" },
  },
} satisfies ChartConfig;

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export default function ReportsPage() {
  const [period, setPeriod] = useState("6-monate");
  const [account, setAccount] = useState("alle-konten");
  const [category, setCategory] = useState("alle-kategorien");
  const [exportMessage, setExportMessage] = useState("");

  const totals = useMemo(() => ({ income: 1395.5, expenses: 2503.1, net: -1107.6 }), []);

  function prepareExport(format: string) {
    setExportMessage(`${format}-Bericht wurde vorbereitet.`);
  }

  return (
    <TooltipProvider>
      <section className={styles.page}>
        <div className={styles.summaryGrid}>
          <SummaryCard label="Einnahmen" value={money.format(totals.income)} icon={<ArrowDownRight />} meta="+18,6 % zum Vormonat" tone="positive" />
          <SummaryCard label="Ausgaben" value={money.format(totals.expenses)} icon={<ArrowUpRight />} meta="+9,3 % zum Vormonat" tone="neutral" />
          <SummaryCard label="Netto" value={money.format(totals.net)} icon={<ReceiptText />} meta="Aktueller Zeitraum" tone="neutral" />
          <SummaryCard label="Prüfbedarf" value="4 Vorgänge" icon={<AlertTriangle />} meta="3 Belege, 1 Barzahlung" tone="warning" />
        </div>

        <Tabs defaultValue="overview" className={styles.reportWorkspace}>
          <header className={styles.workspaceHeader}>
            <div>
              <h2>Klassenfinanzen-Bericht</h2>
              <p>Cashflow, Kategorien und offene Prüfungen.</p>
            </div>
            <TabsList variant="line" className={styles.workspaceTabs}>
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="review">Prüfung</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
          </header>

          <TabsContent value="overview" className={styles.tabContent}>
            <div className={styles.filters}>
              <FieldDropdown
                ariaLabel="Berichtszeitraum"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "6-monate", label: "Letzte 6 Monate" },
                  { value: "abi-jahr", label: "Abi-Jahr 2026" },
                  { value: "gesamt", label: "Gesamter Zeitraum" },
                ]}
              />
              <FieldDropdown
                ariaLabel="Konto"
                value={account}
                onChange={setAccount}
                options={[
                  { value: "alle-konten", label: "Alle Konten" },
                  { value: "klassenkonto", label: "Klassenkonto" },
                  { value: "barkasse", label: "Barkasse" },
                ]}
              />
              <FieldDropdown
                ariaLabel="Kategorie"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "alle-kategorien", label: "Alle Kategorien" },
                  { value: "veranstaltung", label: "Veranstaltung" },
                  { value: "material", label: "Material" },
                  { value: "sonstiges", label: "Sonstiges" },
                ]}
              />
              <button type="button" className={styles.exportShortcut} onClick={() => prepareExport("PDF")}>
                <Download aria-hidden="true" />
                Bericht exportieren
              </button>
            </div>

            <div className={styles.reportGrid}>
              <article className={styles.cashflowPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h3>Cashflow</h3>
                    <p>Monatliche Einnahmen und Ausgaben</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger render={<button type="button" className={styles.infoButton} aria-label="Diagramminformationen" />}>
                      <Info aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent>Bewege den Mauszeiger über einen Balken für genaue Werte.</TooltipContent>
                  </Tooltip>
                </header>
                <ChartContainer config={chartConfig} className={styles.cashflowChart}>
                  <BarChart accessibilityLayer data={cashflowData} margin={{ left: 2, right: 8, top: 12, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={58}
                      tickFormatter={(value) => {
                        const numericValue = Number(value);
                        return numericValue >= 1000
                          ? `${(numericValue / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k €`
                          : `${numericValue.toLocaleString("de-DE")} €`;
                      }}
                    />
                    <ChartTooltip
                      cursor={{ fill: "rgb(0 0 0 / 0.035)" }}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className={styles.tooltipValue}>
                              <span>{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                              <strong>{money.format(Number(value))}</strong>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[5, 5, 0, 0]} activeBar={{ fillOpacity: .72 }} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[5, 5, 0, 0]} activeBar={{ fillOpacity: .72 }} />
                  </BarChart>
                </ChartContainer>
              </article>

              <aside className={styles.insightColumn}>
                <article className={styles.categoryPanel}>
                  <header className={styles.panelHeader}><div><h3>Ausgaben nach Kategorie</h3><p>Aktueller Zeitraum</p></div></header>
                  <div className={styles.categoryList}>
                    {categories.map((item, index) => (
                      <div className={styles.categoryItem} key={item.name}>
                        <div><strong>{item.name}</strong><span>{money.format(item.amount)}</span></div>
                        <div className={styles.categoryBar}><span style={{ width: `${item.share}%`, opacity: 1 - index * .24 }} /></div>
                        <b>{item.share}%</b>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={styles.goalPanel}>
                  <header className={styles.panelHeader}><div><h3>Zielbeiträge</h3><p>Finanzierung der aktuellen Sparziele</p></div></header>
                  <div className={styles.goalList}>
                    {goals.map((goal) => {
                      const progress = Math.round((goal.saved / goal.target) * 100);
                      return <div className={styles.goalItem} key={goal.name}>
                        <div><strong>{goal.name}</strong><span>{money.format(goal.saved)} von {money.format(goal.target)}</span></div>
                        <b>{progress}%</b>
                      </div>;
                    })}
                  </div>
                </article>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="review" className={styles.tabContent}>
            <section className={styles.reviewGrid}>
              {reviewItems.map((item) => (
                <button type="button" className={styles.reviewItem} key={item.title}>
                  <span className={`${styles.reviewIcon} ${styles[item.tone]}`}>
                    {item.tone === "positive" ? <CheckCircle2 /> : item.tone === "warning" ? <AlertTriangle /> : <ReceiptText />}
                  </span>
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <ArrowRight aria-hidden="true" />
                </button>
              ))}
            </section>
          </TabsContent>

          <TabsContent value="export" className={styles.tabContent}>
            <section className={styles.exportGrid}>
              <ExportCard icon={<FileText />} title="PDF-Bericht" description="Kompakte Übersicht zum Teilen" onClick={() => prepareExport("PDF")} />
              <ExportCard icon={<FileSpreadsheet />} title="Excel-Datei" description="Alle Werte zur Weiterverarbeitung" onClick={() => prepareExport("Excel")} />
              <ExportCard icon={<ReceiptText />} title="Prüfprotokoll" description="Belege und offene Vorgänge" onClick={() => prepareExport("Prüfprotokoll")} />
            </section>
            <p className={styles.exportMessage} aria-live="polite">{exportMessage || "Wähle ein Format für den Export."}</p>
          </TabsContent>
        </Tabs>
      </section>
    </TooltipProvider>
  );
}

function SummaryCard({ label, value, meta, icon, tone }: { label: string; value: string; meta: string; icon: React.ReactNode; tone: "positive" | "neutral" | "warning" }) {
  return <article className={styles.summaryCard}>
    <span className={`${styles.summaryIcon} ${styles[tone]}`}>{icon}</span>
    <div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>
  </article>;
}

function ExportCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <button type="button" className={styles.exportCard} onClick={onClick}>
    <span>{icon}</span>
    <span><strong>{title}</strong><small>{description}</small></span>
    <Download aria-hidden="true" />
  </button>;
}
