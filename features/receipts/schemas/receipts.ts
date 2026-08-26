import { z } from "zod";

export const receiptMetadataSchema = z.object({
  transactionId: z.string().uuid().nullable(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});

export const receiptReviewSchema = z.object({
  receiptId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "pending"]),
});

export type ReceiptReviewInput = z.input<typeof receiptReviewSchema>;
