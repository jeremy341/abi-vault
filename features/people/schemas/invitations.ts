import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "supervisor"]),
});
