import { z } from "zod";

export const cashCountSchema = z.object({
  walletId: z.string().uuid(),
  countedAmount: z.string().trim().min(1),
  note: z.string().trim().max(1000).optional(),
});
