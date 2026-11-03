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
    <div className={styles.exports}>
      <button type="button" className={ledger.secondaryButton} onClick={() => void prepareExport("Excel")}>
        Export data
      </button>
      <button type="button" className={ledger.secondaryButton} onClick={() => void prepareExport("Review log")}>
        Review log
      </button>
      <span className={styles.exportNote} aria-live="polite">{exportMessage}</span>
    </div>
  );
}
