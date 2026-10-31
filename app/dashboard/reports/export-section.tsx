import { useState } from "react";
import { exportManualFinanceReport } from "@/features/reports/actions/manual-export";
import ledger from "../ledger.module.css";
import styles from "./reports.module.css";

export function ExportSection() {
  const [exportMessage, setExportMessage] = useState("");

  async function prepareExport(format: "Excel" | "Review log") {
    const result = await exportManualFinanceReport(format);

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
  );
}
