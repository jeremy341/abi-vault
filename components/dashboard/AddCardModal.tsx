"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import { CardColorPicker, cardColors } from "@/components/dashboard/card-color-picker";
import {
  formatCardNumber,
  formatExpiry,
  hasExpiryInputError,
} from "@/components/dashboard/card-form-format";
import {
  type CardFormErrors,
  type CardFormValues,
  expiryErrorMessage,
  getCardErrors,
  hasCardErrors,
  saveFailedMessage,
} from "@/components/dashboard/card-form-validation";
import {
  focusFirstInvalidField,
  useCardModalFocus,
} from "@/components/dashboard/card-modal-focus";
import { Field, inputClassName } from "@/components/dashboard/card-modal-field";
import { Input } from "@/components/ui/input";
import { filterLetters } from "@/lib/card-format";
import dlg from "./dialog.module.css";
import styles from "./AccountCardModal.module.css";

type AddCardModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (details: AccountCardDetails, idempotencyKey: string) => Promise<boolean>;
};

const initialValues: CardFormValues = {
  accountName: "",
  cardNumber: "",
  holder: "",
  expiry: "",
};

export default function AddCardModal({
  open,
  onClose,
  onSave,
}: AddCardModalProps) {
  const [selectedColor, setSelectedColor] = useState(cardColors[0].value);
  const [values, setValues] = useState<CardFormValues>(initialValues);
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useCardModalFocus(open, formRef, onClose);

  if (!open || typeof document === "undefined") return null;

  function updateValue(field: keyof CardFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleExpiryChange(value: string) {
    updateValue("expiry", formatExpiry(value));

    if (hasExpiryInputError(value)) {
      setErrors((current) => ({
        ...current,
        expiry: expiryErrorMessage,
      }));
    }
  }

  function validate() {
    const nextErrors = getCardErrors(values);
    setErrors(nextErrors);

    if (hasCardErrors(nextErrors)) {
      focusFirstInvalidField(formRef);
    }

    return !hasCardErrors(nextErrors);
  }

  function resetForm() {
    setValues(initialValues);
    setErrors({});
    idempotencyKey.current = null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!validate()) return;

    if (idempotencyKey.current === null) {
      idempotencyKey.current = `wallet-${crypto.randomUUID()}`;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const saved = await onSave(
        { ...values, color: selectedColor },
        idempotencyKey.current,
      );

      if (saved) {
        resetForm();
      } else {
        setSubmitError(saveFailedMessage);
      }
    } catch {
      setSubmitError(saveFailedMessage);
    } finally {
      setSaving(false);
    }
  }

  function renderNameField() {
    return (
      <Field
        label="Cash register name"
        error={errors.accountName}
        errorId="add-account-name-error"
      >
        <Input
          className={inputClassName(errors.accountName)}
          name="accountName"
          autoComplete="off"
          required
          aria-invalid={Boolean(errors.accountName)}
          aria-describedby="add-account-name-error"
          maxLength={26}
          value={values.accountName}
          onChange={(event) =>
            updateValue("accountName", filterLetters(event.target.value, 26))
          }
          placeholder="For example, drinks"
        />
      </Field>
    );
  }

  function renderNumberField() {
    return (
      <Field
        label="Register number"
        error={errors.cardNumber}
        errorId="add-card-number-error"
      >
        <Input
          className={inputClassName(errors.cardNumber)}
          name="cardNumber"
          autoComplete="off"
          inputMode="numeric"
          required
          aria-invalid={Boolean(errors.cardNumber)}
          aria-describedby="add-card-number-error"
          maxLength={19}
          value={values.cardNumber}
          onChange={(event) =>
            updateValue("cardNumber", formatCardNumber(event.target.value))
          }
          placeholder="1234 5678 9012 3456"
        />
      </Field>
    );
  }

  function renderHolderField() {
    return (
      <Field
        label="Responsible person"
        error={errors.holder}
        errorId="add-holder-error"
      >
        <Input
          className={inputClassName(errors.holder)}
          name="holder"
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.holder)}
          aria-describedby="add-holder-error"
          maxLength={26}
          value={values.holder}
          onChange={(event) =>
            updateValue("holder", filterLetters(event.target.value, 26))
          }
          placeholder="First and last name"
        />
      </Field>
    );
  }

  function renderExpiryField() {
    return (
      <Field
        label="Valid until"
        error={errors.expiry}
        errorId="add-expiry-error"
      >
        <Input
          className={inputClassName(errors.expiry)}
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
    );
  }

  const previewName = values.accountName || "New cash register";

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
        aria-labelledby="add-card-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2 id="add-card-title">Add cash register</h2>
            <p>Give the cash register a name and a responsible person.</p>
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
              details={{ ...values, accountName: previewName }}
            />
          </div>

          <CardColorPicker
            idPrefix="add-card"
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />

          <section
            className={dlg.section}
            aria-labelledby="add-card-information"
          >
            <h3 id="add-card-information" className={dlg.sectionTitle}>
              Details
            </h3>
            <div className={dlg.formGrid}>
              {renderNameField()}
              {renderNumberField()}
              {renderHolderField()}
              {renderExpiryField()}
            </div>
          </section>
        </div>

        {submitError ? <p className={dlg.dialogError} role="alert">{submitError}</p> : null}

        <footer className={dlg.footer}>
          <button
            type="button"
            className={dlg.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className={dlg.primaryButton} disabled={saving} aria-busy={saving}>
            {saving ? "Adding" : "Add cash register"}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
