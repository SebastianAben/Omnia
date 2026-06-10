import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      include: {
        role: true,
        branch: true,
      },
    });

    return ok(
      users.map((user) => ({
        id: user.id,
        full_name: user.fullName,
        username: user.username,
        email: user.email,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
        },
        branch: user.branch
          ? {
              id: user.branch.id,
              code: user.branch.code,
              name: user.branch.name,
            }
          : null,
        is_active: user.isActive,
        last_login_at: user.lastLoginAt,
      })),
    );
  }
}
