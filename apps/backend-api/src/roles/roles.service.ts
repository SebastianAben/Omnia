import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return ok(
      roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        is_active: role.isActive,
      })),
    );
  }
}
