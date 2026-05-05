import { Module } from "@nestjs/common";

import { ShopeeModule } from "../../integrations/shopee/shopee.module";
import { ShopeeWebhookController } from "./shopee-webhook.controller";

@Module({
  imports: [ShopeeModule],
  controllers: [ShopeeWebhookController],
})
export class ShopeeWebhookModule {}
