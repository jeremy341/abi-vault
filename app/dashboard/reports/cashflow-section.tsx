import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ledger from "../ledger.module.css";
import styles from "./reports.module.css";
import { Snapshot, currency, signed } from "./report-helpers";

const chartConfig = {
  income: { label: "Income", color: "var(--ink)" },
  expenses: { label: "Expenses", color: "var(--control)" },
} satisfies ChartConfig;

function formatAxisTick(amount: number) {
  if (amount >= 1000) {
    return `$${(amount / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  }

  return `$${amount}`;
}

function cashflowTotals(cashflow: Snapshot["cashflow"]) {
  let income = 0;
  let expenses = 0;
  let net = 0;

  for (const month of cashflow) {
    income += month.income;
    expenses += month.expenses;
    net = net + month.income - month.expenses;
  }

  return { income, expenses, net };
}

export function CashflowSection({ cashflow }: { cashflow: Snapshot["cashflow"] }) {
  const totals = cashflowTotals(cashflow);

  return (
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
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={formatAxisTick} />
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
                <td className={`${ledger.amount} ${styles.total}`}>{currency.format(totals.income)}</td>
                <td className={`${ledger.amount} ${styles.total}`}>{currency.format(totals.expenses)}</td>
                <td className={`${ledger.amount} ${styles.total}`}>{signed(totals.net)}</td>
              </tr>
            </tfoot>
          </table>
        </>
      ) : (
        <p className={ledger.empty}>No data for this period.</p>
      )}
    </section>
  );
}
