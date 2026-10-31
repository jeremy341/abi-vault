import { useReportSnapshot } from "@/hooks/use-report-snapshot";

export type Snapshot = NonNullable<ReturnType<typeof useReportSnapshot>["snapshot"]>;

export type Goal = Snapshot["goals"][number];

export type Kpis = {
  liquidity: string;
  expenses: string;
  net: string;
  review: string;
  reviewed: string;
  unassigned: string;
  reconciliation: string;
};

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const MINUS = "−";

export const LOAD_FAILED_MESSAGE = "Review data could not be loaded.";

export const NOT_REVIEWED_YET = "Not reviewed yet";

export function signed(value: number) {
  const sign = value < 0 ? MINUS : "";

  return `${sign}${currency.format(Math.abs(value))}`;
}

export function formatMinor(minor: string | number) {
  return (Number(minor) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatSignedMinor(minor: string) {
  const net = Number(minor);
  const sign = net < 0 ? MINUS : "";

  return `${sign}${formatMinor(Math.abs(net))}`;
}
