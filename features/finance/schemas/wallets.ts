import { z } from "zod";

export const walletCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.literal("cash"),
  responsibleClerkUserId: z.string().trim().nullable().optional(),
  bankConnectionId: z.string().uuid().nullable().optional(),
  idempotencyKey: z.string().trim().min(16).max(128),
  cardNumberVisual: z.string().trim().max(19).nullable().optional(),
  cardHolderVisual: z.string().trim().max(80).nullable().optional(),
  cardExpiryVisual: z.string().trim().max(5).nullable().optional(),
  cardColorVisual: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
});

export type WalletCreateInput = z.input<typeof walletCreateSchema>;

export const walletUpdateSchema = z.object({
  walletId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(500),
  cardNumberVisual: z.string().trim().max(19).nullable().optional(),
  cardHolderVisual: z.string().trim().max(80).nullable().optional(),
  cardExpiryVisual: z.string().trim().max(5).nullable().optional(),
  cardColorVisual: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
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
