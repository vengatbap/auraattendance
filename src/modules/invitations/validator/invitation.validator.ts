import { z } from "zod";

export const inviteAdminSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
