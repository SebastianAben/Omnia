import { Body, Controller, Headers, Inject, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { ShopeeOrderWebhookDto } from "../../integrations/shopee/shopee.dto";
import { ShopeeService } from "../../integrations/shopee/shopee.service";

@ApiTags("webhooks/shopee")
@Controller("webhooks/shopee")
export class ShopeeWebhookController {
  constructor(
    @Inject(ShopeeService) private readonly shopeeService: ShopeeService,
  ) {}

  @Post("orders")
  @ApiOkResponse({ description: "Receive a mock Shopee order webhook." })
  receiveOrder(
    @Body() dto: ShopeeOrderWebhookDto,
    @Headers("x-shopee-webhook-secret") secret?: string,
    @Headers("x-shopee-webhook-timestamp") timestamp?: string,
  ) {
    return this.shopeeService.receiveOrderWebhook(dto, { secret, timestamp });
  }
}
