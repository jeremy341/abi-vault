import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import { isValidFutureExpiry } from "@/lib/card-format";

export const saveFailedMessage = "The cash register could not be saved.";

export const expiryErrorMessage = "Enter a future date as MM/YY.";

export type CardFormValues = Omit<AccountCardDetails, "color">;

export type CardFormErrors = Partial<Record<keyof CardFormValues, string>>;

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
    errors.expiry = expiryErrorMessage;
  }

  return errors;
}

export function hasCardErrors(errors: CardFormErrors) {
  return Object.keys(errors).length > 0;
}
