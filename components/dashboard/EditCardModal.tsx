"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import { Input } from "@/components/ui/input";
import {
  filterLetters,
  isValidFutureExpiry,
  previewCardNumber,
} from "@/lib/card-format";
import styles from "./AccountCardModal.module.css";

const cardColors = [
  { name: "Schwarz", value: "#111114" },
  { name: "Graphit", value: "#3b3b40" },
  { name: "White", value: "#e9e9e7" },
  { name: "Forest green", value: "#25453b" },
  { name: "Burgunder", value: "#542f38" },
  { name: "Navy", value: "#26364d" },
  { name: "Sand", value: "#9a8d78" },
  { name: "Terrakotta", value: "#8b5142" },
];

type EditCardModalProps = {
  open: boolean;
  card: Partial<AccountCardDetails> | null;
  onClose: () => void;
  onSave: (details: AccountCardDetails) => Promise<boolean>;
  onDelete: () => void;
};

type FormValues = Omit<AccountCardDetails, "color">;
type FormErrors = Partial<Record<keyof FormValues, string>>;

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

export default function EditCardModal({
  open,
  card,
  onClose,
  onSave,
  onDelete,
}: EditCardModalProps) {
  const [selectedColor, setSelectedColor] = useState(
    card?.color ?? cardColors[0].value,
  );
  const [values, setValues] = useState<FormValues>({
    accountName: card?.accountName ?? "",
    cardNumber: card?.cardNumber ?? "",
    holder: card?.holder ?? "",
    expiry: card?.expiry ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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
      if (event.key === "Escape") onClose();
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
  }, [onClose, open]);

  if (!open || !card || typeof document === "undefined") return null;

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleExpiryChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const month = digits.slice(0, 2);
    const invalidMonth =
      (digits.length > 0 && !["0", "1"].includes(digits[0])) ||
      (month.length === 2 && (month === "00" || Number(month) > 12));
    const next = formatExpiry(value);

    updateValue("expiry", next);
    if (invalidMonth || (next.length === 5 && !isValidFutureExpiry(next))) {
      setErrors((current) => ({
        ...current,
        expiry: "Invalides Expiry date.",
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextErrors: FormErrors = {};

    if (!values.accountName.trim()) {
      nextErrors.accountName = "Bitte einen Cash registersnamen eingeben.";
    }
    if (values.cardNumber.replace(/\D/g, "").length !== 16) {
      nextErrors.cardNumber = "Die Card number muss 16 Ziffern enthalten.";
    }
    if (!values.holder.trim()) {
      nextErrors.holder = "Bitte den Card holder eingeben.";
    }
    if (!isValidFutureExpiry(values.expiry)) {
      nextErrors.expiry = "Invalides Expiry date.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setSaving(true);
    setSubmitError("");
    try {
      const saved = await onSave({ ...values, color: selectedColor });
      if (!saved) setSubmitError("Die Cash register konnte nicht gespeichert werden.");
    } catch {
      setSubmitError("Die Cash register konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-card-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id="edit-card-title">Kartendaten bearbeiten</h2>
            <p>Name und Kartendarstellung dieser Cash register aktualisieren.</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close dialog"
            onClick={onClose}
            disabled={saving}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.preview} aria-label="Card preview">
            <AccountCard
              cardColor={selectedColor}
              details={{
                ...values,
                accountName: values.accountName || "Cash register",
                cardNumber: values.cardNumber || previewCardNumber,
                holder: values.holder || "Mike Smith",
                expiry: values.expiry || "06/21",
              }}
            />
          </div>

          <section className={styles.section} aria-labelledby="edit-card-colors">
            <h3 id="edit-card-colors" className={styles.sectionTitle}>
              Card color
            </h3>
            <div className={styles.colorOptions}>
              {cardColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={styles.colorOption}
                  aria-label={`${color.name} auswählen`}
                  aria-pressed={selectedColor === color.value}
                  style={
                    { "--swatch": color.value } as React.CSSProperties
                  }
                  onClick={() => setSelectedColor(color.value)}
                />
              ))}
            </div>
          </section>

          <section
            className={styles.section}
            aria-labelledby="edit-card-information"
          >
            <h3 id="edit-card-information" className={styles.sectionTitle}>
              Card information
            </h3>
            <div className={styles.formGrid}>
              <Field
                label="Cash registersname"
                error={errors.accountName}
                errorId="edit-account-name-error"
              >
                <Input
                  className={`${styles.input} ${errors.accountName ? styles.inputInvalid : ""}`}
                  name="accountName"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(errors.accountName)}
                  aria-describedby="edit-account-name-error"
                  maxLength={20}
                  value={values.accountName}
                  onChange={(event) =>
                    updateValue(
                      "accountName",
                      filterLetters(event.target.value, 20),
                    )
                  }
                  placeholder="For example, drinks cash register"
                />
              </Field>
              <Field
                label="Card number"
                error={errors.cardNumber}
                errorId="edit-card-number-error"
              >
                <Input
                  className={`${styles.input} ${errors.cardNumber ? styles.inputInvalid : ""}`}
                  name="cardNumber"
                  autoComplete="off"
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(errors.cardNumber)}
                  aria-describedby="edit-card-number-error"
                  maxLength={19}
                  value={values.cardNumber}
                  onChange={(event) =>
                    updateValue(
                      "cardNumber",
                      formatCardNumber(event.target.value),
                    )
                  }
                  placeholder="1234 5678 9012 3456"
                />
              </Field>
              <Field
                label="Card holder"
                error={errors.holder}
                errorId="edit-holder-error"
              >
                <Input
                  className={`${styles.input} ${errors.holder ? styles.inputInvalid : ""}`}
                  name="holder"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.holder)}
                  aria-describedby="edit-holder-error"
                  maxLength={20}
                  value={values.holder}
                  onChange={(event) =>
                    updateValue(
                      "holder",
                      filterLetters(event.target.value, 20),
                    )
                  }
                  placeholder="Vor- und Nachname"
                />
              </Field>
              <Field
                label="Expiry date"
                error={errors.expiry}
                errorId="edit-expiry-error"
              >
                <Input
                  className={`${styles.input} ${errors.expiry ? styles.inputInvalid : ""}`}
                  name="expiry"
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(errors.expiry)}
                  aria-describedby="edit-expiry-error"
                  maxLength={5}
                  value={values.expiry}
                  onChange={(event) => handleExpiryChange(event.target.value)}
                  placeholder="MM/YY"
                />
              </Field>
            </div>
          </section>
        </div>

        {submitError ? <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{submitError}</p> : null}

        <footer className={`${styles.footer} ${styles.footerSplit}`}>
          <button
            type="button"
            className={styles.destructiveButton}
            onClick={onDelete}
            disabled={saving}
          >
            Archive cash register
          </button>
          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving} aria-busy={saving}>
              {saving ? "Saving …" : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function Field({
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
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      <span id={errorId} className={styles.fieldError} aria-live="polite">
        {error || "\u00a0"}
      </span>
    </label>
  );
}
