CREATE TABLE IF NOT EXISTS "public"."channel_stores" (
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

CREATE TABLE IF NOT EXISTS "public"."product_channel_mappings" (
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

CREATE TABLE IF NOT EXISTS "public"."online_orders" (
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

CREATE TABLE IF NOT EXISTS "public"."online_order_items" (
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

CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
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

CREATE TABLE IF NOT EXISTS "public"."integration_jobs" (
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

CREATE TABLE IF NOT EXISTS "public"."integration_logs" (
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

CREATE INDEX IF NOT EXISTS "channel_stores_sales_channel_id_is_active_idx" ON "public"."channel_stores"("sales_channel_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "channel_stores_sales_channel_id_external_store_id_key" ON "public"."channel_stores"("sales_channel_id", "external_store_id");
CREATE INDEX IF NOT EXISTS "product_channel_mappings_product_id_idx" ON "public"."product_channel_mappings"("product_id");
CREATE INDEX IF NOT EXISTS "product_channel_mappings_channel_store_id_mapping_status_idx" ON "public"."product_channel_mappings"("channel_store_id", "mapping_status");
CREATE UNIQUE INDEX IF NOT EXISTS "product_channel_mappings_channel_store_id_external_sku_key" ON "public"."product_channel_mappings"("channel_store_id", "external_sku");
CREATE INDEX IF NOT EXISTS "online_orders_sales_channel_id_order_datetime_idx" ON "public"."online_orders"("sales_channel_id", "order_datetime");
CREATE INDEX IF NOT EXISTS "online_orders_branch_id_order_datetime_idx" ON "public"."online_orders"("branch_id", "order_datetime");
CREATE INDEX IF NOT EXISTS "online_orders_order_status_payment_status_idx" ON "public"."online_orders"("order_status", "payment_status");
CREATE INDEX IF NOT EXISTS "online_orders_mapping_status_idx" ON "public"."online_orders"("mapping_status");
CREATE UNIQUE INDEX IF NOT EXISTS "online_orders_channel_store_id_external_order_id_key" ON "public"."online_orders"("channel_store_id", "external_order_id");
CREATE INDEX IF NOT EXISTS "online_order_items_online_order_id_idx" ON "public"."online_order_items"("online_order_id");
CREATE INDEX IF NOT EXISTS "online_order_items_product_id_idx" ON "public"."online_order_items"("product_id");
CREATE INDEX IF NOT EXISTS "online_order_items_external_sku_idx" ON "public"."online_order_items"("external_sku");
CREATE INDEX IF NOT EXISTS "online_order_items_mapping_status_idx" ON "public"."online_order_items"("mapping_status");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_status_idx" ON "public"."webhook_events"("provider", "status");
CREATE INDEX IF NOT EXISTS "webhook_events_channel_store_id_idx" ON "public"."webhook_events"("channel_store_id");
CREATE INDEX IF NOT EXISTS "webhook_events_integration_job_id_idx" ON "public"."webhook_events"("integration_job_id");
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_external_order_id_event_reference_key" ON "public"."webhook_events"("provider", "external_order_id", "event_reference");
CREATE INDEX IF NOT EXISTS "integration_jobs_provider_status_idx" ON "public"."integration_jobs"("provider", "status");
CREATE INDEX IF NOT EXISTS "integration_jobs_job_type_status_idx" ON "public"."integration_jobs"("job_type", "status");
CREATE INDEX IF NOT EXISTS "integration_jobs_online_order_id_idx" ON "public"."integration_jobs"("online_order_id");
CREATE INDEX IF NOT EXISTS "integration_logs_provider_created_at_idx" ON "public"."integration_logs"("provider", "created_at");
CREATE INDEX IF NOT EXISTS "integration_logs_log_level_idx" ON "public"."integration_logs"("log_level");
CREATE INDEX IF NOT EXISTS "integration_logs_status_idx" ON "public"."integration_logs"("status");
CREATE INDEX IF NOT EXISTS "integration_logs_integration_job_id_idx" ON "public"."integration_logs"("integration_job_id");
CREATE INDEX IF NOT EXISTS "integration_logs_online_order_id_idx" ON "public"."integration_logs"("online_order_id");

DO $$ BEGIN
  ALTER TABLE "public"."channel_stores" ADD CONSTRAINT "channel_stores_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_channel_store_id_fkey" FOREIGN KEY ("channel_store_id") REFERENCES "public"."channel_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."product_channel_mappings" ADD CONSTRAINT "product_channel_mappings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_channel_store_id_fkey" FOREIGN KEY ("channel_store_id") REFERENCES "public"."channel_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."online_orders" ADD CONSTRAINT "online_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."online_order_items" ADD CONSTRAINT "online_order_items_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."online_order_items" ADD CONSTRAINT "online_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_integration_job_id_fkey" FOREIGN KEY ("integration_job_id") REFERENCES "public"."integration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."integration_jobs" ADD CONSTRAINT "integration_jobs_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."integration_logs" ADD CONSTRAINT "integration_logs_integration_job_id_fkey" FOREIGN KEY ("integration_job_id") REFERENCES "public"."integration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."integration_logs" ADD CONSTRAINT "integration_logs_online_order_id_fkey" FOREIGN KEY ("online_order_id") REFERENCES "public"."online_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
