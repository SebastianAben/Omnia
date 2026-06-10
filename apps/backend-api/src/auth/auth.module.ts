import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./guards/auth.guard";
import { HqAdminGuard } from "./guards/hq-admin.guard";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, HqAdminGuard],
  exports: [AuthService, AuthGuard, HqAdminGuard],
})
export class AuthModule {}
