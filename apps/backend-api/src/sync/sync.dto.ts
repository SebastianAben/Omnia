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
  "transaction.bundle",
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

export type SyncBundleRequest = {
  event_id: string;
  event_type: "transaction.bundle";
  event_version: number;
  branch_id: string;
  source_system: "branch_app";
  source_mode: "online" | "offline_replay";
  occurred_at: string;
  produced_by_user_id?: string;
  payload: {
    transaction: {
      id: string;
      transaction_no: string;
      branch_id: string;
      register_id: string;
      shift_id?: string | null;
      cashier_user_id: string;
      transaction_datetime: string;
      subtotal_amount: number;
      discount_amount?: number;
      tax_amount?: number;
      total_amount: number;
      payment_status: "pending" | "paid" | "partially_paid";
      transaction_status: "completed" | "voided";
      source_mode: "online" | "offline_replay";
      local_reference_id?: string | null;
    };
    items: Array<{
      id: string;
      product_id: string;
      product_name_snapshot: string;
      sku_snapshot: string;
      unit_price: number;
      quantity: number;
      discount_amount?: number;
      tax_amount?: number;
      line_total: number;
    }>;
    payments: Array<{
      id: string;
      payment_method_code: string;
      amount: number;
      payment_status: "pending" | "paid" | "partially_paid" | "failed";
      payment_reference?: string | null;
      paid_at?: string | null;
      notes?: string | null;
    }>;
    stock_movements: Array<{
      id: string;
      product_id: string;
      source_type: string;
      source_id?: string | null;
      movement_type:
        | "sale_out"
        | "stock_in"
        | "adjustment_plus"
        | "adjustment_minus"
        | "sync_correction";
      quantity_delta: number;
      reason_code: string;
      notes?: string | null;
      performed_by_user_id?: string | null;
      movement_at: string;
    }>;
  };
};
