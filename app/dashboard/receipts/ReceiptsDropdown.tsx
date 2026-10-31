"use client";

import { FieldDropdown } from "@/components/ui/field-dropdown";
import styles from "./receipts.module.css";

export function ReceiptsDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const dropdownOptions = options.map((option) => ({
    value: option,
    label: option === "All" ? `${ariaLabel}: All` : option,
  }));

  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      value={value}
      options={dropdownOptions}
      onChange={onChange}
      className={styles.dropdown}
    />
  );
}
