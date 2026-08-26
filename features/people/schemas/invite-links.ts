import { z } from "zod";

export const inviteLinkRoleSchema = z.object({
  role: z.enum(["admin", "supervisor", "student"]),
});

export type InviteLinkRole = z.infer<typeof inviteLinkRoleSchema>["role"];
