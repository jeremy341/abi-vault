type ProviderAmount = { amount?: string; currency?: string };

export type ProviderTransaction = {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount?: ProviderAmount;
  remittanceInformationUnstructured?: string[];
  creditorName?: string;
  debtorName?: string;
};

function toMinor(value: string) {
  const normalized = value.trim().replace(",", ".");
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = "0", decimals = ""] = unsigned.split(".");
  const minor = BigInt(whole || "0") * BigInt(100) + BigInt((decimals + "00").slice(0, 2));
  return negative ? -minor : minor;
}

export function normalizeGoCardlessTransaction(value: ProviderTransaction) {
  if (!value.transactionId || !value.bookingDate || !value.transactionAmount?.amount) return null;
  const amountMinor = toMinor(value.transactionAmount.amount);
  if (amountMinor === BigInt(0)) return null;
  const title = [
    ...(value.remittanceInformationUnstructured ?? []),
    value.creditorName,
    value.debtorName,
  ].filter(Boolean).join(" ").trim().slice(0, 200) || "Banktransaktion";
  return {
    externalTransactionId: value.transactionId,
    amountMinor,
    title,
    bookedAt: value.bookingDate,
    valueAt: value.valueDate ?? value.bookingDate,
  };
}
