import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ConnectShopeeStoreDto {
  @IsString()
  @IsNotEmpty()
  store_name!: string;

  @IsString()
  @IsNotEmpty()
  external_store_id!: string;

  @IsString()
  @IsOptional()
  credential_reference?: string;

  @IsObject()
  @IsOptional()
  auth_payload?: Record<string, unknown>;
}

export class CreateProductMappingDto {
  @IsString()
  @IsNotEmpty()
  channel_store_id!: string;

  @IsString()
  @IsNotEmpty()
  product_id!: string;

  @IsString()
  @IsOptional()
  external_product_id?: string;

  @IsString()
  @IsNotEmpty()
  external_sku!: string;
}

export class ShopeeWebhookOrderItemDto {
  @IsString()
  @IsOptional()
  external_product_id?: string;

  @IsString()
  @IsOptional()
  external_sku?: string;

  @IsString()
  @IsNotEmpty()
  product_name_snapshot!: string;

  @IsNumber()
  unit_price!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  line_total!: number;
}

export class ShopeeOrderWebhookDto {
  @IsString()
  @IsNotEmpty()
  event_reference!: string;

  @IsString()
  @IsOptional()
  event_type?: string;

  @IsString()
  @IsNotEmpty()
  external_order_id!: string;

  @IsString()
  @IsOptional()
  channel_store_id?: string;

  @IsString()
  @IsOptional()
  external_store_id?: string;

  @IsString()
  @IsOptional()
  branch_id?: string;

  @IsISO8601()
  order_datetime!: string;

  @IsString()
  @IsOptional()
  order_status?: string;

  @IsString()
  @IsOptional()
  payment_status?: string;

  @IsNumber()
  @IsOptional()
  subtotal_amount?: number;

  @IsNumber()
  @IsOptional()
  discount_amount?: number;

  @IsNumber()
  @IsOptional()
  shipping_amount?: number;

  @IsNumber()
  @IsOptional()
  total_amount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopeeWebhookOrderItemDto)
  items!: ShopeeWebhookOrderItemDto[];
}

export type ProductMappingStatus = "mapped" | "unmapped" | "needs_mapping";

export const productMappingStatuses = [
  "mapped",
  "unmapped",
  "needs_mapping",
] as const;

export class ProductMappingsQueryDto {
  @IsString()
  @IsOptional()
  channel_store_id?: string;

  @IsString()
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsIn(productMappingStatuses)
  @IsOptional()
  mapping_status?: ProductMappingStatus;
}
