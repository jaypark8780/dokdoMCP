CREATE TABLE "source_links" (
	"id" text PRIMARY KEY,
	"source_id" text NOT NULL,
	"url" text NOT NULL,
	"url_type" text DEFAULT 'canonical' NOT NULL,
	"checked_at" timestamp with time zone,
	"http_status" integer,
	"content_type" text,
	"checksum" text,
	"is_current" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX "source_links_source_idx" ON "source_links" ("source_id");--> statement-breakpoint
CREATE INDEX "source_links_current_idx" ON "source_links" ("is_current");--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;