import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RegistersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRegisters(branchId?: string) {
    const registers = await this.prisma.register.findMany({
      where: { branchId, isActive: true },
      orderBy: [{ branch: { code: "asc" } }, { code: "asc" }],
      include: { branch: true },
    });

    return ok(
      registers.map((register) => ({
        id: register.id,
        branch_id: register.branchId,
        branch_code: register.branch.code,
        code: register.code,
        name: register.name,
        device_identifier: register.deviceIdentifier,
        is_active: register.isActive,
      })),
    );
  }
}
