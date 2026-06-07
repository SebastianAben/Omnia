import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RegistersController } from "./registers.controller";
import { RegistersService } from "./registers.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RegistersController],
  providers: [RegistersService],
})
export class RegistersModule {}
