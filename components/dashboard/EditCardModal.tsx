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
} from "@/lib/card-format";
import dlg from "./dialog.module.css";
import styles from "./AccountCardModal.module.css";

const cardColors = [
  { name: "Charcoal", value: "#242426" },
  { name: "Graphite", value: "#3b3b40" },
  { name: "White", value: "#e9e9e7" },
  { name: "Forest", value: "#25453b" },
  { name: "Burgundy", value: "#542f38" },
  { name: "Navy", value: "#26364d" },
  { name: "Sand", value: "#9a8d78" },
  { name: "Terracotta", value: "#8b5142" },
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
        expiry: "Enter a future date as MM/YY.",
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;
    const nextErrors: FormErrors = {};

    if (!values.accountName.trim()) {
      nextErrors.accountName = "Enter a name for the cash register.";
    }

    if (values.cardNumber.replace(/\D/g, "").length !== 16) {
      nextErrors.cardNumber = "The register number needs 16 digits.";
    }

    if (!values.holder.trim()) {
      nextErrors.holder = "Enter the person responsible.";
    }

    if (!isValidFutureExpiry(values.expiry)) {
      nextErrors.expiry = "Enter a future date as MM/YY.";
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

      if (!saved) setSubmitError("The cash register could not be saved.");
    } catch {
      setSubmitError("The cash register could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className={dlg.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        className={dlg.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-card-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2 id="edit-card-title">Edit cash register</h2>
            <p>Change the name, responsible person or color of this cash register.</p>
          </div>
          <button
            type="button"
            className={dlg.closeButton}
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={dlg.body}>
          <div className={styles.preview} aria-label="Preview">
            <AccountCard
              cardColor={selectedColor}
              details={{
                ...values,
                accountName: values.accountName || "Cash register",
              }}
            />
          </div>

          <section className={dlg.section} aria-labelledby="edit-card-colors">
            <h3 id="edit-card-colors" className={dlg.sectionTitle}>
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
                  style={
                    { "--swatch": color.value } as React.CSSProperties
                  }
                  onClick={() => setSelectedColor(color.value)}
                />
              ))}
            </div>
          </section>

          <section
            className={dlg.section}
            aria-labelledby="edit-card-information"
          >
            <h3 id="edit-card-information" className={dlg.sectionTitle}>
              Details
            </h3>
            <div className={dlg.formGrid}>
              <Field
                label="Cash register name"
                error={errors.accountName}
                errorId="edit-account-name-error"
              >
                <Input
                  className={`${dlg.input} ${errors.accountName ? dlg.inputInvalid : ""}`}
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
                  placeholder="For example, drinks"
                />
              </Field>
              <Field
                label="Register number"
                error={errors.cardNumber}
                errorId="edit-card-number-error"
              >
                <Input
                  className={`${dlg.input} ${errors.cardNumber ? dlg.inputInvalid : ""}`}
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
                label="Responsible person"
                error={errors.holder}
                errorId="edit-holder-error"
              >
                <Input
                  className={`${dlg.input} ${errors.holder ? dlg.inputInvalid : ""}`}
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
                  placeholder="First and last name"
                />
              </Field>
              <Field
                label="Valid until"
                error={errors.expiry}
                errorId="edit-expiry-error"
              >
                <Input
                  className={`${dlg.input} ${errors.expiry ? dlg.inputInvalid : ""}`}
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

        {submitError ? <p className={dlg.dialogError} role="alert">{submitError}</p> : null}

        <footer className={`${dlg.footer} ${dlg.footerSplit}`}>
          <button
            type="button"
            className={dlg.destructiveButton}
            onClick={onDelete}
            disabled={saving}
          >
            Archive cash register
          </button>
          <div className={dlg.footerActions}>
            <button
              type="button"
              className={dlg.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
              {saving ? "Saving" : "Save changes"}
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
    <label className={dlg.field}>
      <span>{label}</span>
      {children}
      <span id={errorId} className={dlg.fieldError} aria-live="polite">
        {error || "\u00a0"}
      </span>
    </label>
  );
}
