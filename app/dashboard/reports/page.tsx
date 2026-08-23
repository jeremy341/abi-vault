"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import styles from "./reports.module.css";
import phoneStyles from "./reports-phone.module.css";
import { usePresentationMode } from "@/hooks/use-presentation-mode";

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
  {
    title: "3 Belege warten auf Prüfung",
    detail: "Zuletzt aktualisiert heute, 12:18 Uhr",
    tone: "warning",
  },
  {
    title: "1 Bargeldzahlung ohne Beleg",
    detail: "Kuchenverkauf vom 11.05.2024",
    tone: "neutral",
  },
  {
    title: "1 Beleg ohne Transaktionszuordnung",
    detail: "Bon_Bäckerei.jpg",
    tone: "neutral",
  },
  {
    title: "Kassenabgleich vollständig",
    detail: "Letzter Kassensturz am 15.05.2024",
    tone: "positive",
  },
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

const analysisBalance = [
  { month: "Jan 2026", balance: 820 },
  { month: "Feb 2026", balance: 1280 },
  { month: "Mär 2026", balance: 2010 },
  { month: "Apr 2026", balance: 3160 },
  { month: "Mai 2026", balance: 2850.75 },
  { month: "Jun 2026", balance: 3476 },
];

const analysisFlow = [
  { month: "Jan", income: 980, expenses: 560 },
  { month: "Feb", income: 2240, expenses: 1120 },
  { month: "Mär", income: 2480, expenses: 1380 },
  { month: "Apr", income: 3000, expenses: 1680 },
  { month: "Mai", income: 3020, expenses: 2100 },
  { month: "Jun", income: 2950, expenses: 2503.1 },
];

const analysisSpend = [
  { name: "Veranstaltung", value: 1447.4, share: 58 },
  { name: "Material", value: 676.2, share: 27 },
  { name: "Sonstiges", value: 379.5, share: 15 },
];

const analysisProfile = [
  { name: "Zielerreichung", current: 72, target: 80 },
  { name: "Liquidität", current: 86, target: 75 },
  { name: "Belegstatus", current: 68, target: 90 },
  { name: "Kassenabgleich", current: 100, target: 100 },
  { name: "Planerfüllung", current: 74, target: 85 },
];

const analysisChartConfig = {
  balance: { label: "Kontostand", color: "#18181b" },
  income: { label: "Einnahmen", color: "#18181b" },
  expenses: { label: "Ausgaben", color: "#a1a1aa" },
  current: { label: "Aktuell", color: "#18181b" },
  target: { label: "Ziel", color: "#a1a1aa" },
} satisfies ChartConfig;

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type PhoneReportTab = "overview" | "analysis" | "review" | "export";

