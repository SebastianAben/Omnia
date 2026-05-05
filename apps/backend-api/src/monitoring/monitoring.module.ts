import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ShopeeModule } from "../integrations/shopee/shopee.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MonitoringController } from "./monitoring.controller";
import { MonitoringService } from "./monitoring.service";

@Module({
  imports: [AuthModule, PrismaModule, ShopeeModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
