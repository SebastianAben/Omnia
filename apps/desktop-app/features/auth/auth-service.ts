import { apiFetch } from "@/lib/api-client";
import type { BranchContext, SessionUser } from "@/lib/app-state";
import { roleFromApi } from "@/lib/app-state";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    full_name: string;
    username: string;
    role_code: string;
    branch_id?: string;
  };
  branches: Array<{
    id: string;
    code: string;
    name: string;
  }>;
};

export type LoginResult = {
  token: string;
  user: SessionUser;
  branch?: BranchContext;
};

export async function loginWithPassword(input: {
  username: string;
  password: string;
  deviceId: string;
}): Promise<LoginResult> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      device_id: input.deviceId,
    }),
  });

  return {
    token: data.token,
    user: {
      id: data.user.id,
      fullName: data.user.full_name,
      username: data.user.username,
      role: roleFromApi(data.user.role_code),
      branchId: data.user.branch_id,
    },
    branch: data.branches[0]
      ? {
          id: data.branches[0].id,
          code: data.branches[0].code,
          name: data.branches[0].name,
        }
      : undefined,
  };
}
