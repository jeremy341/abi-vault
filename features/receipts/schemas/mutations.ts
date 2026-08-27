import { z } from "zod";

export const receiptUpdateSchema = z.object({
  receiptId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  transactionId: z.string().uuid().nullable(),
});

export const receiptArchiveSchema = z.object({
  receiptId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export type ReceiptUpdateInput = z.input<typeof receiptUpdateSchema>;
export type ReceiptArchiveInput = z.input<typeof receiptArchiveSchema>;
