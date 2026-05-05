import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  device_id: z.string().trim().min(1).optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export type CurrentUser = {
  id: string;
  full_name: string;
  username: string;
  role_code: string;
  branch_id?: string;
};
