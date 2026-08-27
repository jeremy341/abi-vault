import { z } from "zod";

export const transactionCorrectionSchema = z.object({
  transactionId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  amount: z.string().trim().min(1),
  direction: z.enum(["income", "expense"]),
  categoryName: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export const transactionArchiveSchema = z.object({
  transactionId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export type TransactionCorrectionInput = z.input<typeof transactionCorrectionSchema>;
export type TransactionArchiveInput = z.input<typeof transactionArchiveSchema>;
