"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAppAuth } from "@/components/auth/app-auth";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { getReportKpisForCurrentOrganization } from "@/features/finance/actions/queries";
import { exportReport } from "@/features/reports/actions/export";
import { useReportSnapshot } from "@/hooks/use-report-snapshot";
import { cachedFinanceQuery, financeScope } from "@/lib/finance/client-cache";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import styles from "./reports.module.css";

const chartConfig = {
  income: { label: "Income", color: "var(--ink)" },
  expenses: { label: "Expenses", color: "var(--control)" },
} satisfies ChartConfig;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const MINUS = "−";

const signed = (value: number) => `${value < 0 ? MINUS : ""}${currency.format(Math.abs(value))}`;

export default function ReportsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const [exportMessage, setExportMessage] = useState("");
  const { snapshot, loading: snapshotLoading, error: snapshotError } = useReportSnapshot();
  const cashflow = snapshot?.cashflow ?? [];
  const categories = snapshot?.categories ?? [];
  const goals = snapshot?.goals ?? [];
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState("");

  const [kpis, setKpis] = useState({
    liquidity: "$0.00",
    expenses: "$0.00",
    net: "$0.00",
    review: "0",
    reviewed: "0",
    unassigned: "0",
    reconciliation: "Not reviewed yet",
  });

  const loading = snapshotLoading || kpiLoading;
  const error = snapshotError ?? kpiError;

  useEffect(() => {
    let active = true;
    cachedFinanceQuery("report-kpis", getReportKpisForCurrentOrganization, { scope: cacheScope })
      .then((reportKpis) => {
        if (!active) return;

        if (!reportKpis.ok) {
          setKpiError("Review data could not be loaded.");

          return;
        }

        const format = (minor: string | number) => (Number(minor) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
        const net = Number(reportKpis.netMinor);

        setKpis({
          liquidity: format(reportKpis.liquidMinor),
          expenses: format(reportKpis.expenseMinor),
          net: `${net < 0 ? MINUS : ""}${format(Math.abs(net))}`,
          review: String(reportKpis.reviewCount),
          reviewed: String(reportKpis.reviewedReceiptCount),
          unassigned: String(reportKpis.unassignedReceiptCount),
          reconciliation: reportKpis.reconciliationPercent === null ? "Not reviewed yet" : `${reportKpis.reconciliationPercent}%`,
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

  async function prepareExport(format: "Excel" | "Review log") {
    const result = await exportReport(format);

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
    setExportMessage(`${result.filename} was downloaded.`);
  }

  return (
    <section className={`${ledger.page}`} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading reports" />
      {error ? <LoadError message={error} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Net</dt>
            <dd className={`${ledger.net} total-rule`}><LoadingText loading={loading}>{kpis.net}</LoadingText></dd>
          </div>
          <div>
            <dt>Liquidity</dt>
            <dd><LoadingText loading={loading}>{kpis.liquidity}</LoadingText></dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd><LoadingText loading={loading}>{kpis.expenses}</LoadingText></dd>
          </div>
          <div>
            <dt>Needs review</dt>
            <dd><LoadingText loading={loading}>{kpis.review}</LoadingText></dd>
          </div>
        </dl>
      </div>

      <div className={ledger.cols}>
        <div className={ledger.col}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Cash flow</h2>
            <p>Last 6 months</p>
          </header>
          {cashflow.length ? (
            <>
              <ChartContainer config={chartConfig} className={styles.chart} role="group" aria-label="Income and expenses per month in US dollars. The same figures are listed in the table below.">
                <BarChart accessibilityLayer data={cashflow} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--rule)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(value) => {
                      const amount = Number(value);

                      return amount >= 1000 ? `$${(amount / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `$${amount}`;
                    }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--sunk)" }}
                    content={<ChartTooltipContent formatter={(value, name) => (
                      <span className={styles.tooltip}>
                        <span>{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                        <strong>{currency.format(Number(value))}</strong>
                      </span>
                    )} />}
                  />
                  <Bar dataKey="income" fill="var(--color-income)" radius={0} isAnimationActive={false} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={0} isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
              <p className={styles.legend}>
                <span><i className={styles.keyIncome} /> Income</span>
                <span><i className={styles.keyExpenses} /> Expenses</span>
              </p>
              <table className={ledger.table}>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className={ledger.amount}>Income</th>
                    <th scope="col" className={ledger.amount}>Expenses</th>
                    <th scope="col" className={ledger.amount}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.map((month) => (
                    <tr key={month.month}>
                      <td>{month.month}</td>
                      <td className={ledger.amount}>{currency.format(month.income)}</td>
                      <td className={ledger.amount}>{currency.format(month.expenses)}</td>
                      <td className={ledger.amount}>{signed(month.income - month.expenses)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className={styles.totalLabel}>Total</th>
                    <td className={`${ledger.amount} ${styles.total}`}>{currency.format(cashflow.reduce((sum, month) => sum + month.income, 0))}</td>
                    <td className={`${ledger.amount} ${styles.total}`}>{currency.format(cashflow.reduce((sum, month) => sum + month.expenses, 0))}</td>
                    <td className={`${ledger.amount} ${styles.total}`}>{signed(cashflow.reduce((sum, month) => sum + month.income - month.expenses, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          ) : (
            <p className={ledger.empty}>No data for this period.</p>
          )}
        </section>

        </div>
        <div className={ledger.col}>
        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Expenses by category</h2>
            <p>{categories.length ? currency.format(categories.reduce((sum, category) => sum + category.amount, 0)) : ""}</p>
          </header>
          {categories.length ? (
            <ul className={ledger.list}>
              {categories.map((category) => (
                <li key={category.name} className={styles.category}>
                  <span>{category.name}</span>
                  <span className={ledger.line} role="presentation"><i style={{ width: `${category.share}%` }} /></span>
                  <span className={styles.figure}>{currency.format(category.amount)}</span>
                  <span className={`${styles.figure} ${ledger.muted}`}>{category.share}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={ledger.empty}>No expenses for this period.</p>
          )}
        </section>

        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Goals</h2>
          </header>
          {goals.length ? (
            <ul className={ledger.list}>
              {goals.map((goal) => {
                const progress = goal.target ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;

                return (
                  <li key={goal.name} className={styles.category}>
                    <span>{goal.name}</span>
                    <span className={ledger.line} role="presentation"><i style={{ width: `${progress}%` }} /></span>
                    <span className={styles.figure}>{currency.format(goal.saved)} of {currency.format(goal.target)}</span>
                    <span className={`${styles.figure} ${ledger.muted}`}>{progress}%</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={ledger.empty}>No goals yet.</p>
          )}
        </section>

        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Receipts</h2>
          </header>
          <dl className={ledger.definitions}>
            <div>
              <dt>Approved</dt>
              <dd><LoadingText loading={loading}>{kpis.reviewed}</LoadingText></dd>
            </div>
            <div>
              <dt>Pending review</dt>
              <dd><LoadingText loading={loading}>{kpis.review}</LoadingText></dd>
            </div>
            <div>
              <dt>Unassigned</dt>
              <dd><LoadingText loading={loading}>{kpis.unassigned}</LoadingText></dd>
            </div>
            <div>
              <dt>Cash counts matching</dt>
              <dd><LoadingText loading={loading}>{kpis.reconciliation}</LoadingText></dd>
            </div>
          </dl>
        </section>

        <section className={ledger.section}>
          <header className={ledger.sectionHeader}>
            <h2>Export</h2>
            <p>Download current data as CSV.</p>
          </header>
          <div className={styles.exports}>
            <button type="button" className={ledger.secondaryButton} onClick={() => void prepareExport("Excel")}>
              Export all data
            </button>
            <button type="button" className={ledger.secondaryButton} onClick={() => void prepareExport("Review log")}>
              Export review log
            </button>
          </div>
          <p className={ledger.notice} aria-live="polite">{exportMessage}</p>
        </section>
        </div>
      </div>
    </section>
  );
}
