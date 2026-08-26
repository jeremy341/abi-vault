import { z } from "zod";

export const walletCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["cash", "manual_bank", "bank_connected"]),
  responsibleClerkUserId: z.string().trim().nullable().optional(),
  bankConnectionId: z.string().uuid().nullable().optional(),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export type WalletCreateInput = z.input<typeof walletCreateSchema>;

export const walletUpdateSchema = z.object({
  walletId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(500),
});

export const walletArchiveSchema = z.object({
  walletId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const periodActionSchema = z.object({
  periodId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export type PeriodActionInput = z.input<typeof periodActionSchema>;
