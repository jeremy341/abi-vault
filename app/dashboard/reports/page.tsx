"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import { LoadingStatus, LoadingText } from "@/components/ui/loading-state";
import { getReportKpisForCurrentOrganization } from "@/features/finance/actions/queries";
import { useReportSnapshot } from "@/hooks/use-report-snapshot";
import { cachedFinanceQuery, financeScope } from "@/lib/finance/client-cache";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { CashflowSection } from "./cashflow-section";
import { CategoriesSection } from "./categories-section";
import { ExportSection } from "./export-section";
import { GoalsSection } from "./goals-section";
import { ReceiptsSection } from "./receipts-section";
import { Kpis, LOAD_FAILED_MESSAGE, NOT_REVIEWED_YET, formatMinor, formatSignedMinor } from "./report-helpers";

export default function ReportsPage() {
  const { userId, orgId } = useAppAuth();
  const cacheScope = financeScope(orgId, userId);
  const { snapshot, loading: snapshotLoading, error: snapshotError } = useReportSnapshot();
  const cashflow = snapshot?.cashflow ?? [];
  const categories = snapshot?.categories ?? [];
  const goals = snapshot?.goals ?? [];
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [kpis, setKpis] = useState<Kpis>({
    liquidity: "$0.00",
    expenses: "$0.00",
    net: "$0.00",
    review: "0",
    reviewed: "0",
    unassigned: "0",
    reconciliation: NOT_REVIEWED_YET,
  });
  const loading = snapshotLoading || kpiLoading;
  const error = snapshotError ?? kpiError;
  useEffect(() => {
    let active = true;
    cachedFinanceQuery("report-kpis", getReportKpisForCurrentOrganization, { scope: cacheScope })
      .then((reportKpis) => {
        if (!active) return;

        if (!reportKpis.ok) {
          setKpiError(LOAD_FAILED_MESSAGE);

          return;
        }

        setKpis({
          liquidity: formatMinor(reportKpis.liquidMinor),
          expenses: formatMinor(reportKpis.expenseMinor),
          net: formatSignedMinor(reportKpis.netMinor),
          review: String(reportKpis.reviewCount),
          reviewed: String(reportKpis.reviewedReceiptCount),
          unassigned: String(reportKpis.unassignedReceiptCount),
          reconciliation: reportKpis.reconciliationPercent === null ? NOT_REVIEWED_YET : `${reportKpis.reconciliationPercent}%`,
        });
      })
      .catch(() => {
        if (active) setKpiError(LOAD_FAILED_MESSAGE);
      })
      .finally(() => {
        if (active) setKpiLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheScope]);

  return (
    <section className={ledger.page} aria-busy={loading}>
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
          <CashflowSection cashflow={cashflow} />
        </div>
        <div className={ledger.col}>
          <CategoriesSection categories={categories} />
          <GoalsSection goals={goals} />
          <ReceiptsSection loading={loading} kpis={kpis} />
          <ExportSection />
        </div>
      </div>
    </section>
  );
}
