import type { Receipt } from "@/features/receipts/view-model";
import ledger from "../ledger.module.css";

export function statusClassName(status: Receipt["status"]) {
  if (status === "Approved") return ledger.muted;

  if (status === "Invalid") return ledger.invalid;

  return ledger.attention;
}
