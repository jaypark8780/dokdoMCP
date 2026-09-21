CREATE TABLE "claim_evidence" (
	"id" text PRIMARY KEY,
	"claim_id" text NOT NULL,
	"source_id" text NOT NULL,
	"fragment_id" text,
	"relationship" text NOT NULL,
	"relevance_note" text,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_localizations" (
	"claim_id" text,
	"language" text,
	"statement" text NOT NULL,
	"assessment_summary" text NOT NULL,
	"translation_method" text DEFAULT 'human' NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claim_localizations_pkey" PRIMARY KEY("claim_id","language","version")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY,
	"topic" text NOT NULL,
	"claimant_country" text,
	"claimant_institution" text,
	"claim_type" text DEFAULT 'official_position' NOT NULL,
	"assessment_status" text DEFAULT 'contested' NOT NULL,
	"requires_counter_evidence" boolean DEFAULT true NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_claims" (
	"source_id" text,
	"claim_id" text,
	"relationship" text DEFAULT 'asserts' NOT NULL,
	CONSTRAINT "source_claims_pkey" PRIMARY KEY("source_id","claim_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "claim_evidence_unique" ON "claim_evidence" ("claim_id","source_id","fragment_id","relationship");--> statement-breakpoint
CREATE INDEX "claim_evidence_claim_idx" ON "claim_evidence" ("claim_id");--> statement-breakpoint
CREATE INDEX "claims_topic_idx" ON "claims" ("topic");--> statement-breakpoint
CREATE INDEX "claims_claimant_country_idx" ON "claims" ("claimant_country");--> statement-breakpoint
CREATE INDEX "claims_review_status_idx" ON "claims" ("review_status");--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_claims_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_fragment_id_source_fragments_id_fkey" FOREIGN KEY ("fragment_id") REFERENCES "source_fragments"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "claim_localizations" ADD CONSTRAINT "claim_localizations_claim_id_claims_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_claims" ADD CONSTRAINT "source_claims_source_id_sources_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_claims" ADD CONSTRAINT "source_claims_claim_id_claims_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE;