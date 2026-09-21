CREATE TABLE "ingest_jobs" (
	"id" text PRIMARY KEY,
	"registry_id" text NOT NULL,
	"status" text DEFAULT 'discovered' NOT NULL,
	"request_url" text NOT NULL,
	"external_identifier" text,
	"response_hash" text,
	"source_id" text,
	"error_code" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rights_reviews" (
	"id" text PRIMARY KEY,
	"source_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rights_status" text DEFAULT 'unknown' NOT NULL,
	"policy_url" text,
	"evidence_excerpt" text,
	"reviewer" text,
	"reviewed_at" timestamp with time zone,
	"allowed_uses" jsonb,
	"attribution_text" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "source_registry" (
	"id" text PRIMARY KEY,
	"institution" text NOT NULL,
	"country" text NOT NULL,
	"base_url" text NOT NULL,
	"discovery_method" text NOT NULL,
	"allowed_domains" jsonb NOT NULL,
	"api_daily_limit" integer,
	"metadata_reuse" text DEFAULT 'unknown' NOT NULL,
	"file_reuse_default" text DEFAULT 'unknown' NOT NULL,
	"requires_item_rights_review" boolean DEFAULT true NOT NULL,
	"robots_reviewed_at" text,
	"terms_reviewed_at" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ingest_jobs_registry_idx" ON "ingest_jobs" ("registry_id");--> statement-breakpoint
CREATE INDEX "ingest_jobs_status_idx" ON "ingest_jobs" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ingest_jobs_registry_external_unique" ON "ingest_jobs" ("registry_id","external_identifier");--> statement-breakpoint
CREATE INDEX "rights_reviews_source_idx" ON "rights_reviews" ("source_id");--> statement-breakpoint
CREATE INDEX "rights_reviews_status_idx" ON "rights_reviews" ("status");--> statement-breakpoint
CREATE INDEX "source_registry_enabled_idx" ON "source_registry" ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "source_registry_base_url_unique" ON "source_registry" ("base_url");--> statement-breakpoint
ALTER TABLE "ingest_jobs" ADD CONSTRAINT "ingest_jobs_registry_id_source_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "source_registry"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingest_jobs" ADD CONSTRAINT "ingest_jobs_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "rights_reviews" ADD CONSTRAINT "rights_reviews_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;