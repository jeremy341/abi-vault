export function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return "";
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
