"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BusFront,
  CircleDollarSign,
  FileText,
  Info,
  MoreHorizontal,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dashboardStyles from "@/app/dashboard/dashboard.module.css";

const transactions = [
  { title: "Druck Abizeitung", category: "Material", date: "12.05.2024", amount: "-320,00 €", tone: "violet", icon: FileText },
  { title: "Kuchenverkauf", category: "Sonstiges", date: "11.05.2024", amount: "+185,50 €", tone: "green", icon: Sparkles },
  { title: "Dekoration Abiball", category: "Veranstaltung", date: "08.05.2024", amount: "-184,90 €", tone: "orange", icon: Sparkles },
  { title: "Spende Eltern", category: "Sonstiges", date: "07.05.2024", amount: "+250,00 €", tone: "green", icon: CircleDollarSign },
  { title: "Busfahrt Abifahrt", category: "Veranstaltung", date: "05.05.2024", amount: "-1.200,00 €", tone: "violet", icon: BusFront },
  { title: "Mitgliedsbeitrag", category: "Sonstiges", date: "03.05.2024", amount: "+120,00 €", tone: "green", icon: CircleDollarSign },
  { title: "Druck Nachzahlung", category: "Material", date: "02.05.2024", amount: "-75,00 €", tone: "violet", icon: FileText },
  { title: "Dekoration Klassenraum", category: "Material", date: "30.04.2024", amount: "-96,40 €", tone: "orange", icon: Sparkles },
  { title: "Sponsoring Klassenfest", category: "Veranstaltung", date: "28.04.2024", amount: "+480,00 €", tone: "green", icon: CircleDollarSign },
];

const goals = [
  { title: "Abiball", target: "3.000 €", saved: "2.100 € gesammelt", progress: 70, date: "15.05.2026" },
  { title: "Abizeitung", target: "1.200 €", saved: "540 € gesammelt", progress: 45, date: "30.04.2026" },
  { title: "Reserve", target: "1.000 €", saved: "800 € gesammelt", progress: 80, date: "01.07.2026" },
];

const categories = [
  { title: "Veranstaltung", amount: "1.740,00 € von 3.000,00 €", progress: 58, color: "bg-black dark:bg-white", bubble: "bg-black/[0.04] text-ink dark:bg-white/[0.08]", icon: Sparkles },
  { title: "Material", amount: "384,90 € von 1.200,00 €", progress: 32, color: "bg-[var(--ui-positive)]", bubble: "bg-[var(--ui-positive-soft)] text-[var(--ui-positive)] dark:bg-green-500/15", icon: Package },
  { title: "Sonstiges", amount: "185,50 € von 1.000,00 €", progress: 10, color: "bg-[var(--ui-warning)]", bubble: "bg-[var(--ui-warning-soft)] text-[var(--ui-warning)] dark:bg-amber-500/15", icon: MoreHorizontal },
];

