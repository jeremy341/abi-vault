import { z } from "zod";

export const updateMemberRoleSchema = z.object({
  clerkUserId: z.string().trim().min(1).max(255),
  role: z.enum(["admin", "supervisor"]),
  reason: z.string().trim().min(1).max(1000),
});

export const removeMemberSchema = z.object({
  clerkUserId: z.string().trim().min(1).max(255),
  reason: z.string().trim().min(1).max(1000),
});

export type UpdateMemberRoleInput = z.input<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.input<typeof removeMemberSchema>;
