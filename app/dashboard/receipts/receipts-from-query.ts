import { toReceipt } from "@/features/receipts/view-model";
import type { ReceiptQueryData } from "./types";

export function receiptsFromQuery(data: ReceiptQueryData) {
  return data.items.map(toReceipt);
}
