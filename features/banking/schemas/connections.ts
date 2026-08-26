import { z } from "zod";

export const startBankConnectionSchema = z.object({
  institutionId: z.string().trim().min(1).max(120),
  redirectPath: z.string().trim().regex(/^\/dashboard(?:\/[a-z-]+)*$/).default("/dashboard/funds"),
});

export type StartBankConnectionInput = z.infer<typeof startBankConnectionSchema>;
