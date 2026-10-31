"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./receipts.module.css";
import type { TransactionOption } from "@/features/receipts/view-model";

function amountClassName(amount: string) {
  if (amount.startsWith("+")) return styles.positive;

  return styles.negative;
}

export function ReceiptTransactionCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly TransactionOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);
  const searchTerm = search.trim().toLowerCase();

  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.date} ${option.amount}`
      .toLowerCase()
      .includes(searchTerm),
  );

  return (
    <label className={dlg.field}>
      <span>Transaction</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={styles.comboboxTrigger}
              aria-expanded={open}
              aria-label="Select transaction"
            />
          }
        >
          <span>{selected?.label || "Select transaction"}</span>
          <ChevronsUpDown aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionAvoidance={{
            side: "shift",
            align: "shift",
            fallbackAxisSide: "none",
          }}
          className={styles.comboboxContent}
        >
          <label className={styles.comboboxSearch}>
            <Search aria-hidden="true" />
            <span className="sr-only">Search transactions</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, date or amount"
            />
          </label>
          <div
            className={styles.comboboxList}
            role="listbox"
            aria-label="Available transactions"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value || "unassigned"}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={styles.comboboxOption}
                  onClick={() => {
                    onChange(option.value);

                    setSearch("");

                    setOpen(false);
                  }}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.date ? (
                      <small>{option.date}</small>
                    ) : (
                      <small>Assign receipt later</small>
                    )}
                  </span>
                  {option.amount ? (
                    <b className={amountClassName(option.amount)}>
                      {option.amount}
                    </b>
                  ) : null}
                  {option.value === value ? (
                    <Check
                      className={styles.comboboxCheck}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ))
            ) : (
              <p className={styles.comboboxEmpty}>No matching transactions.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}
