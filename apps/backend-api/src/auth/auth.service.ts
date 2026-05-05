import { Injectable } from "@nestjs/common";

import { CurrentUser, LoginDto } from "./dto";

@Injectable()
export class AuthService {
  login(dto: LoginDto) {
    const user = {
      id: "usr_demo",
      full_name: "Demo User",
      role_code: "cashier",
      branch_id: "br_demo",
    };

    return {
      success: true,
      data: {
        token: `sprint0-token-for-${dto.username}`,
        user,
        permissions: [],
        branches: dto.device_id
          ? [{ id: user.branch_id, device_id: dto.device_id }]
          : [],
      },
    };
  }

  me(user: CurrentUser) {
    return {
      success: true,
      data: {
        user,
        permissions: [],
        branches: user.branch_id ? [{ id: user.branch_id }] : [],
      },
    };
  }
}
