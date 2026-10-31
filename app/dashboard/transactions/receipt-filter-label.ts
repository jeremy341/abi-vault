import type { ReceiptFilter } from "@/features/finance/transactions/view-model";

export function receiptFilterLabel(value: ReceiptFilter) {
  if (value === "Vorhanden") {
    return "Present";
  }

  if (value === "Fehlt") {
    return "Missing";
  }

  return value;
}
