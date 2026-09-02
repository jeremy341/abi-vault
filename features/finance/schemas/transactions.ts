import { z } from "zod";
import { parseEuroToMinor } from "@/lib/finance/money";

const uuid = z.string().uuid();

export const transactionCreateSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, "Amount is required")
      .transform((value, context) => {
        try {
          return parseEuroToMinor(value);
        } catch {
          context.addIssue({
            code: "custom",
            message: "Amount must be a positive EUR value with up to two decimals",
          });
          return z.NEVER;
        }
      })
      .refine((value) => value > BigInt(0), "Amount must be greater than zero"),
    currency: z.literal("EUR"),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    type: z.enum(["income", "expense", "transfer"]),
    categoryId: uuid.nullable().optional(),
    fromWalletId: uuid.nullable().optional(),
    toWalletId: uuid.nullable().optional(),
    periodId: uuid,
    bookedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Das Buchungsdatum ist ungültig.")
      .nullable()
      .optional(),
    idempotencyKey: z.string().trim().min(16).max(128),
  })
  .superRefine((value, context) => {
    const from = value.fromWalletId;
    const to = value.toWalletId;

    if (value.type === "income" && (!to || from)) {
      context.addIssue({
        code: "custom",
        path: ["toWalletId"],
        message: "Income benötigen ausschließlich eine Zielkasse.",
      });
    }

    if (value.type === "expense" && (!from || to)) {
      context.addIssue({
        code: "custom",
        path: ["fromWalletId"],
        message: "Expenses require only a source cash register.",
      });
    }

    if (value.type === "transfer" && (!from || !to || from === to)) {
      context.addIssue({
        code: "custom",
        path: ["fromWalletId"],
        message: "A transfer requires two different cash registers.",
      });
    }

    if ((value.type === "income" || value.type === "expense") && !value.categoryId) {
      context.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Income and expenses require a category.",
      });
    }
  });

export type TransactionCreateInput = z.input<typeof transactionCreateSchema>;
export type TransactionCreateCommand = z.output<typeof transactionCreateSchema>;
