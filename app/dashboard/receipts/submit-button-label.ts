import type { Receipt } from "@/features/receipts/view-model";

export function submitButtonLabel(saving: boolean, editingReceipt: Receipt | null) {
  if (editingReceipt) {
    return saving ? "Saving" : "Save changes";
  }

  return saving ? "Uploading" : "Add receipt";
}
