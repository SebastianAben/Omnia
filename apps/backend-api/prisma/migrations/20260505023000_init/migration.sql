CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BranchStatus') THEN
    CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncLogStatus') THEN
    CREATE TYPE "SyncLogStatus" AS ENUM (
      'RECEIVED',
      'VALIDATED',
      'APPLIED',
      'REJECTED',
      'DUPLICATE_IGNORED',
      'CONFLICT_DETECTED',
      'RESOLVED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "branches" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "role_id" TEXT NOT NULL REFERENCES "roles"("id"),
  "branch_id" TEXT REFERENCES "branches"("id"),
  "full_name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT UNIQUE,
  "password_hash" TEXT NOT NULL,
  "pin_hash" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sku" TEXT NOT NULL UNIQUE,
  "barcode" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'pcs',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory_balances" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "branch_id" TEXT NOT NULL REFERENCES "branches"("id"),
  "product_id" TEXT NOT NULL REFERENCES "products"("id"),
  "quantity" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_balances_branch_id_product_id_key" UNIQUE ("branch_id", "product_id")
);

CREATE TABLE IF NOT EXISTS "sync_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "event_id" TEXT NOT NULL UNIQUE,
  "event_type" TEXT NOT NULL,
  "event_version" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL REFERENCES "branches"("id"),
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "status" "SyncLogStatus" NOT NULL DEFAULT 'RECEIVED',
  "idempotency_key" TEXT UNIQUE,
  "payload" JSONB NOT NULL,
  "error_message" TEXT,
  "produced_by_user_id" TEXT REFERENCES "users"("id"),
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "sync_logs_branch_id_status_idx" ON "sync_logs"("branch_id", "status");
CREATE INDEX IF NOT EXISTS "sync_logs_entity_type_entity_id_idx" ON "sync_logs"("entity_type", "entity_id");
