export function formatReceiptDate(dateText: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateText);

  if (!match) return dateText;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  if (Number.isNaN(date.getTime())) return dateText;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
