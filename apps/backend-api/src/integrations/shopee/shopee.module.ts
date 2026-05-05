import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { ShopeeController } from "./shopee.controller";
import { ShopeeService } from "./shopee.service";

@Module({
  imports: [AuthModule],
  controllers: [ShopeeController],
  providers: [ShopeeService],
  exports: [ShopeeService],
})
export class ShopeeModule {}
