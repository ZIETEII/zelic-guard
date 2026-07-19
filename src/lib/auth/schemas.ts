import { z } from "zod";

export const loginInputSchema = z.strictObject({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

export const loginSuccessSchema = z.strictObject({
  ok: z.literal(true),
  redirectTo: z.literal("/workspace"),
});

export const logoutSuccessSchema = z.strictObject({
  ok: z.literal(true),
});

export const authErrorSchema = z.strictObject({
  error: z.string().min(1).max(120),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
