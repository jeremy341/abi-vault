import { useEffect, useRef } from "react";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import { isValidFutureExpiry } from "@/lib/card-format";
import dlg from "./dialog.module.css";
import styles from "./AccountCardModal.module.css";

export const cardColors = [
  { name: "Charcoal", value: "#242426" },
  { name: "Graphite", value: "#3b3b40" },
  { name: "White", value: "#e9e9e7" },
  { name: "Forest", value: "#25453b" },
  { name: "Burgundy", value: "#542f38" },
  { name: "Navy", value: "#26364d" },
  { name: "Sand", value: "#9a8d78" },
  { name: "Terracotta", value: "#8b5142" },
];

export const saveFailedMessage = "The cash register could not be saved.";

export type CardFormValues = Omit<AccountCardDetails, "color">;

export type CardFormErrors = Partial<Record<keyof CardFormValues, string>>;

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);

  return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

export function hasExpiryInputError(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  const month = digits.slice(0, 2);

  const invalidMonth =
    (digits.length > 0 && !["0", "1"].includes(digits[0])) ||
    (month.length === 2 && (month === "00" || Number(month) > 12));

  const next = formatExpiry(value);

  return invalidMonth || (next.length === 5 && !isValidFutureExpiry(next));
}

export function getCardErrors(values: CardFormValues) {
  const errors: CardFormErrors = {};

  if (!values.accountName.trim()) {
    errors.accountName = "Enter a name for the cash register.";
  }

  if (values.cardNumber.replace(/\D/g, "").length !== 16) {
    errors.cardNumber = "The register number needs 16 digits.";
  }

  if (!values.holder.trim()) {
    errors.holder = "Enter the person responsible.";
  }

  if (!isValidFutureExpiry(values.expiry)) {
    errors.expiry = "Enter a future date as MM/YY.";
  }

  return errors;
}

export function hasCardErrors(errors: CardFormErrors) {
  return Object.keys(errors).length > 0;
}

export function focusFirstInvalidField(formRef: {
  current: HTMLFormElement | null;
}) {
  window.requestAnimationFrame(() => {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  });
}

export function inputClassName(error: string | undefined) {
  return error ? `${dlg.input} ${dlg.inputInvalid}` : dlg.input;
}

export function useCardModalFocus(
  open: boolean,
  formRef: { current: HTMLFormElement | null },
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const form = formRef.current;

    const focusable = form?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const firstInput = form?.querySelector<HTMLElement>("input");

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => (firstInput ?? first)?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();

      if (event.key !== "Tab" || !first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);
}

export function CardColorPicker({
  idPrefix,
  selectedColor,
  onSelect,
}: {
  idPrefix: string;
  selectedColor: string;
  onSelect: (color: string) => void;
}) {
  const titleId = `${idPrefix}-colors`;

  return (
    <section className={dlg.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={dlg.sectionTitle}>
        Color
      </h3>
      <div className={styles.colorOptions}>
        {cardColors.map((color) => (
          <button
            key={color.value}
            type="button"
            className={styles.colorOption}
            aria-label={color.name}
            aria-pressed={selectedColor === color.value}
            style={{ "--swatch": color.value } as React.CSSProperties}
            onClick={() => onSelect(color.value)}
          />
        ))}
      </div>
    </section>
  );
}

export function Field({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <label className={dlg.field}>
      <span>{label}</span>
      {children}
      <span id={errorId} className={dlg.fieldError} aria-live="polite">
        {error || " "}
      </span>
    </label>
  );
}