function PhoneReportsView({
  period,
  onPeriodChange,
  account,
  onAccountChange,
  exportMessage,
  onExport,
}: {
  period: string;
  onPeriodChange: (value: string) => void;
  account: string;
  onAccountChange: (value: string) => void;
  exportMessage: string;
  onExport: (format: string) => void;
}) {
  const [tab, setTab] = useState<PhoneReportTab>("overview");

  return (
    <section className={phoneStyles.root}>
      <div
        className={phoneStyles.tabs}
        role="tablist"
        aria-label="Berichtsbereiche"
      >
        {[
          ["overview", "Übersicht"],
          ["analysis", "Analyse"],
          ["review", "Prüfung"],
          ["export", "Export"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? phoneStyles.activeTab : ""}
            onClick={() => setTab(value as PhoneReportTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <section className={phoneStyles.hero}>
            <span>Netto</span>
            <strong>1.107,60 €</strong>
            <p className={phoneStyles.positive}>+342,55 € zum Vormonat</p>
            <div className={phoneStyles.heroSide}>
              <span>Liquidität</span>
              <b>3.476,00 €</b>
              <span>Prüfbedarf</span>
              <b>4 Vorgänge</b>
            </div>
          </section>
          <div className={phoneStyles.filters}>
            <FieldDropdown
              ariaLabel="Zeitraum"
              value={period}
              onChange={onPeriodChange}
              options={[
                { value: "3-monate", label: "Letzte 3 Monate" },
                { value: "6-monate", label: "Letzte 6 Monate" },
                { value: "jahr", label: "Dieses Jahr" },
              ]}
            />
            <FieldDropdown
              ariaLabel="Konto"
              value={account}
              onChange={onAccountChange}
              options={[
                { value: "alle-konten", label: "Alle Konten" },
                { value: "bankkonto", label: "Bankkonto" },
                { value: "barkasse", label: "Barkasse" },
              ]}
            />
          </div>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Cashflow</h2>
              <span>6 Monate</span>
            </header>
            <ChartContainer config={chartConfig} className={phoneStyles.chart}>
              <LineChart data={cashflowData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="income"
                  type="monotone"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="expenses"
                  type="monotone"
                  stroke="var(--color-expenses)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Ausgaben</h2>
              <span>2.503,10 €</span>
            </header>
            <div className={phoneStyles.rows}>
              {categories.map((item) => (
                <div className={phoneStyles.row} key={item.name}>
                  <span>
                    <strong>{item.name}</strong>
                    <div className={phoneStyles.progress}>
                      <i style={{ width: `${item.share}%` }} />
                    </div>
                  </span>
                  <b>{item.share}%</b>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : tab === "analysis" ? (
        <>
          <section className={phoneStyles.hero}>
            <span>Kontostand</span>
            <strong>3.476,00 €</strong>
            <p>Entwicklung im gewählten Zeitraum</p>
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Kontostand-Verlauf</h2>
              <span>Monatlich</span>
            </header>
            <ChartContainer
              config={analysisChartConfig}
              className={phoneStyles.chart}
            >
              <AreaChart data={analysisBalance} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="balance"
                  type="monotone"
                  fill="var(--color-balance)"
                  fillOpacity={0.12}
                  stroke="var(--color-balance)"
                />
              </AreaChart>
            </ChartContainer>
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Finanzprofil</h2>
              <span>Aktuell</span>
            </header>
            <div className={phoneStyles.rows}>
              {analysisProfile.map((item) => (
                <div className={phoneStyles.row} key={item.name}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>Ziel {item.target}%</small>
                  </span>
                  <b>{item.current}%</b>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : tab === "review" ? (
        <section className={phoneStyles.section}>
          <header className={phoneStyles.sectionHeader}>
            <h2>Offene Vorgänge</h2>
            <span>4 insgesamt</span>
          </header>
          <div className={phoneStyles.rows}>
            {reviewItems.map((item) => (
              <div className={phoneStyles.reviewRow} key={item.title}>
                {item.tone === "warning" ? (
                  <AlertTriangle
                    aria-hidden="true"
                    className={phoneStyles.negative}
                  />
                ) : item.tone === "positive" ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className={phoneStyles.positive}
                  />
                ) : (
                  <ReceiptText aria-hidden="true" />
                )}
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <b>{item.tone === "positive" ? "Erledigt" : "Offen"}</b>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className={phoneStyles.section}>
          <header className={phoneStyles.sectionHeader}>
            <h2>Bericht exportieren</h2>
            <span>Abi 2026</span>
          </header>
          <div className={phoneStyles.exportGrid}>
            {[
              ["PDF", "PDF-Bericht", "Für Ablage und Freigabe", FileText],
              [
                "Excel",
                "Excel-Datei",
                "Für weitere Auswertungen",
                FileSpreadsheet,
              ],
              [
                "Prüfprotokoll",
                "Prüfprotokoll",
                "Offene und erledigte Vorgänge",
                ShieldCheck,
              ],
            ].map(([format, title, description, Icon]) => {
              const ExportIcon = Icon as typeof FileText;
              return (
                <button
                  type="button"
                  className={phoneStyles.exportButton}
                  key={String(format)}
                  onClick={() => onExport(String(format))}
                >
                  <ExportIcon aria-hidden="true" />
                  <span>
                    <strong>{String(title)}</strong>
                    <small>{String(description)}</small>
                  </span>
                  <Download aria-hidden="true" className="size-4" />
                </button>
              );
            })}
          </div>
          <p className={phoneStyles.message} aria-live="polite">
            {exportMessage || "\u00a0"}
          </p>
        </section>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const mode = usePresentationMode();
  const [period, setPeriod] = useState("6-monate");
  const [account, setAccount] = useState("alle-konten");
  const [category, setCategory] = useState("alle-kategorien");
  const [exportMessage, setExportMessage] = useState("");

  function prepareExport(format: string) {
    setExportMessage(`${format}-Bericht wurde vorbereitet.`);
  }

  if (mode === "phone") {
    return (
      <TooltipProvider>
        <PhoneReportsView
          period={period}
          onPeriodChange={setPeriod}
          account={account}
          onAccountChange={setAccount}
          exportMessage={exportMessage}
          onExport={prepareExport}
        />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <section className={styles.page}>
        <Tabs defaultValue="overview" className={styles.reportWorkspace}>
          <header className={styles.referenceTabsHeader}>
            <TabsList variant="line" className={styles.workspaceTabs}>
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="analysis">Analysen</TabsTrigger>
              <TabsTrigger value="review">Prüfung</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
          </header>

          <TabsContent value="overview" className={styles.tabContent}>
            <div className={styles.analysisKpiGrid}>
              <AnalysisKpi
                label="Netto"
                value="1.107,60 €"
                meta="+342,55 € vs. Vormonat"
                positive
              />
              <AnalysisKpi
                label="Liquidität"
                value="3.476,00 €"
                meta="+1.236,25 € vs. Vormonat"
                positive
              />
              <AnalysisKpi
                label="Ausgaben"
                value="2.503,10 €"
                meta="−215,40 € vs. Vormonat"
              />
              <AnalysisKpi
                label="Prüfbedarf"
                value="4"
                meta="Belege / Transaktionen"
              />
            </div>
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
              <button
                type="button"
                className={styles.exportShortcut}
                onClick={() => prepareExport("PDF")}
              >
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
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className={styles.infoButton}
                          aria-label="Diagramminformationen"
                        />
                      }
                    >
                      <Info aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Bewege den Mauszeiger über einen Balken für genaue Werte.
                    </TooltipContent>
                  </Tooltip>
                </header>
                <ChartContainer
                  config={chartConfig}
                  className={styles.cashflowChart}
                >
                  <BarChart
                    accessibilityLayer
                    data={cashflowData}
                    margin={{ left: 2, right: 8, top: 12, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
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
                              <span>
                                {
                                  chartConfig[name as keyof typeof chartConfig]
                                    ?.label
                                }
                              </span>
                              <strong>{money.format(Number(value))}</strong>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="income"
                      fill="var(--color-income)"
                      radius={[5, 5, 0, 0]}
                      activeBar={{ fillOpacity: 0.72 }}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="var(--color-expenses)"
                      radius={[5, 5, 0, 0]}
                      activeBar={{ fillOpacity: 0.72 }}
                    />
                  </BarChart>
                </ChartContainer>
              </article>

              <aside className={styles.insightColumn}>
                <article className={styles.categoryPanel}>
                  <header className={styles.panelHeader}>
                    <div>
                      <h3>Ausgaben nach Kategorie</h3>
                      <p>Aktueller Zeitraum</p>
                    </div>
                  </header>
                  <div className={styles.categoryList}>
                    {categories.map((item, index) => (
                      <div className={styles.categoryItem} key={item.name}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{money.format(item.amount)}</span>
                        </div>
                        <div className={styles.categoryBar}>
                          <span
                            style={{
                              width: `${item.share}%`,
                              opacity: 1 - index * 0.24,
                            }}
                          />
                        </div>
                        <b>{item.share}%</b>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={styles.goalPanel}>
                  <header className={styles.panelHeader}>
                    <div>
                      <h3>Zielbeiträge</h3>
                      <p>Finanzierung der aktuellen Sparziele</p>
                    </div>
                  </header>
                  <div className={styles.goalList}>
                    {goals.map((goal) => {
                      const progress = Math.round(
                        (goal.saved / goal.target) * 100,
                      );
                      return (
                        <div className={styles.goalItem} key={goal.name}>
                          <div>
                            <strong>{goal.name}</strong>
                            <span>
                              {money.format(goal.saved)} von{" "}
                              {money.format(goal.target)}
                            </span>
                          </div>
                          <b>{progress}%</b>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </aside>
            </div>
          </TabsContent>

          <TabsContent
            value="analysis"
            className={`${styles.tabContent} ${styles.analysisTab}`}
          >
            <div className={styles.analysisKpiGrid}>
              <AnalysisKpi
                label="Netto"
                value="1.107,60 €"
                meta="+342,55 € vs. Vormonat"
                positive
              />
              <AnalysisKpi
                label="Liquidität"
                value="3.476,00 €"
                meta="+1.236,25 € vs. Vormonat"
                positive
              />
              <AnalysisKpi
                label="Ausgaben"
                value="2.503,10 €"
                meta="−215,40 € vs. Vormonat"
              />
              <AnalysisKpi
                label="Prüfbedarf"
                value="4"
                meta="Belege / Transaktionen"
              />
            </div>
            <div className={styles.analysisFilters}>
              <FieldDropdown
                ariaLabel="Analysezeitraum"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "6-monate", label: "Jan - Jun 2026" },
                  { value: "abi-jahr", label: "Abi-Jahr 2026" },
                  { value: "gesamt", label: "Gesamter Zeitraum" },
                ]}
              />
              <FieldDropdown
                ariaLabel="Analysekonto"
                value={account}
                onChange={setAccount}
                options={[
                  { value: "alle-konten", label: "Alle Konten" },
                  { value: "klassenkonto", label: "Klassenkonto" },
                  { value: "barkasse", label: "Barkasse" },
                ]}
              />
              <FieldDropdown
                ariaLabel="Analysekategorie"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "alle-kategorien", label: "Alle Kategorien" },
                  { value: "veranstaltung", label: "Alle Kategorien" },
                  { value: "material", label: "Material" },
                ]}
              />
              <button
                type="button"
                className={styles.resetButton}
                onClick={() => {
                  setPeriod("6-monate");
                  setAccount("alle-konten");
                  setCategory("alle-kategorien");
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
            <div className={styles.analysisGrid}>
              <ChartPanel
                title="Kontostand-Verlauf"
                subtitle="Verfügbarer Bestand nach Monat"
                className={styles.analysisWidePanel}
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.analysisChart}
                >
                  <AreaChart
                    accessibilityLayer
                    data={analysisBalance}
                    margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={50}
                      tickFormatter={(value) =>
                        `${(Number(value) / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k €`
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="balance"
                      type="monotone"
                      fill="var(--color-balance)"
                      fillOpacity={0.12}
                      stroke="var(--color-balance)"
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </ChartPanel>

              <ChartPanel
                title="Ausgaben nach Kategorie"
                subtitle="Verteilung im Berichtszeitraum"
              >
                <div className={styles.donutLayout}>
                  <ChartContainer
                    config={analysisChartConfig}
                    className={styles.donutChart}
                  >
                    <PieChart accessibilityLayer>
                      <ChartTooltip
                        content={<ChartTooltipContent nameKey="name" />}
                      />
                      <Pie
                        data={analysisSpend}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        strokeWidth={1}
                      >
                        {analysisSpend.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={["#18181b", "#a1a1aa", "#d4d4d8"][index]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className={styles.donutLegend}>
                    {analysisSpend.map((entry, index) => (
                      <div key={entry.name}>
                        <span>
                          <i
                            style={{
                              background: ["#18181b", "#a1a1aa", "#d4d4d8"][
                                index
                              ],
                            }}
                          />
                          {entry.name}
                        </span>
                        <strong>{entry.share}%</strong>
                        <small>{money.format(entry.value)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartPanel>

              <ChartPanel
                title="Einnahmen & Ausgaben"
                subtitle="Monatlicher Vergleich"
                className={styles.analysisWidePanel}
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.analysisChart}
                >
                  <LineChart
                    accessibilityLayer
                    data={analysisFlow}
                    margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={50}
                      tickFormatter={(value) =>
                        `${(Number(value) / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k €`
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="income"
                      type="monotone"
                      stroke="var(--color-income)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      dataKey="expenses"
                      type="monotone"
                      stroke="var(--color-expenses)"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </ChartPanel>

              <ChartPanel
                title="Finanzprofil"
                subtitle="Aktuell im Vergleich zum Ziel"
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.radarChart}
                >
                  <RadarChart
                    accessibilityLayer
                    data={analysisProfile}
                    outerRadius="68%"
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 9 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Radar
                      name="Aktuell"
                      dataKey="current"
                      stroke="var(--color-current)"
                      fill="var(--color-current)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Ziel"
                      dataKey="target"
                      stroke="var(--color-target)"
                      fill="transparent"
                      strokeDasharray="5 4"
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ChartContainer>
              </ChartPanel>
            </div>
          </TabsContent>

          <TabsContent value="review" className={styles.tabContent}>
            <div className={styles.reviewSummaryGrid}>
              <article>
                <span>Offene Belege</span>
                <strong>3</strong>
                <small>Warten auf Prüfung</small>
              </article>
              <article>
                <span>Ohne Zuordnung</span>
                <strong>1</strong>
                <small>Beleg zuordnen</small>
              </article>
              <article>
                <span>Abgleich</span>
                <strong className={styles.analysisPositive}>100 %</strong>
                <small>Kassenbestand stimmt</small>
              </article>
            </div>
            <div className={styles.reviewLayout}>
              <section className={styles.reviewQueue}>
                <header className={styles.reviewSectionHeader}>
                  <div>
                    <h3>Offene Vorgänge</h3>
                    <p>Arbeite die wichtigsten Prüfungen der Reihe nach ab.</p>
                  </div>
                  <span>4 Vorgänge</span>
                </header>
                <div className={styles.reviewQueueList}>
                  {reviewItems.map((item) => (
                    <button
                      type="button"
                      className={styles.reviewQueueItem}
                      key={item.title}
                    >
                      <span
                        className={`${styles.reviewIcon} ${styles[item.tone]}`}
                      >
                        {item.tone === "positive" ? (
                          <CheckCircle2 />
                        ) : item.tone === "warning" ? (
                          <AlertTriangle />
                        ) : (
                          <ReceiptText />
                        )}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <b>{item.tone === "positive" ? "Erledigt" : "Öffnen"}</b>
                      <ArrowRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
              <aside className={styles.reviewStatusPanel}>
                <header className={styles.reviewSectionHeader}>
                  <div>
                    <h3>Prüfstatus</h3>
                    <p>Alle relevanten Vorgänge</p>
                  </div>
                  <Info aria-hidden="true" />
                </header>
                <div className={styles.reviewStatusValue}>
                  <strong>4</strong>
                  <span>Vorgänge insgesamt</span>
                </div>
                <div className={styles.reviewStatusBars}>
                  <div>
                    <span>
                      <b>Geprüft</b>
                      <b>18</b>
                    </span>
                    <i>
                      <em style={{ width: "82%" }} />
                    </i>
                  </div>
                  <div>
                    <span>
                      <b>Zu prüfen</b>
                      <b>3</b>
                    </span>
                    <i>
                      <em style={{ width: "14%" }} />
                    </i>
                  </div>
                  <div>
                    <span>
                      <b>Ohne Zuordnung</b>
                      <b>1</b>
                    </span>
                    <i>
                      <em style={{ width: "5%" }} />
                    </i>
                  </div>
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="export" className={styles.tabContent}>
            <section className={styles.exportWorkspace}>
              <header className={styles.exportSectionHeader}>
                <div>
                  <h3>Berichte exportieren</h3>
                  <p>
                    Wähle einen Bericht und sichere die aktuellen Finanzdaten
                    für eure Unterlagen.
                  </p>
                </div>
                <Download aria-hidden="true" />
              </header>
              <div className={styles.exportControls}>
                <FieldDropdown
                  ariaLabel="Exportzeitraum"
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { value: "6-monate", label: "Letzte 6 Monate" },
                    { value: "abi-jahr", label: "Abi-Jahr 2026" },
                    { value: "gesamt", label: "Gesamter Zeitraum" },
                  ]}
                />
                <FieldDropdown
                  ariaLabel="Exportkonto"
                  value={account}
                  onChange={setAccount}
                  options={[
                    { value: "alle-konten", label: "Alle Konten" },
                    { value: "klassenkonto", label: "Klassenkonto" },
                    { value: "barkasse", label: "Barkasse" },
                  ]}
                />
                <FieldDropdown
                  ariaLabel="Exportkategorie"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "alle-kategorien", label: "Alle Kategorien" },
                    { value: "veranstaltung", label: "Veranstaltung" },
                    { value: "material", label: "Material" },
                  ]}
                />
              </div>
              <div className={styles.exportGrid}>
                <ExportCard
                  icon={<FileText />}
                  title="PDF-Bericht"
                  description="Kompakte Übersicht zum Teilen"
                  onClick={() => prepareExport("PDF")}
                />
                <ExportCard
                  icon={<FileSpreadsheet />}
                  title="Excel-Datei"
                  description="Alle Werte zur Weiterverarbeitung"
                  onClick={() => prepareExport("Excel")}
                />
                <ExportCard
                  icon={<ReceiptText />}
                  title="Prüfprotokoll"
                  description="Belege und offene Vorgänge"
                  onClick={() => prepareExport("Prüfprotokoll")}
                />
              </div>
              <p className={styles.exportMessage} aria-live="polite">
                {exportMessage || "Wähle ein Format für den Export."}
              </p>
            </section>
            <section className={styles.exportHistory}>
              <header className={styles.exportSectionHeader}>
                <div>
                  <h3>Letzte Exporte</h3>
                  <p>Bereits erstellte Berichte</p>
                </div>
              </header>
              <div className={styles.exportHistoryList}>
                <div>
                  <FileText />
                  <span>
                    <strong>Klassenfinanzen_Mai_2026.pdf</strong>
                    <small>Erstellt heute, 10:32 Uhr</small>
                  </span>
                  <b>PDF</b>
                  <ArrowRight />
                </div>
                <div>
                  <FileSpreadsheet />
                  <span>
                    <strong>Transaktionen_April_2026.xlsx</strong>
                    <small>Erstellt am 30.04.2026</small>
                  </span>
                  <b>Excel</b>
                  <ArrowRight />
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </section>
    </TooltipProvider>
  );
}

function ExportCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.exportCard} onClick={onClick}>
      <span>{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Download aria-hidden="true" />
    </button>
  );
}

function AnalysisKpi({
  label,
  value,
  meta,
  positive = false,
}: {
  label: string;
  value: string;
  meta: string;
  positive?: boolean;
}) {
  return (
    <article className={styles.analysisKpi}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={positive ? styles.analysisPositive : ""}>{meta}</small>
    </article>
  );
}

function ChartPanel({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`${styles.analysisPanel} ${className}`}>
      <header className={styles.analysisPanelHeader}>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <Info aria-hidden="true" />
      </header>
      {children}
    </article>
  );
}
