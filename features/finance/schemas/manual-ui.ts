import { z } from "zod";
import { parseDollarToMinor } from "@/lib/finance/money";

export const manualUiTransactionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  amount: z.string().trim().min(1),
  direction: z.enum(["income", "expense"]),
  categoryName: z.string().trim().min(1).max(80),
  walletId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export function parseManualUiAmount(value: string) {
  const amount = parseDollarToMinor(value);
  if (amount <= BigInt(0)) throw new Error("INVALID_AMOUNT");
  return amount;
}
