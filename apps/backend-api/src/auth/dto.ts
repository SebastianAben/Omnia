import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  device_id: z.string().trim().min(1).max(200).optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSessionSchema = z.object({
  refresh_token: z.string().min(32).max(1024),
});

export type RefreshSessionDto = z.infer<typeof refreshSessionSchema>;

export type CurrentUser = {
  id: string;
  full_name: string;
  username: string;
  role_code: string;
  branch_id?: string;
};
