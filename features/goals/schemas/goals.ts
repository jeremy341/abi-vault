import { z } from "zod";
import { parseDollarToMinor } from "@/lib/finance/money";

const minorAmount = z.string().trim().transform((value, context) => {
  try {
    const amount = parseDollarToMinor(value);
    if (amount <= BigInt(0)) throw new Error("not positive");
    return amount;
  } catch {
    context.addIssue({ code: "custom", message: "Enter a positive dollar amount." });
    return z.NEVER;
  }
});

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  targetAmount: minorAmount,
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visibility: z.enum(["private", "students"]),
  idempotencyKey: z.string().trim().min(16).max(128),
});

export const goalContributionSchema = z.object({
  goalId: z.string().uuid(),
  transactionId: z.string().uuid(),
  allocatedAmount: minorAmount,
  idempotencyKey: z.string().trim().min(16).max(128),
});

export type GoalCreateInput = z.input<typeof goalCreateSchema>;
export type GoalContributionInput = z.input<typeof goalContributionSchema>;
