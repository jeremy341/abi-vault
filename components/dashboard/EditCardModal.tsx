"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import AccountCard, {
  type AccountCardDetails,
} from "@/components/dashboard/AccountCard";
import {
  CardColorPicker,
  type CardFormErrors,
  type CardFormValues,
  Field,
  cardColors,
  focusFirstInvalidField,
  formatCardNumber,
  formatExpiry,
  getCardErrors,
  hasCardErrors,
  hasExpiryInputError,
  inputClassName,
  saveFailedMessage,
  useCardModalFocus,
} from "@/components/dashboard/card-modal-shared";
import { Input } from "@/components/ui/input";
import { filterLetters } from "@/lib/card-format";
import dlg from "./dialog.module.css";
import styles from "./AccountCardModal.module.css";

type EditCardModalProps = {
  open: boolean;
  card: Partial<AccountCardDetails> | null;
  onClose: () => void;
  onSave: (details: AccountCardDetails) => Promise<boolean>;
  onDelete: () => void;
};

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
  const [values, setValues] = useState<CardFormValues>({
    accountName: card?.accountName ?? "",
    cardNumber: card?.cardNumber ?? "",
    holder: card?.holder ?? "",
    expiry: card?.expiry ?? "",
  });
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useCardModalFocus(open, formRef, onClose);

  if (!open || !card || typeof document === "undefined") return null;

  function updateValue(field: keyof CardFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleExpiryChange(value: string) {
    updateValue("expiry", formatExpiry(value));

    if (hasExpiryInputError(value)) {
      setErrors((current) => ({
        ...current,
        expiry: "Enter a future date as MM/YY.",
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!validate()) return;
    setSaving(true);
    setSubmitError("");

    try {
      const saved = await onSave({ ...values, color: selectedColor });

      if (!saved) {
        setSubmitError(saveFailedMessage);
      }
    } catch {
      setSubmitError(saveFailedMessage);
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

          <CardColorPicker
            idPrefix="edit-card"
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />

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
                  className={inputClassName(errors.accountName)}
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
                  className={inputClassName(errors.cardNumber)}
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
                  className={inputClassName(errors.holder)}
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
                  className={inputClassName(errors.expiry)}
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
