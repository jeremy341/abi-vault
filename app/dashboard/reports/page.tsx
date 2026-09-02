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
import { useEffect, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
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
import { getReportKpisForCurrentOrganization } from "@/features/finance/actions/queries";
import { exportReport } from "@/features/reports/actions/export";
import { useReportSnapshot } from "@/hooks/use-report-snapshot";
import { LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { cachedFinanceQuery } from "@/lib/finance/client-cache";

const reviewItems: Array<{
  title: string;
  detail: string;
  tone: "warning" | "neutral" | "positive";
}> = [];

const chartConfig = {
  income: {
    label: "Income",
    theme: { light: "#18181b", dark: "#f4f4f5" },
  },
  expenses: {
    label: "Expenses",
    theme: { light: "#a1a1aa", dark: "#71717a" },
  },
} satisfies ChartConfig;

const analysisChartConfig = {
  balance: { label: "Kontostand", color: "#18181b" },
  income: { label: "Income", color: "#18181b" },
  expenses: { label: "Expenses", color: "#a1a1aa" },
  current: { label: "Aktuell", color: "#18181b" },
  target: { label: "Goal", color: "#a1a1aa" },
} satisfies ChartConfig;

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type PhoneReportTab = "overview" | "analysis" | "review" | "export";

function PhoneReportsView({
  loading,
  errorMessage,
  kpis,
  cashflow,
  categories: liveCategories,
  analysisBalance,
  period,
  onPeriodChange,
  exportMessage,
  onExport,
}: {
  loading: boolean;
  errorMessage: string;
  kpis: { income: string; expenses: string; net: string; review: string };
  cashflow: Array<{ month: string; income: number; expenses: number }>;
  categories: Array<{ name: string; amount: number; share: number }>;
  analysisBalance: Array<{ month: string; balance: number }>;
  period: string;
  onPeriodChange: (value: string) => void;
  exportMessage: string;
  onExport: (format: string) => void;
}) {
  const [tab, setTab] = useState<PhoneReportTab>("overview");
  const periodLabel = period === "3-monate"
    ? "3 Monate"
    : period === "jahr"
      ? "Dieses Jahr"
      : "6 Monate";

  return (
    <section className={phoneStyles.root} aria-busy={loading}>
      {errorMessage ? <p className={phoneStyles.message} role="alert">{errorMessage}</p> : null}
      <div
        className={phoneStyles.tabs}
        role="tablist"
        aria-label="Berichtsbereiche"
      >
        {[
          ["overview", "Overview"],
          ["analysis", "Analyse"],
          ["review", "Review"],
          ["export", "Export"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`reports-tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`reports-panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            className={tab === value ? phoneStyles.activeTab : ""}
            onClick={() => setTab(value as PhoneReportTab)}
            disabled={loading}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div
          id="reports-panel-overview"
          role="tabpanel"
          aria-labelledby="reports-tab-overview"
          className={phoneStyles.tabPanel}
        >
          <section className={phoneStyles.hero} data-ui-slot="summary">
            <span>Net</span>
            <strong><LoadingText loading={loading}>{kpis.net}</LoadingText></strong>
            <p className={phoneStyles.positive}><LoadingText loading={loading}>cash balance</LoadingText></p>
            <div className={phoneStyles.heroSide}>
              <span>Liquidity</span>
              <b><LoadingText loading={loading}>{kpis.income}</LoadingText></b>
              <span>Review needed</span>
              <b><LoadingText loading={loading}>{kpis.review} items</LoadingText></b>
            </div>
          </section>
          <div className={phoneStyles.filters} data-ui-slot="toolbar">
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
          </div>
          <section className={phoneStyles.section} data-ui-slot="primary-panel">
            <header className={phoneStyles.sectionHeader}>
              <h2>Cashflow</h2>
              <span>{periodLabel}</span>
            </header>
            {cashflow.length ? <ChartContainer
              config={chartConfig}
              className={phoneStyles.chart}
            >
              <LineChart data={cashflow} accessibilityLayer>
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
            </ChartContainer> : <div className={`${phoneStyles.chartEmpty} ${phoneStyles.emptyState}`}>No data for this period.</div>}
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Expenses</h2>
            <span>{liveCategories.length ? money.format(liveCategories.reduce((sum, item) => sum + item.amount, 0)) : "No Expenses"}</span>
            </header>
            <div className={phoneStyles.rows}>
              {liveCategories.length ? liveCategories.map((item) => (
                <div className={phoneStyles.row} key={item.name}>
                  <span>
                    <strong>{item.name}</strong>
                    <div className={phoneStyles.progress}>
                      <i style={{ width: `${item.share}%` }} />
                    </div>
                  </span>
                  <b>{item.share}%</b>
                </div>
              )) : <div className={phoneStyles.emptyState}>No expenses for this period.</div>}
            </div>
          </section>
        </div>
      ) : tab === "analysis" ? (
        <div
          id="reports-panel-analysis"
          role="tabpanel"
          aria-labelledby="reports-tab-analysis"
          className={phoneStyles.tabPanel}
        >
          <section className={phoneStyles.hero}>
            <span>Kontostand</span>
            <strong>{kpis.income}</strong>
            <p>Trend during the selected period</p>
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Kontostand-Verlauf</h2>
              <span>Monatlich</span>
            </header>
            {analysisBalance.length ? <ChartContainer
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
            </ChartContainer> : <div className={`${phoneStyles.chartEmpty} ${phoneStyles.emptyState}`}>No data for this period.</div>}
          </section>
          <section className={phoneStyles.section}>
            <header className={phoneStyles.sectionHeader}>
              <h2>Finanzprofil</h2>
              <span>Aktuell</span>
            </header>
            <div className={phoneStyles.rows}>
              <div className={phoneStyles.emptyState}>No financial profile available yet.</div>
            </div>
          </section>
        </div>
      ) : tab === "review" ? (
        <section
          id="reports-panel-review"
          role="tabpanel"
          aria-labelledby="reports-tab-review"
          className={phoneStyles.section}
        >
          <header className={phoneStyles.sectionHeader}>
            <h2>Opene items</h2>
            <span>{kpis.review} insgesamt</span>
          </header>
          <div className={phoneStyles.rows}>
            {reviewItems.length ? reviewItems.map((item) => (
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
                <b>{item.tone === "positive" ? "Completed" : "Open"}</b>
              </div>
            )) : <div className={phoneStyles.emptyState}>No open items.</div>}
          </div>
        </section>
      ) : (
        <section
          id="reports-panel-export"
          role="tabpanel"
          aria-labelledby="reports-tab-export"
          className={phoneStyles.section}
        >
          <header className={phoneStyles.sectionHeader}>
            <h2>Export report</h2>
            <span>Abi 2026</span>
          </header>
          <div className={phoneStyles.exportGrid}>
            {[
              ["PDF", "PDF-Bericht", "For filing and approval", FileText],
              [
                "Excel",
                "Excel-File",
                "For further analysis",
                FileSpreadsheet,
              ],
              [
                "Review log",
                "Review log",
                "Opene und erledigte items",
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
  const { userId, orgId } = useAppAuth();
  const cacheScope = `${orgId ?? "no-org"}:${userId ?? "anonymous"}`;
  const [period, setPeriod] = useState("6-monate");
  const [category, setCategory] = useState("alle-kategorien");
  const [exportMessage, setExportMessage] = useState("");
  const { snapshot: reportSnapshot, loading: snapshotLoading, error: snapshotError } = useReportSnapshot();
  const liveCashflowData = reportSnapshot?.cashflow ?? [];
  const liveCategories = reportSnapshot?.categories ?? [];
  const liveGoals = reportSnapshot?.goals ?? [];
  const liveAnalysisBalance = reportSnapshot?.analysisBalance ?? [];
  const liveAnalysisFlow = reportSnapshot?.analysisFlow ?? [];
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [reportKpis, setReportKpis] = useState({
    income: "0,00 €",
    expenses: "0,00 €",
    net: "0,00 €",
    review: "0",
    reviewed: "0",
    unassigned: "0",
    reconciliation: "Not reviewed yet",
  });
  const loading = snapshotLoading || kpiLoading;
  const reportError = snapshotError ?? kpiError;
  const reviewedReceiptCount = Number(reportKpis.reviewed);
  const pendingReceiptCount = Number(reportKpis.review);
  const unassignedReceiptCount = Number(reportKpis.unassigned);
  const receiptTotal = Math.max(1, reviewedReceiptCount + pendingReceiptCount);

  useEffect(() => {
    let active = true;
    cachedFinanceQuery("report-kpis", getReportKpisForCurrentOrganization, { scope: cacheScope })
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setKpiError("Review data could not be loaded.");
          return;
        }
        const format = (minor: string | number) => (Number(minor) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
        const net = Number(result.netMinor) / 100;
        setReportKpis({
          income: format(result.liquidMinor),
          expenses: format(result.expenseMinor),
          net: `${net < 0 ? "−" : ""}${format(Math.abs(Number(result.netMinor)))}`,
          review: String(result.reviewCount),
          reviewed: String(result.reviewedReceiptCount),
          unassigned: String(result.unassignedReceiptCount),
          reconciliation: result.reconciliationPercent === null ? "Not reviewed yet" : `${result.reconciliationPercent} %`,
        });
      })
      .catch(() => {
        if (active) setKpiError("Review data could not be loaded.");
      })
      .finally(() => {
        if (active) setKpiLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cacheScope]);

  async function prepareExport(format: string) {
    if (format === "PDF") {
      setExportMessage("PDF-Export ist noch nicht aktiviert.");
      return;
    }
    const result = await exportReport(format === "Review log" ? "Review log" : "Excel");
    if (!result.ok) {
      setExportMessage("The export could not be created.");
      return;
    }
    const blob = new Blob([result.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`${format}-Export wurde heruntergeladen.`);
  }

  if (mode === "phone") {
    return (
      <TooltipProvider>
        <PhoneReportsView
          loading={loading}
          errorMessage={reportError}
          kpis={reportKpis}
          cashflow={liveCashflowData}
          categories={liveCategories}
          analysisBalance={liveAnalysisBalance}
          period={period}
          onPeriodChange={setPeriod}
          exportMessage={exportMessage}
          onExport={prepareExport}
        />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <section className={styles.page} aria-busy={loading}>
        <LoadingStatus loading={loading} label="Reports werden geladen…" />
        {reportError ? <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{reportError}</p> : null}
        <Tabs defaultValue="overview" className={styles.reportWorkspace}>
          <header className={styles.referenceTabsHeader}>
            <TabsList variant="line" className={styles.workspaceTabs}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysen</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
          </header>

          <TabsContent value="overview" className={styles.tabContent}>
            <div className={styles.analysisKpiGrid} data-ui-slot="summary">
              <AnalysisKpi
                label="Net"
                value={reportKpis.net}
                meta="Aus den aktuellen Ledger-Daten"
                positive
                loading={loading}
              />
              <AnalysisKpi
                label="Liquidity"
                value={reportKpis.income}
                meta="Aus den aktuellen Ledger-Daten"
                positive
                loading={loading}
              />
              <AnalysisKpi
                label="Expenses"
                value={reportKpis.expenses}
                meta="Aus den aktuellen Ledger-Daten"
                loading={loading}
              />
              <AnalysisKpi
                label="Review needed"
                value={reportKpis.review}
                meta="Receipts / Transactions"
                loading={loading}
              />
            </div>
            <div className={styles.filters} data-ui-slot="toolbar">
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
                ariaLabel="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "alle-kategorien", label: "All categories" },
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
                Export report
              </button>
            </div>

            <div className={styles.reportGrid} data-ui-slot="content">
              <article className={styles.cashflowPanel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h3>Cashflow</h3>
                    <p>Monatliche Income und Expenses</p>
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
                      Hover over a bar for exact values.
                    </TooltipContent>
                  </Tooltip>
                </header>
                <ChartContainer
                  config={chartConfig}
                  className={styles.cashflowChart}
                >
                  <BarChart
                    accessibilityLayer
                    data={liveCashflowData}
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
                      <h3>Expenses nach Category</h3>
                      <p>Aktueller Zeitraum</p>
                    </div>
                  </header>
                  <div className={styles.categoryList}>
                    {liveCategories.map((item, index) => (
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
                      <h3>Goal contributions</h3>
                      <p>Finanzierung der aktuellen Sparziele</p>
                    </div>
                  </header>
                  <div className={styles.goalList}>
                    {liveGoals.map((goal) => {
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
                label="Net"
                value={reportKpis.net}
                meta="Aus den aktuellen Ledger-Daten"
                positive
              />
              <AnalysisKpi
                label="Liquidity"
                value={reportKpis.income}
                meta="Aus den aktuellen Ledger-Daten"
                positive
              />
              <AnalysisKpi
                label="Expenses"
                value={reportKpis.expenses}
                meta="Aus den aktuellen Ledger-Daten"
              />
              <AnalysisKpi
                label="Review needed"
                value={reportKpis.review}
                meta="Receipts / Transactions"
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
                ariaLabel="Analysekategorie"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "alle-kategorien", label: "All categories" },
                  { value: "veranstaltung", label: "All categories" },
                  { value: "material", label: "Material" },
                ]}
              />
              <button
                type="button"
                className={styles.resetButton}
                onClick={() => {
                  setPeriod("6-monate");
                  setCategory("alle-kategorien");
                }}
              >
                Reset filters
              </button>
            </div>
            <div className={styles.analysisGrid}>
              <ChartPanel
                title="Kontostand-Verlauf"
                subtitle="Available balance by month"
                className={styles.analysisWidePanel}
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.analysisChart}
                >
                  <AreaChart
                    accessibilityLayer
                    data={liveAnalysisBalance}
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
                title="Expenses nach Category"
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
                        data={liveCategories.map((entry) => ({ name: entry.name, value: entry.amount, share: entry.share }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        strokeWidth={1}
                      >
                        {liveCategories.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={["#18181b", "#a1a1aa", "#d4d4d8"][index]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className={styles.donutLegend}>
                    {liveCategories.map((entry, index) => (
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
                        <small>{money.format(entry.amount)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartPanel>

              <ChartPanel
                title="Income & Expenses"
                subtitle="Monatlicher Vergleich"
                className={styles.analysisWidePanel}
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.analysisChart}
                >
                  {liveAnalysisFlow.length ? <LineChart
                    accessibilityLayer
                    data={liveAnalysisFlow}
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
                  </LineChart> : <div className={styles.emptyChart}>No data for this period.</div>}
                </ChartContainer>
              </ChartPanel>

              <ChartPanel
                title="Finanzprofil"
                subtitle="Aktuell im Vergleich zum Goal"
              >
                <ChartContainer
                  config={analysisChartConfig}
                  className={styles.radarChart}
                >
                  <RadarChart
                    accessibilityLayer
                    data={[]}
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
                      name="Goal"
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
                <span>Opene Receipts</span>
                <strong><LoadingText loading={loading}>{reportKpis.review}</LoadingText></strong>
                <small>Warten auf Review</small>
              </article>
              <article>
                <span>Ohne Zuordnung</span>
                <strong><LoadingText loading={loading}>{reportKpis.unassigned}</LoadingText></strong>
                <small>Receipt zuordnen</small>
              </article>
              <article>
                <span>Abgleich</span>
                <strong className={reportKpis.reconciliation === "Not reviewed yet" ? "" : styles.analysisPositive}><LoadingText loading={loading}>{reportKpis.reconciliation}</LoadingText></strong>
                <small>{reportKpis.reconciliation === "Not reviewed yet" ? "No cash count available" : "cash balance checked"}</small>
              </article>
            </div>
            <div className={styles.reviewLayout}>
              <section className={styles.reviewQueue}>
                <header className={styles.reviewSectionHeader}>
                  <div>
                    <h3>Opene items</h3>
                    <p>Arbeite die wichtigsten Reviewen der Reihe nach ab.</p>
                  </div>
                  <span>{reportKpis.review} items</span>
                </header>
                <div className={styles.reviewQueueList}>
                  {reviewItems.length ? reviewItems.map((item) => (
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
                      <b>{item.tone === "positive" ? "Completed" : "Open"}</b>
                      <ArrowRight aria-hidden="true" />
                    </button>
                  )) : <div className={styles.reviewEmpty}>No open items.</div>}
                </div>
              </section>
              <aside className={styles.reviewStatusPanel}>
                <header className={styles.reviewSectionHeader}>
                  <div>
                    <h3>Review status</h3>
                    <p>All relevanten items</p>
                  </div>
                  <Info aria-hidden="true" />
                </header>
                <div className={styles.reviewStatusValue}>
                  <strong>{reportKpis.review}</strong>
                  <span>items insgesamt</span>
                </div>
                <div className={styles.reviewStatusBars}>
                  <div>
                    <span>
                      <b>Approved</b>
                      <b>{reportKpis.reviewed}</b>
                    </span>
                    <i>
                      <em style={{ width: `${Math.round((reviewedReceiptCount / receiptTotal) * 100)}%` }} />
                    </i>
                  </div>
                  <div>
                    <span>
                      <b>Pending review</b>
                      <b>{reportKpis.review}</b>
                    </span>
                    <i>
                      <em style={{ width: `${Math.round((pendingReceiptCount / receiptTotal) * 100)}%` }} />
                    </i>
                  </div>
                  <div>
                    <span>
                      <b>Ohne Zuordnung</b>
                      <b>{reportKpis.unassigned}</b>
                    </span>
                    <i>
                      <em style={{ width: `${Math.min(100, Math.round((unassignedReceiptCount / receiptTotal) * 100))}%` }} />
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
                  <h3>Reports exportieren</h3>
                  <p>
                    Choose einen Bericht und sichere die aktuellen Finanzdaten
                    for your records.
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
                  ariaLabel="Exportkategorie"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "alle-kategorien", label: "All categories" },
                    { value: "veranstaltung", label: "Veranstaltung" },
                    { value: "material", label: "Material" },
                  ]}
                />
              </div>
              <div className={styles.exportGrid}>
                <ExportCard
                  icon={<FileText />}
                  title="PDF-Bericht"
                  description="Kompakte Overview zum Teilen"
                  onClick={() => prepareExport("PDF")}
                />
                <ExportCard
                  icon={<FileSpreadsheet />}
                  title="Excel-File"
                  description="All Werte zur Weiterverarbeitung"
                  onClick={() => prepareExport("Excel")}
                />
                <ExportCard
                  icon={<ReceiptText />}
                  title="Review log"
                  description="Receipts und offene items"
                  onClick={() => prepareExport("Review log")}
                />
              </div>
              <p className={styles.exportMessage} aria-live="polite">
                {exportMessage || "Choose an export format."}
              </p>
            </section>
            <section className={styles.exportHistory}>
              <header className={styles.exportSectionHeader}>
                <div>
                  <h3>Letzte Exporte</h3>
                  <p>Bereits erstellte Reports</p>
                </div>
              </header>
              <div className={styles.exportHistoryList}>
                <p className={styles.emptyHistory}>No exports created yet.</p>
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
  loading = false,
}: {
  label: string;
  value: string;
  meta: string;
  positive?: boolean;
  loading?: boolean;
}) {
  return (
    <article className={styles.analysisKpi}>
      <span>{label}</span>
      <strong><LoadingText loading={loading}>{value}</LoadingText></strong>
      <small className={positive ? styles.analysisPositive : ""}><LoadingText loading={loading}>{meta}</LoadingText></small>
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