function IconBubble({ tone, children, className = "" }: { tone: string; children: React.ReactNode; className?: string }) {
  return <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone} ${className}`}>{children}</span>;
}

export function TransactionHistory() {
  return (
    <Card className={`${dashboardStyles.transactionPanel} h-full rounded-2xl bg-white/85 py-0 shadow-[0_12px_28px_rgb(0_0_0_/_0.07)] backdrop-blur-[3px] dark:bg-card/85`}>
      <CardHeader className="px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6">
        <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl">Transaktionsverlauf</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-5 lg:px-6 lg:pb-5">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(90px,0.9fr)_100px_110px_24px] gap-3 border-b border-black/10 px-2 pb-2 text-xs text-muted-foreground dark:border-white/15 sm:grid">
          <span />
          <span>Kategorie</span>
          <span>Datum</span>
          <span>Betrag</span>
          <span>Beleg</span>
        </div>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {transactions.map((transaction, index) => {
            const Icon = transaction.icon;
            const tone = transaction.tone === "green" ? "bg-[var(--ui-positive-soft)] text-[var(--ui-positive)] dark:bg-green-500/15" : transaction.tone === "orange" ? "bg-[var(--ui-orange-soft)] text-[var(--ui-orange)] dark:bg-orange-500/15" : "bg-[var(--ui-violet-soft)] text-[var(--ui-violet)] dark:bg-violet-500/15";
            return (
              <div key={transaction.title} className={`${index >= 6 ? dashboardStyles.landscapeSummaryHidden : ""} grid gap-2 px-2 py-3.5 text-sm sm:grid-cols-[minmax(0,1.5fr)_minmax(90px,0.9fr)_100px_110px_24px] sm:items-center sm:gap-3 min-[1280px]:max-[2199px]:py-3 min-[2200px]:min-h-10 min-[2200px]:py-3 ${index >= 7 ? "hidden min-[2200px]:grid" : ""} ${index >= transactions.length - 3 ? "min-[1280px]:max-[2199px]:hidden" : ""}`}>
                <div className="flex min-w-0 items-center gap-2.5 font-medium text-ink"><IconBubble tone={tone}><Icon className="size-4" /></IconBubble><span className="truncate">{transaction.title}</span></div>
                <span className="pl-10 text-xs text-muted-foreground sm:pl-0 sm:text-sm">{transaction.category}</span>
                <span className="ui-tabular pl-10 text-xs text-muted-foreground sm:pl-0 sm:text-sm">{transaction.date}</span>
                <span className={`whitespace-nowrap pl-10 font-medium tabular-nums sm:pl-0 ${transaction.amount.startsWith("+") ? "text-[var(--ui-positive)]" : "text-[var(--ui-negative)]"}`}>{transaction.amount}</span>
                <FileText className="hidden size-4 text-muted-foreground sm:block" />
              </div>
            );
          })}
        </div>
        <Link href="/dashboard/transactions" className="mt-4 inline-flex items-center gap-2 px-2 text-sm font-semibold text-ink transition-transform hover:translate-x-0.5 min-[1280px]:max-[2199px]:mt-2 min-[1280px]:max-[2199px]:translate-y-[13px]">
          Alle Transaktionen anzeigen <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function GoalsPanel() {
  return (
    <Card className={`${dashboardStyles.goalsPanel} rounded-2xl bg-white/85 py-0 shadow-[0_12px_28px_rgb(0_0_0_/_0.07)] backdrop-blur-[3px] dark:bg-card/85`}>
      <CardHeader className="flex-row items-center justify-between px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6">
        <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl">Ziele</CardTitle>
        <Link
          href="/dashboard/goals"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
        >
          Alle Ziele <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="overflow-visible px-4 pb-4 pt-4 sm:px-5 lg:px-6 lg:pb-5">
        <div className={`${dashboardStyles.goalGrid} grid min-w-0 grid-cols-3 gap-3`}>
          {goals.slice(0, 3).map((goal) => (
            <div key={goal.title} className={`${dashboardStyles.goalItem} rounded-xl border border-black/10 p-4 dark:border-white/15`}>
              <h3 className="font-semibold text-ink">{goal.title}</h3>
              <strong className="mt-3 block text-2xl font-semibold tracking-tight text-ink">{goal.target}</strong>
              <p className={`${dashboardStyles.goalSaved} mt-3 text-sm text-muted-foreground`}>{goal.saved}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.12]">
                  <div className="h-full rounded-full bg-ink dark:bg-white" style={{ width: `${goal.progress}%` }} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{goal.progress}%</span>
              </div>
              <p className={`${dashboardStyles.goalDate} mt-5 text-sm text-muted-foreground`}>Ziel: {goal.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SpendingByCategory() {
  return (
    <Card className={`${dashboardStyles.spendingPanel} rounded-2xl bg-white/85 py-0 shadow-[0_12px_28px_rgb(0_0_0_/_0.07)] backdrop-blur-[3px] dark:bg-card/85`}>
      <CardHeader className="px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6">
        <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl">Ausgaben nach Kategorie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-4 sm:px-6 lg:px-7 min-[1280px]:max-[2199px]:space-y-2 min-[1280px]:max-[2199px]:pt-2 min-[2200px]:space-y-1 min-[2200px]:pb-6 min-[2200px]:pt-1">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.title} className="grid min-h-12 grid-cols-[36px_minmax(90px,120px)_minmax(0,1fr)_40px] items-center gap-3 text-sm min-[1280px]:max-[2199px]:min-h-10 min-[2200px]:min-h-20 min-[2200px]:grid-cols-[40px_minmax(110px,140px)_minmax(0,1fr)_44px] min-[2200px]:gap-4 min-[2200px]:text-base">
              <IconBubble tone={category.bubble} className="min-[2200px]:size-10"><Icon className="size-4 min-[2200px]:size-5" /></IconBubble>
              <span className="font-medium text-ink">{category.title}</span>
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.12] min-[2200px]:h-3">
                  <div className={`h-full rounded-full ${category.color}`} style={{ width: `${category.progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground min-[2200px]:mt-1.5 min-[2200px]:text-sm">{category.amount}</p>
              </div>
              <span className="text-right text-sm text-muted-foreground min-[2200px]:text-base">{category.progress}%</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ReviewPanel() {
  return (
    <Card className={`${dashboardStyles.reviewPanel} rounded-2xl bg-white/85 py-0 shadow-[0_12px_28px_rgb(0_0_0_/_0.07)] backdrop-blur-[3px] dark:bg-card/85`}>
      <CardHeader className="px-5 pb-0 pt-5 sm:px-6 lg:px-7 lg:pt-6">
        <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl">Zu prüfen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-7 pt-2 sm:px-6 lg:px-7 min-[1280px]:max-[2199px]:pt-0">
        <Link href="/dashboard/receipts" className="flex items-center gap-3 rounded-lg border border-black/[0.08] px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.06]"><AlertTriangle className="size-5 text-[var(--ui-warning)]" /><span className="flex-1">3 Belege warten auf Prüfung</span><ArrowRight className="size-4" /></Link>
        <Link href="/dashboard/transactions" className="flex items-center gap-3 rounded-lg border border-black/[0.08] px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.06]"><Info className="size-5" /><span className="flex-1">1 Bargeldzahlung fehlt</span><ArrowRight className="size-4" /></Link>
        <Link href="/dashboard/receipts" className="hidden items-center gap-3 rounded-lg border border-black/[0.08] px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.03] min-[2200px]:flex min-[2200px]:py-3 dark:border-white/15 dark:hover:bg-white/[0.06]"><FileText className="size-5 text-muted-foreground" /><span className="flex-1">1 Beleg ohne Kategorie</span><ArrowRight className="size-4" /></Link>
        <Link href="/dashboard/transactions" className="mt-2 flex h-10 items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white transition-opacity hover:opacity-80 min-[2200px]:mt-3 min-[2200px]:h-12 dark:bg-white dark:text-black"><Plus className="size-5" /> Transaktion hinzufügen</Link>
      </CardContent>
    </Card>
  );
}
