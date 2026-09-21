import { defineRelations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { account, authRelationsConfig, rateLimit, session, user, verification } from "./schema-auth";

/**
 * Public, curated reference data. Writes are never exposed through the MCP
 * surface; only authenticated admin procedures/workflows may mutate it.
 */
export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    titleOriginal: text("title_original").notNull(),
    contentOriginal: text("content_original"),
    sourceType: text("source_type").notNull(),
    isPrimarySource: boolean("is_primary_source").default(false).notNull(),
    originCountry: text("origin_country"),
    institution: text("institution"),
    authorOrCreator: text("author_or_creator"),
    createdDate: text("created_date"),
    publishedDate: text("published_date"),
    historicalPeriod: text("historical_period"),
    originalLanguage: text("original_language").notNull(),
    originalScript: text("original_script"),
    canonicalUrl: text("canonical_url").notNull(),
    archiveIdentifier: text("archive_identifier"),
    accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
    license: text("license"),
    rightsStatus: text("rights_status").default("unknown").notNull(),
    reuseTerms: text("reuse_terms"),
    attributionText: text("attribution_text"),
    checksum: text("checksum"),
    version: integer("version").default(1).notNull(),
    verificationStatus: text("verification_status").default("imported").notNull(),
    supersedesId: text("supersedes_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sources_slug_unique").on(table.slug),
    index("sources_type_idx").on(table.sourceType),
    index("sources_country_idx").on(table.originCountry),
    index("sources_verification_idx").on(table.verificationStatus),
  ],
);

export const sourceLocalizations = pgTable(
  "source_localizations",
  {
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    title: text("title").notNull(),
    abstract: text("abstract"),
    content: text("content"),
    translationMethod: text("translation_method").default("machine").notNull(),
    translationModel: text("translation_model"),
    translatorOrReviewer: text("translator_or_reviewer"),
    reviewStatus: text("review_status").default("draft").notNull(),
    version: integer("version").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourceId, table.language, table.version] }),
    index("source_localizations_language_idx").on(table.language),
  ],
);

export const sourceFragments = pgTable(
  "source_fragments",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    locatorType: text("locator_type").notNull(),
    locatorValue: text("locator_value").notNull(),
    textOriginal: text("text_original").notNull(),
    imageCropStorageId: text("image_crop_storage_id"),
    ocrConfidence: integer("ocr_confidence"),
    reviewStatus: text("review_status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("source_fragments_source_idx").on(table.sourceId)],
);

export const fragmentLocalizations = pgTable(
  "fragment_localizations",
  {
    fragmentId: text("fragment_id")
      .notNull()
      .references(() => sourceFragments.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    text: text("text").notNull(),
    translationMethod: text("translation_method").default("machine").notNull(),
    reviewStatus: text("review_status").default("draft").notNull(),
    version: integer("version").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.fragmentId, table.language, table.version] })],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    storageId: text("storage_id"),
    externalUrl: text("external_url"),
    thumbnailStorageId: text("thumbnail_storage_id"),
    thumbnailUrl: text("thumbnail_url"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    rightsStatus: text("rights_status").default("unknown").notNull(),
    allowedUses: jsonb("allowed_uses").$type<string[]>(),
    creditLine: text("credit_line"),
    publicDeliveryMode: text("public_delivery_mode").default("metadata_only").notNull(),
    transcriptStatus: text("transcript_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("media_assets_source_idx").on(table.sourceId),
    index("media_assets_kind_idx").on(table.kind),
  ],
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: text("id").primaryKey(),
    mediaAssetId: text("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    speaker: text("speaker"),
    languageOriginal: text("language_original").notNull(),
    textOriginal: text("text_original").notNull(),
    confidence: integer("confidence"),
    reviewStatus: text("review_status").default("draft").notNull(),
  },
  (table) => [index("transcript_segments_media_idx").on(table.mediaAssetId)],
);

export const transcriptLocalizations = pgTable(
  "transcript_localizations",
  {
    transcriptSegmentId: text("transcript_segment_id")
      .notNull()
      .references(() => transcriptSegments.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    text: text("text").notNull(),
    translationMethod: text("translation_method").default("machine").notNull(),
    reviewStatus: text("review_status").default("draft").notNull(),
    version: integer("version").default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.transcriptSegmentId, table.language, table.version] })],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    datePrecision: text("date_precision").default("day").notNull(),
    eventType: text("event_type").notNull(),
    placeName: text("place_name"),
    reviewStatus: text("review_status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("events_start_date_idx").on(table.startDate)],
);

export const eventLocalizations = pgTable(
  "event_localizations",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    reviewStatus: text("review_status").default("draft").notNull(),
    version: integer("version").default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.language, table.version] })],
);

export const sourceEventLinks = pgTable(
  "source_event_links",
  {
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    relationship: text("relationship").default("evidence").notNull(),
    fragmentId: text("fragment_id").references(() => sourceFragments.id, { onDelete: "set null" }),
  },
  (table) => [primaryKey({ columns: [table.sourceId, table.eventId] })],
);

export const relations = defineRelations({ user, session, account, verification, rateLimit }, (r) => ({
  ...authRelationsConfig(r),
}));
