"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  function focusOption(index: number) {
    const optionCount = optionRefs.current.length;
    if (!optionCount) return;
    optionRefs.current[(index + optionCount) % optionCount]?.focus();
  }

  function openAndFocusSelected() {
    setOpen(true);
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    requestAnimationFrame(() => focusOption(selectedIndex));
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`ui-dropdown ${className}`}>
      {label ? <span className="ui-dropdown-label">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className="ui-dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          openAndFocusSelected();
        }}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div
          className={`ui-dropdown-menu ${placement === "top" ? "ui-dropdown-menu-top" : ""}`}
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            const currentIndex = optionRefs.current.findIndex(
              (option) => option === document.activeElement,
            );
            if (event.key === "ArrowDown") {
              event.preventDefault();
              focusOption(currentIndex + 1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              focusOption(currentIndex - 1);
            } else if (event.key === "Home") {
              event.preventDefault();
              focusOption(0);
            } else if (event.key === "End") {
              event.preventDefault();
              focusOption(options.length - 1);
            }
          }}
        >
          {options.map((option, index) => (
            <button
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
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
