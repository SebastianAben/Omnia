CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT,
    "product_id" TEXT,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "reference_data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."insight_generation_jobs" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "insight_count" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "insight_generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_insights_insight_type_generated_at_idx" ON "public"."ai_insights"("insight_type", "generated_at");
CREATE INDEX IF NOT EXISTS "ai_insights_branch_id_insight_type_idx" ON "public"."ai_insights"("branch_id", "insight_type");
CREATE INDEX IF NOT EXISTS "ai_insights_product_id_idx" ON "public"."ai_insights"("product_id");
CREATE INDEX IF NOT EXISTS "insight_generation_jobs_job_type_status_idx" ON "public"."insight_generation_jobs"("job_type", "status");
CREATE INDEX IF NOT EXISTS "insight_generation_jobs_created_at_idx" ON "public"."insight_generation_jobs"("created_at");

DO $$ BEGIN
  ALTER TABLE "public"."ai_insights" ADD CONSTRAINT "ai_insights_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."ai_insights" ADD CONSTRAINT "ai_insights_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
