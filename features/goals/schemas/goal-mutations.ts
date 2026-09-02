import { z } from "zod";
import { parseEuroToMinor } from "@/lib/finance/money";

const amount = z.string().trim().transform((value, context) => {
  try {
    const parsed = parseEuroToMinor(value);
    if (parsed <= BigInt(0)) throw new Error();
    return parsed;
  } catch {
    context.addIssue({ code: "custom", message: "The amount is invalid." });
    return z.NEVER;
  }
});

export const updateGoalSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  targetAmount: amount,
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(1).max(1000),
});

export const archiveGoalSchema = z.object({ goalId: z.string().uuid(), reason: z.string().trim().min(1).max(1000) });
