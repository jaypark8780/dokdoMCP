CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_localizations" (
	"event_id" text,
	"language" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	CONSTRAINT "event_localizations_pkey" PRIMARY KEY("event_id","language","version")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY,
	"start_date" text NOT NULL,
	"end_date" text,
	"date_precision" text DEFAULT 'day' NOT NULL,
	"event_type" text NOT NULL,
	"place_name" text,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fragment_localizations" (
	"fragment_id" text,
	"language" text,
	"text" text NOT NULL,
	"translation_method" text DEFAULT 'machine' NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fragment_localizations_pkey" PRIMARY KEY("fragment_id","language","version")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY,
	"source_id" text NOT NULL,
	"kind" text NOT NULL,
	"storage_id" text,
	"external_url" text,
	"thumbnail_storage_id" text,
	"thumbnail_url" text,
	"mime_type" text,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"rights_status" text DEFAULT 'unknown' NOT NULL,
	"allowed_uses" jsonb,
	"credit_line" text,
	"public_delivery_mode" text DEFAULT 'metadata_only' NOT NULL,
	"transcript_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_event_links" (
	"source_id" text,
	"event_id" text,
	"relationship" text DEFAULT 'evidence' NOT NULL,
	"fragment_id" text,
	CONSTRAINT "source_event_links_pkey" PRIMARY KEY("source_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "source_fragments" (
	"id" text PRIMARY KEY,
	"source_id" text NOT NULL,
	"locator_type" text NOT NULL,
	"locator_value" text NOT NULL,
	"text_original" text NOT NULL,
	"image_crop_storage_id" text,
	"ocr_confidence" integer,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_localizations" (
	"source_id" text,
	"language" text,
	"title" text NOT NULL,
	"abstract" text,
	"content" text,
	"translation_method" text DEFAULT 'machine' NOT NULL,
	"translation_model" text,
	"translator_or_reviewer" text,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_localizations_pkey" PRIMARY KEY("source_id","language","version")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL,
	"title_original" text NOT NULL,
	"content_original" text,
	"source_type" text NOT NULL,
	"is_primary_source" boolean DEFAULT false NOT NULL,
	"origin_country" text,
	"institution" text,
	"author_or_creator" text,
	"created_date" text,
	"published_date" text,
	"historical_period" text,
	"original_language" text NOT NULL,
	"original_script" text,
	"canonical_url" text NOT NULL,
	"archive_identifier" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"license" text,
	"rights_status" text DEFAULT 'unknown' NOT NULL,
	"reuse_terms" text,
	"attribution_text" text,
	"checksum" text,
	"version" integer DEFAULT 1 NOT NULL,
	"verification_status" text DEFAULT 'imported' NOT NULL,
	"supersedes_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_localizations" (
	"transcript_segment_id" text,
	"language" text,
	"text" text NOT NULL,
	"translation_method" text DEFAULT 'machine' NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	CONSTRAINT "transcript_localizations_pkey" PRIMARY KEY("transcript_segment_id","language","version")
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" text PRIMARY KEY,
	"media_asset_id" text NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"speaker" text,
	"language_original" text NOT NULL,
	"text_original" text NOT NULL,
	"confidence" integer,
	"review_status" text DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" ("start_date");--> statement-breakpoint
CREATE INDEX "media_assets_source_idx" ON "media_assets" ("source_id");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" ("kind");--> statement-breakpoint
CREATE INDEX "source_fragments_source_idx" ON "source_fragments" ("source_id");--> statement-breakpoint
CREATE INDEX "source_localizations_language_idx" ON "source_localizations" ("language");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_slug_unique" ON "sources" ("slug");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" ("source_type");--> statement-breakpoint
CREATE INDEX "sources_country_idx" ON "sources" ("origin_country");--> statement-breakpoint
CREATE INDEX "sources_verification_idx" ON "sources" ("verification_status");--> statement-breakpoint
CREATE INDEX "transcript_segments_media_idx" ON "transcript_segments" ("media_asset_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_localizations" ADD CONSTRAINT "event_localizations_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fragment_localizations" ADD CONSTRAINT "fragment_localizations_fragment_id_source_fragments_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "source_fragments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_event_links" ADD CONSTRAINT "source_event_links_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_event_links" ADD CONSTRAINT "source_event_links_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_event_links" ADD CONSTRAINT "source_event_links_fragment_id_source_fragments_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "source_fragments"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "source_fragments" ADD CONSTRAINT "source_fragments_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_localizations" ADD CONSTRAINT "source_localizations_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transcript_localizations" ADD CONSTRAINT "transcript_localizations_Rb6vxNpd0Ky4_fkey" FOREIGN KEY ("transcript_segment_id") REFERENCES "transcript_segments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_media_asset_id_media_assets_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE;