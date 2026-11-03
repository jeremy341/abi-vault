"use client";

import { StyledDropdown } from "./TransactionControls";
import styles from "./transactions.module.css";
import ledger from "../ledger.module.css";
import type { FilterType } from "@/features/finance/transactions/view-model";

type TransactionsToolbarProps = {
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  categoryOptions: string[];
  onCategoryChange: (value: string) => void;
  type: string;
  onTypeChange: (value: "All" | FilterType) => void;
  dateLabel: string;
  onOpenDateDialog: () => void;
  activeFilterCount: number;
  onOpenFilterDialog: () => void;
};

export function TransactionsToolbar({
  loading,
  query,
  onQueryChange,
  category,
  categoryOptions,
  onCategoryChange,
  type,
  onTypeChange,
  dateLabel,
  onOpenDateDialog,
  activeFilterCount,
  onOpenFilterDialog,
}: TransactionsToolbarProps) {
  function changeType(value: string) {
    if (value === "All" || value === "Income" || value === "Expenses") {
      onTypeChange(value);
    }
  }

  return (
    <div className={`${ledger.toolbar} ${ledger.toolbarWide}`}>
      <label className={ledger.searchField}>
        <span className="sr-only">Search transactions</span>
        <input
          value={query}
          disabled={loading}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search transactions"
        />
      </label>
      <StyledDropdown
        ariaLabel="Select category"
        value={category}
        onChange={onCategoryChange}
        className={styles.filterDropdown}
        options={[
          { value: "All", label: "All categories" },
          ...categoryOptions.map((value) => ({ value, label: value })),
        ]}
      />
      <StyledDropdown
        ariaLabel="Select type"
        value={type}
        onChange={changeType}
        className={styles.filterDropdown}
        options={[
          { value: "All", label: "All types" },
          { value: "Income", label: "Income" },
          { value: "Expenses", label: "Expenses" },
        ]}
      />
      <button
        type="button"
        className={ledger.secondaryButton}
        onClick={onOpenDateDialog}
      >
        {dateLabel}
      </button>
      <button type="button" className={ledger.secondaryButton} onClick={onOpenFilterDialog}>
        {activeFilterCount ? `Filters (${activeFilterCount})` : "Filters"}
      </button>
    </div>
  );
}
