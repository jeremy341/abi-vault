import { z } from "zod";

export const cashCountSchema = z.object({
  walletId: z.string().uuid(),
  countedAmount: z.string().trim().min(1),
  auditor: z.string().trim().max(160).optional(),
  note: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().trim().min(16).max(128),
});
