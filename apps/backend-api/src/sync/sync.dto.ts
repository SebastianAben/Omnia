import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

const eventTypes = [
  "transaction.created",
  "transaction.voided",
  "payment.recorded",
  "stock_movement.created",
  "shift.opened",
  "shift.closed",
  "product.updated",
  "branch_price.updated",
  "conflict.resolved",
] as const;

export class SyncEventDto {
  @IsString()
  @IsNotEmpty()
  event_id!: string;

  @IsString()
  @IsIn(eventTypes)
  event_type!: (typeof eventTypes)[number];

  @IsString()
  @IsNotEmpty()
  event_version!: string;

  @IsString()
  @IsNotEmpty()
  branch_id!: string;

  @IsString()
  @IsNotEmpty()
  source_system!: string;

  @IsString()
  @IsIn(["online", "offline_replay"])
  source_mode!: "online" | "offline_replay";

  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @IsString()
  @IsNotEmpty()
  entity_id!: string;

  @IsISO8601()
  occurred_at!: string;

  @IsString()
  @IsOptional()
  produced_by_user_id?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
