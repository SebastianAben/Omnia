import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { RequestUser } from "../../auth/current-user.decorator";
import { CurrentUser } from "../../auth/dto";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { HqAdminGuard } from "../../auth/guards/hq-admin.guard";
import { ConnectShopeeStoreDto, CreateProductMappingDto } from "./shopee.dto";
import { ShopeeService } from "./shopee.service";

@ApiTags("integrations/shopee")
@Controller("integrations/shopee")
@UseGuards(AuthGuard, HqAdminGuard)
@ApiBearerAuth()
export class ShopeeController {
  constructor(
    @Inject(ShopeeService) private readonly shopeeService: ShopeeService,
  ) {}

  @Post("stores")
  @ApiOkResponse({ description: "Connect or update a mock Shopee store." })
  connectStore(@Body() dto: ConnectShopeeStoreDto) {
    return this.shopeeService.connectStore(dto);
  }

  @Get("stores")
  @ApiOkResponse({ description: "List connected Shopee stores." })
  listStores() {
    return this.shopeeService.listStores();
  }

  @Post("product-mappings")
  @ApiOkResponse({ description: "Create or update a Shopee SKU mapping." })
  createProductMapping(
    @Body() dto: CreateProductMappingDto,
    @RequestUser() user?: CurrentUser,
  ) {
    return this.shopeeService.createProductMapping(dto, user);
  }

  @Get("product-mappings")
  @ApiOkResponse({ description: "List Shopee product mappings." })
  listProductMappings(
    @Query("channel_store_id") channelStoreId?: string,
    @Query("product_id") productId?: string,
    @Query("mapping_status") mappingStatus?: string,
  ) {
    return this.shopeeService.listProductMappings({
      channel_store_id: channelStoreId,
      product_id: productId,
      mapping_status: mappingStatus,
    });
  }

  @Get("orders")
  @ApiOkResponse({ description: "List imported Shopee online orders." })
  listOrders(
    @Query("order_status") orderStatus?: string,
    @Query("payment_status") paymentStatus?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.shopeeService.listOrders({
      order_status: orderStatus,
      payment_status: paymentStatus,
      from,
      to,
    });
  }

  @Get("orders/:online_order_id")
  @ApiOkResponse({ description: "Get a Shopee online order detail." })
  getOrder(@Param("online_order_id") onlineOrderId: string) {
    return this.shopeeService.getOrder(onlineOrderId);
  }

  @Post("jobs/:job_id/retry")
  @ApiOkResponse({ description: "Retry a failed Shopee integration job." })
  retryJob(@Param("job_id") jobId: string) {
    return this.shopeeService.retryJob(jobId);
  }
}
