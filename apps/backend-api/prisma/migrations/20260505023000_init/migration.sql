-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."SourceMode" AS ENUM ('ONLINE', 'OFFLINE', 'OFFLINE_REPLAY');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('SALE_OUT', 'STOCK_IN', 'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'SYNC_CORRECTION');

-- CreateEnum
CREATE TYPE "public"."SyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "public"."SyncLogStatus" AS ENUM ('RECEIVED', 'VALIDATED', 'APPLIED', 'REJECTED', 'DUPLICATE_IGNORED', 'CONFLICT_DETECTED', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "pin_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" "public"."BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registers" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_identifier" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "parent_category_id" TEXT,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_name" TEXT NOT NULL,
    "variant_value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branch_product_prices" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "selling_price" DECIMAL(14,2) NOT NULL,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_balances" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_on_hand" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minimum_stock_threshold" DECIMAL(14,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movements" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "movement_type" "public"."StockMovementType" NOT NULL,
    "quantity_delta" DECIMAL(14,2) NOT NULL,
    "quantity_before" DECIMAL(14,2),
    "quantity_after" DECIMAL(14,2),
    "reason_code" TEXT NOT NULL,
    "notes" TEXT,
    "performed_by_user_id" TEXT,
    "movement_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "register_id" TEXT NOT NULL,
    "opened_by_user_id" TEXT NOT NULL,
    "closed_by_user_id" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_cash_amount" DECIMAL(14,2),
    "closing_cash_amount" DECIMAL(14,2),
    "status" "public"."ShiftStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_transactions" (
    "id" TEXT NOT NULL,
    "transaction_no" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "register_id" TEXT NOT NULL,
    "shift_id" TEXT,
    "cashier_user_id" TEXT NOT NULL,
    "transaction_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal_amount" DECIMAL(14,2) NOT NULL,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "source_mode" "public"."SourceMode" NOT NULL DEFAULT 'ONLINE',
    "local_reference_id" TEXT,
    "central_resolution_status" TEXT,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_transaction_items" (
    "id" TEXT NOT NULL,
    "sales_transaction_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "sku_snapshot" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "sales_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "sales_transaction_id" TEXT NOT NULL,
    "payment_method_code" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_reference" TEXT,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_channels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."channel_stores" (
    "id" TEXT NOT NULL,
    "sales_channel_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "external_store_id" TEXT NOT NULL,
    "auth_status" TEXT NOT NULL DEFAULT 'connected',
    "credential_reference" TEXT,
    "auth_payload" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_channel_mappings" (
    "id" TEXT NOT NULL,
    "channel_store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "external_product_id" TEXT,
    "external_sku" TEXT NOT NULL,
    "mapping_status" TEXT NOT NULL DEFAULT 'mapped',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_channel_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."online_orders" (
    "id" TEXT NOT NULL,
    "sales_channel_id" TEXT NOT NULL,
    "channel_store_id" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "order_datetime" TIMESTAMP(3) NOT NULL,
    "order_status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "mapping_status" TEXT NOT NULL DEFAULT 'mapped',
    "subtotal_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shipping_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "raw_payload" JSONB NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."online_order_items" (
    "id" TEXT NOT NULL,
    "online_order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "external_product_id" TEXT,
    "external_sku" TEXT,
    "product_name_snapshot" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "mapping_status" TEXT NOT NULL DEFAULT 'mapped',
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "online_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_reference" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "channel_store_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "integration_job_id" TEXT,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integration_jobs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "online_order_id" TEXT,
    "last_attempt_at" TIMESTAMP(3),
    "next_retry_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integration_logs" (
    "id" TEXT NOT NULL,
    "integration_job_id" TEXT,
    "provider" TEXT NOT NULL,
    "log_level" TEXT NOT NULL DEFAULT 'info',
    "event_type" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "online_order_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_jobs" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "triggered_by_user_id" TEXT,
    "job_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "payload_reference" TEXT,
    "status" "public"."SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_logs" (
    "id" TEXT NOT NULL,
    "sync_job_id" TEXT,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" "public"."SyncLogStatus" NOT NULL DEFAULT 'RECEIVED',
    "log_level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "produced_by_user_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "branch_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "old_value_ref" TEXT,
    "new_value_ref" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "public"."users"("role_id");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "public"."users"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "public"."branches"("code");

-- CreateIndex
CREATE INDEX "registers_branch_id_idx" ON "public"."registers"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "registers_branch_id_code_key" ON "public"."registers"("branch_id", "code");

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "public"."categories"("parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "public"."products"("barcode");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "public"."products"("category_id");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "public"."products"("name");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "public"."product_variants"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_variant_name_variant_value_key" ON "public"."product_variants"("product_id", "variant_name", "variant_value");

-- CreateIndex
CREATE INDEX "branch_product_prices_product_id_idx" ON "public"."branch_product_prices"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_product_prices_branch_id_product_id_key" ON "public"."branch_product_prices"("branch_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_balances_product_id_idx" ON "public"."inventory_balances"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_branch_id_product_id_key" ON "public"."inventory_balances"("branch_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_branch_id_product_id_idx" ON "public"."stock_movements"("branch_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_source_type_source_id_idx" ON "public"."stock_movements"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "shifts_branch_id_status_idx" ON "public"."shifts"("branch_id", "status");

-- CreateIndex
CREATE INDEX "shifts_register_id_status_idx" ON "public"."shifts"("register_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_transaction_no_key" ON "public"."sales_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "sales_transactions_branch_id_transaction_datetime_idx" ON "public"."sales_transactions"("branch_id", "transaction_datetime");

-- CreateIndex
CREATE INDEX "sales_transactions_cashier_user_id_idx" ON "public"."sales_transactions"("cashier_user_id");

-- CreateIndex
CREATE INDEX "sales_transaction_items_sales_transaction_id_idx" ON "public"."sales_transaction_items"("sales_transaction_id");

-- CreateIndex
CREATE INDEX "sales_transaction_items_product_id_idx" ON "public"."sales_transaction_items"("product_id");

-- CreateIndex
CREATE INDEX "payments_sales_transaction_id_idx" ON "public"."payments"("sales_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_channels_code_key" ON "public"."sales_channels"("code");

-- CreateIndex
CREATE INDEX "channel_stores_sales_channel_id_is_active_idx" ON "public"."channel_stores"("sales_channel_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "channel_stores_sales_channel_id_external_store_id_key" ON "public"."channel_stores"("sales_channel_id", "external_store_id");

-- CreateIndex
CREATE INDEX "product_channel_mappings_product_id_idx" ON "public"."product_channel_mappings"("product_id");

-- CreateIndex
CREATE INDEX "product_channel_mappings_channel_store_id_mapping_status_idx" ON "public"."product_channel_mappings"("channel_store_id", "mapping_status");

-- CreateIndex
CREATE UNIQUE INDEX "product_channel_mappings_channel_store_id_external_sku_key" ON "public"."product_channel_mappings"("channel_store_id", "external_sku");

-- CreateIndex
CREATE INDEX "online_orders_sales_channel_id_order_datetime_idx" ON "public"."online_orders"("sales_channel_id", "order_datetime");

-- CreateIndex
CREATE INDEX "online_orders_branch_id_order_datetime_idx" ON "public"."online_orders"("branch_id", "order_datetime");

-- CreateIndex
CREATE INDEX "online_orders_order_status_payment_status_idx" ON "public"."online_orders"("order_status", "payment_status");

-- CreateIndex
CREATE INDEX "online_orders_mapping_status_idx" ON "public"."online_orders"("mapping_status");

-- CreateIndex
CREATE UNIQUE INDEX "online_orders_channel_store_id_external_order_id_key" ON "public"."online_orders"("channel_store_id", "external_order_id");

-- CreateIndex
CREATE INDEX "online_order_items_online_order_id_idx" ON "public"."online_order_items"("online_order_id");

-- CreateIndex
CREATE INDEX "online_order_items_product_id_idx" ON "public"."online_order_items"("product_id");

-- CreateIndex
CREATE INDEX "online_order_items_external_sku_idx" ON "public"."online_order_items"("external_sku");

-- CreateIndex
CREATE INDEX "online_order_items_mapping_status_idx" ON "public"."online_order_items"("mapping_status");

-- CreateIndex
CREATE INDEX "webhook_events_provider_status_idx" ON "public"."webhook_events"("provider", "status");

-- CreateIndex
CREATE INDEX "webhook_events_channel_store_id_idx" ON "public"."webhook_events"("channel_store_id");

-- CreateIndex
CREATE INDEX "webhook_events_integration_job_id_idx" ON "public"."webhook_events"("integration_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_external_order_id_event_reference_key" ON "public"."webhook_events"("provider", "external_order_id", "event_reference");

-- CreateIndex
CREATE INDEX "integration_jobs_provider_status_idx" ON "public"."integration_jobs"("provider", "status");

-- CreateIndex
CREATE INDEX "integration_jobs_job_type_status_idx" ON "public"."integration_jobs"("job_type", "status");

-- CreateIndex
CREATE INDEX "integration_jobs_online_order_id_idx" ON "public"."integration_jobs"("online_order_id");

-- CreateIndex
CREATE INDEX "integration_logs_provider_created_at_idx" ON "public"."integration_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX "integration_logs_log_level_idx" ON "public"."integration_logs"("log_level");

-- CreateIndex
CREATE INDEX "integration_logs_status_idx" ON "public"."integration_logs"("status");

-- CreateIndex
CREATE INDEX "integration_logs_integration_job_id_idx" ON "public"."integration_logs"("integration_job_id");

-- CreateIndex
CREATE INDEX "integration_logs_online_order_id_idx" ON "public"."integration_logs"("online_order_id");

-- CreateIndex
CREATE INDEX "sync_jobs_branch_id_status_idx" ON "public"."sync_jobs"("branch_id", "status");

-- CreateIndex
CREATE INDEX "sync_jobs_entity_type_entity_id_idx" ON "public"."sync_jobs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_logs_event_id_key" ON "public"."sync_logs"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_logs_idempotency_key_key" ON "public"."sync_logs"("idempotency_key");

-- CreateIndex
CREATE INDEX "sync_logs_branch_id_status_idx" ON "public"."sync_logs"("branch_id", "status");

-- CreateIndex
CREATE INDEX "sync_logs_entity_type_entity_id_idx" ON "public"."sync_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "sync_logs_sync_job_id_idx" ON "public"."sync_logs"("sync_job_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "public"."audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_branch_id_created_at_idx" ON "public"."audit_logs"("branch_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registers" ADD CONSTRAINT "registers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_product_prices" ADD CONSTRAINT "branch_product_prices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_product_prices" ADD CONSTRAINT "branch_product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_product_prices" ADD CONSTRAINT "branch_product_prices_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_balances" ADD CONSTRAINT "inventory_balances_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_register_id_fkey" FOREIGN KEY ("register_id") REFERENCES "public"."registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_opened_by_user_id_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_closed_by_user_id_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_register_id_fkey" FOREIGN KEY ("register_id") REFERENCES "public"."registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transactions" ADD CONSTRAINT "sales_transactions_cashier_user_id_fkey" FOREIGN KEY ("cashier_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_sales_transaction_id_fkey" FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_sales_transaction_id_fkey" FOREIGN KEY ("sales_transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."channel_stores" ADD CONSTRAINT "channel_stores_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_channel_store_id_fkey" FOREIGN KEY ("channel_store_id") REFERENCES "public"."channel_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_channel_store_id_fkey" FOREIGN KEY ("channel_store_id") REFERENCES "public"."channel_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_order_items" ADD CONSTRAINT "online_order_items_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."online_order_items" ADD CONSTRAINT "online_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_integration_job_id_fkey" FOREIGN KEY ("integration_job_id") REFERENCES "public"."integration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."integration_jobs" ADD CONSTRAINT "integration_jobs_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."integration_logs" ADD CONSTRAINT "integration_logs_integration_job_id_fkey" FOREIGN KEY ("integration_job_id") REFERENCES "public"."integration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."integration_logs" ADD CONSTRAINT "integration_logs_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_jobs" ADD CONSTRAINT "sync_jobs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_jobs" ADD CONSTRAINT "sync_jobs_triggered_by_user_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_logs" ADD CONSTRAINT "sync_logs_sync_job_id_fkey" FOREIGN KEY ("sync_job_id") REFERENCES "public"."sync_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_logs" ADD CONSTRAINT "sync_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_logs" ADD CONSTRAINT "sync_logs_produced_by_user_id_fkey" FOREIGN KEY ("produced_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
