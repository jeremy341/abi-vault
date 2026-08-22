"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export type FieldDropdownOption = {
  value: string;
  label: string;
};

type FieldDropdownProps = {
  ariaLabel: string;
  label?: string;
  value: string;
  options: readonly FieldDropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  placement?: "bottom" | "top";
};

export function FieldDropdown({
  ariaLabel,
  label,
  value,
  options,
  onChange,
  className = "",
  placement = "bottom",
}: FieldDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={`ui-dropdown ${className}`}>
      {label ? <span className="ui-dropdown-label">{label}</span> : null}
      <button
        type="button"
        className="ui-dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div
          className={`ui-dropdown-menu ${placement === "top" ? "ui-dropdown-menu-top" : ""}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`ui-dropdown-option ${option.value === value ? "ui-dropdown-option-active" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
