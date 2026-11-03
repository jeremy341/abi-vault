export function receiptTypeLabel(receiptType: string | null): "PDF" | "PNG" | "JPG" {
  if (receiptType === "application/pdf") {
    return "PDF";
  }

  if (receiptType === "image/png") {
    return "PNG";
  }

  return "JPG";
}
