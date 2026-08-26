import { z } from "zod";

export const updateCommitteeSettingsSchema = z.object({
  schoolName: z.string().trim().max(160),
  graduationYear: z.number().int().min(2000).max(2200),
  notifications: z.object({ receipts: z.boolean(), payments: z.boolean(), goals: z.boolean() }),
});
