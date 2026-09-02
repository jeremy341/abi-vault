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
  { name: "Weiß", value: "#e9e9e7" },
  { name: "Waldgrün", value: "#25453b" },
  { name: "Burgunder", value: "#542f38" },
  { name: "Navy", value: "#26364d" },
  { name: "Sand", value: "#9a8d78" },
  { name: "Terrakotta", value: "#8b5142" },
];

type AddCardModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (details: AccountCardDetails, idempotencyKey: string) => Promise<boolean>;
};

type FormValues = Omit<AccountCardDetails, "color">;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  accountName: "",
  cardNumber: "",
  holder: "",
  expiry: "",
};

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

export default function AddCardModal({
  open,
  onClose,
  onSave,
}: AddCardModalProps) {
  const [selectedColor, setSelectedColor] = useState(cardColors[0].value);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  if (!open || typeof document === "undefined") return null;

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
        expiry: "Ungültiges Ablaufdatum.",
      }));
    }
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!values.accountName.trim()) {
      nextErrors.accountName = "Bitte einen Kassennamen eingeben.";
    }
    if (values.cardNumber.replace(/\D/g, "").length !== 16) {
      nextErrors.cardNumber = "Die Kartennummer muss 16 Ziffern enthalten.";
    }
    if (!values.holder.trim()) {
      nextErrors.holder = "Bitte den Karteninhaber eingeben.";
    }
    if (!isValidFutureExpiry(values.expiry)) {
      nextErrors.expiry = "Ungültiges Ablaufdatum.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    }
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;

    idempotencyKey.current ??= `wallet-${crypto.randomUUID()}`;
    setSaving(true);
    setSubmitError("");
    try {
      const saved = await onSave(
        { ...values, color: selectedColor },
        idempotencyKey.current,
      );
      if (saved) {
        setValues(initialValues);
        setErrors({});
        idempotencyKey.current = null;
      } else {
        setSubmitError("Die Kasse konnte nicht gespeichert werden.");
      }
    } catch {
      setSubmitError("Die Kasse konnte nicht gespeichert werden.");
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
        aria-labelledby="add-card-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id="add-card-title">Kasse hinzufügen</h2>
            <p>Lege eine weitere Kasse mit eigener Kartendarstellung an.</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Dialog schließen"
            onClick={onClose}
            disabled={saving}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.preview} aria-label="Kartenvorschau">
            <AccountCard
              cardColor={selectedColor}
              details={{
                ...values,
                accountName: values.accountName || "Neue Kasse",
                cardNumber: values.cardNumber || previewCardNumber,
                holder: values.holder || "Mike Smith",
                expiry: values.expiry || "06/21",
              }}
            />
          </div>

          <section className={styles.section} aria-labelledby="add-card-colors">
            <h3 id="add-card-colors" className={styles.sectionTitle}>
              Kartenfarbe
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
            aria-labelledby="add-card-information"
          >
            <h3 id="add-card-information" className={styles.sectionTitle}>
              Karteninformationen
            </h3>
            <div className={styles.formGrid}>
              <Field
                label="Kassenname"
                error={errors.accountName}
                errorId="add-account-name-error"
              >
                <Input
                  className={`${styles.input} ${errors.accountName ? styles.inputInvalid : ""}`}
                  name="accountName"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(errors.accountName)}
                  aria-describedby="add-account-name-error"
                  maxLength={26}
                  value={values.accountName}
                  onChange={(event) =>
                    updateValue(
                      "accountName",
                      filterLetters(event.target.value, 26),
                    )
                  }
                  placeholder="Zum Beispiel Getränkekasse"
                />
              </Field>
              <Field
                label="Kartennummer"
                error={errors.cardNumber}
                errorId="add-card-number-error"
              >
                <Input
                  className={`${styles.input} ${errors.cardNumber ? styles.inputInvalid : ""}`}
                  name="cardNumber"
                  autoComplete="off"
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(errors.cardNumber)}
                  aria-describedby="add-card-number-error"
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
                label="Karteninhaber"
                error={errors.holder}
                errorId="add-holder-error"
              >
                <Input
                  className={`${styles.input} ${errors.holder ? styles.inputInvalid : ""}`}
                  name="holder"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.holder)}
                  aria-describedby="add-holder-error"
                  maxLength={26}
                  value={values.holder}
                  onChange={(event) =>
                    updateValue(
                      "holder",
                      filterLetters(event.target.value, 26),
                    )
                  }
                  placeholder="Vor- und Nachname"
                />
              </Field>
              <Field
                label="Ablaufdatum"
                error={errors.expiry}
                errorId="add-expiry-error"
              >
                <Input
                  className={`${styles.input} ${errors.expiry ? styles.inputInvalid : ""}`}
                  name="expiry"
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(errors.expiry)}
                  aria-describedby="add-expiry-error"
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

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Abbrechen
          </button>
          <button type="submit" className={styles.primaryButton} disabled={saving} aria-busy={saving}>
            {saving ? "Kasse wird gespeichert …" : "Kasse hinzufügen"}
          </button>
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
