import { z } from "zod";

export const transferSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid(),
  amount: z.string().trim().min(1),
  note: z.string().trim().max(1000).optional(),
});
