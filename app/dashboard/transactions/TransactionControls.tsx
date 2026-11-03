"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  FieldDropdown,
  type FieldDropdownOption,
} from "@/components/ui/field-dropdown";
import styles from "./transactions.module.css";

export function StyledDropdown({
  ariaLabel,
  label,
  value,
  options,
  onChange,
  className = "",
  placement = "bottom",
}: {
  ariaLabel: string;
  label?: string;
  value: string;
  options: readonly FieldDropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  placement?: "bottom" | "top";
}) {
  return (
    <FieldDropdown
      ariaLabel={ariaLabel}
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      className={className}
      placement={placement}
    />
  );
}

export function CashRegisterCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value);
  const searchText = query.trim().toLowerCase();
  const filtered = options.filter((option) => option.name.toLowerCase().includes(searchText));

  function chooseOption(optionId: string) {
    onChange(optionId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={styles.formField}>
      <span>Cash register</span>
      <div className={styles.cashRegisterCombobox}>
        <button
          type="button"
          className={styles.cashRegisterTrigger}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Cash register: ${selected?.name ?? "none selected"}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selected?.name ?? "Select cash register"}</span>
          <ChevronDown aria-hidden="true" className={styles.comboChevron} />
        </button>
        {open ? (
          <div className={styles.cashRegisterMenu}>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cash registers"
              aria-label="Search cash registers"
            />
            <div role="listbox" aria-label="Cash registers">
              {filtered.length ? (
                filtered.map((option) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === value}
                    key={option.id}
                    onClick={() => chooseOption(option.id)}
                  >
                    {option.name}
                  </button>
                ))
              ) : (
                <span className={styles.cashRegisterEmpty}>No cash registers found.</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
