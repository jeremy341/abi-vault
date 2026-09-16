import { z } from "zod";

export const inviteLinkRoleSchema = z.object({
  role: z.enum(["admin", "supervisor"]),
});

export type InviteLinkRole = z.infer<typeof inviteLinkRoleSchema>["role"];

export type InviteLinkRoleInput = z.input<typeof inviteLinkRoleSchema>;
