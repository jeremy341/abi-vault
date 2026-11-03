import type { Receipt } from "@/features/receipts/view-model";

export function matchesSearch(receipt: Receipt, searchTerm: string) {
  if (!searchTerm) return true;
  const text = `${receipt.file} ${receipt.transaction}`.toLowerCase();

  return text.includes(searchTerm);
}
