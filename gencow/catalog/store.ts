import { and, asc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import {
  eventLocalizations,
  events,
  fragmentLocalizations,
  mediaAssets,
  sourceEventLinks,
  sourceFragments,
  sourceLocalizations,
  sources,
} from "../schema";
import { parseLanguage, resolveLocalization, type Language } from "../i18n/language";
import { getClaimContextsForSource } from "../claims/context";
import {
  CatalogNotFoundError,
  type CatalogStore,
  type GetSourceInput,
  type SearchMediaInput,
  type SearchSourcesInput,
  type TimelineInput,
} from "./types";

const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return 10;
  if (!Number.isInteger(limit) || limit < 1) throw new Error("limit must be a positive integer");
  return Math.min(limit, MAX_LIMIT);
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!Number.isInteger(value) || value < 0 || value > 10_000) throw new Error();
    return value;
  } catch {
    throw new Error("cursor is invalid");
  }
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function trimText(value: string | null | undefined, maxChars: number): string | undefined {
  if (!value) return undefined;
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

function resolveRightsFilter(filter: SearchSourcesInput["rightsFilter"] | SearchMediaInput["rightsFilter"]) {
  if (!filter || filter === "any") return undefined;
  if (filter === "reusable") return inArray(sources.rightsStatus, ["verified_reusable", "public_domain"]);
  return inArray(sources.rightsStatus, ["view_only", "verified_reusable", "public_domain"]);
}

type DbClient = any;

export function createCatalogStore(db: DbClient): CatalogStore {
  return {
    async searchSources(rawInput) {
      const input = rawInput ?? {};
      const language = parseLanguage(input.language);
      const limit = clampLimit(input.limit);
      const offset = decodeCursor(input.cursor);
      const query = input.query?.trim().slice(0, 200);
      const filters: any[] = [eq(sources.verificationStatus, "published")];

      if (query) {
        const pattern = `%${query}%`;
        filters.push(
          or(
            ilike(sources.titleOriginal, pattern),
            ilike(sources.contentOriginal, pattern),
            ilike(sourceLocalizations.title, pattern),
            ilike(sourceLocalizations.abstract, pattern),
            ilike(sourceLocalizations.content, pattern),
          ),
        );
      }
      if (input.sourceTypes?.length) filters.push(inArray(sources.sourceType, input.sourceTypes.slice(0, 20)));
      if (input.countries?.length) filters.push(inArray(sources.originCountry, input.countries.slice(0, 20)));
      if (input.primaryOnly) filters.push(eq(sources.isPrimarySource, true));
      const rightsFilter = resolveRightsFilter(input.rightsFilter);
      if (rightsFilter) filters.push(rightsFilter);

      const rows = await db
        .select({ source: sources, localization: sourceLocalizations })
        .from(sources)
        .leftJoin(sourceLocalizations, eq(sources.id, sourceLocalizations.sourceId))
        .where(and(...filters))
        .orderBy(asc(sources.createdDate), asc(sources.id))
        .limit((offset + limit + 1) * 4);

      const grouped = new Map<string, { source: any; localizations: any[] }>();
      for (const row of rows) {
        const entry = grouped.get(row.source.id) ?? { source: row.source, localizations: [] };
        if (row.localization) entry.localizations.push(row.localization);
        grouped.set(row.source.id, entry);
      }

      const page = [...grouped.values()].slice(offset, offset + limit + 1);
      const hasMore = page.length > limit;
      const items = await Promise.all(page.slice(0, limit).map(async ({ source, localizations }) => {
        const resolved = resolveLocalization(localizations, language, source.originalLanguage);
        return {
          sourceId: source.id,
          title: resolved.value?.title ?? source.titleOriginal,
          abstract: trimText(resolved.value?.abstract ?? resolved.value?.content ?? source.contentOriginal, 600),
          sourceType: source.sourceType,
          isPrimarySource: source.isPrimarySource,
          originCountry: source.originCountry,
          institution: source.institution,
          date: source.createdDate ?? source.publishedDate,
          canonicalUrl: source.canonicalUrl,
          archiveIdentifier: source.archiveIdentifier,
          license: source.license,
          rightsStatus: source.rightsStatus,
          verificationStatus: source.verificationStatus,
          requestedLanguage: resolved.requestedLanguage,
          resolvedLanguage: resolved.resolvedLanguage,
          fallbackUsed: resolved.fallbackUsed,
          fallbackReason: resolved.fallbackReason,
          availableLanguages: resolved.availableLanguages,
          originalLanguage: source.originalLanguage,
          claimContexts: await getClaimContextsForSource(db, source.id, language),
        };
      }));

      return {
        items,
        nextCursor: hasMore ? encodeCursor(offset + limit) : undefined,
        language,
      };
    },

    async getSource(rawInput) {
      const language = parseLanguage(rawInput.language);
      const maxChars = Math.min(Math.max(rawInput.maxChars ?? 12_000, 200), 50_000);
      const [source] = await db
        .select()
        .from(sources)
        .where(and(eq(sources.id, rawInput.sourceId), eq(sources.verificationStatus, "published")))
        .limit(1);

      if (!source) throw new CatalogNotFoundError(`Published source not found: ${rawInput.sourceId}`);

      const localizations = await db
        .select()
        .from(sourceLocalizations)
        .where(eq(sourceLocalizations.sourceId, source.id));
      const resolved = resolveLocalization(localizations, language, source.originalLanguage);

      let fragments: Record<string, unknown>[] | undefined;
      if (rawInput.includeFragments !== false) {
        const fragmentRows = await db
          .select()
          .from(sourceFragments)
          .where(eq(sourceFragments.sourceId, source.id))
          .orderBy(asc(sourceFragments.locatorValue));
        const fragmentIds = fragmentRows.map((fragment: any) => fragment.id);
        const localizationRows = fragmentIds.length
          ? await db.select().from(fragmentLocalizations).where(inArray(fragmentLocalizations.fragmentId, fragmentIds))
          : [];

        fragments = fragmentRows.map((fragment: any) => {
          const candidates = localizationRows.filter((row: any) => row.fragmentId === fragment.id);
          const fragmentResolved = resolveLocalization(candidates, language, source.originalLanguage);
          return {
            fragmentId: fragment.id,
            locator: { type: fragment.locatorType, value: fragment.locatorValue },
            text: trimText(fragmentResolved.value?.text ?? fragment.textOriginal, maxChars),
            originalText: rawInput.includeOriginal ? trimText(fragment.textOriginal, maxChars) : undefined,
            requestedLanguage: fragmentResolved.requestedLanguage,
            resolvedLanguage: fragmentResolved.resolvedLanguage,
            fallbackUsed: fragmentResolved.fallbackUsed,
            ocrConfidence: fragment.ocrConfidence,
            reviewStatus: fragment.reviewStatus,
          };
        });
      }

      const media = await db.select().from(mediaAssets).where(eq(mediaAssets.sourceId, source.id));
      const claimContexts = await getClaimContextsForSource(db, source.id, language);
      return {
        sourceId: source.id,
        title: resolved.value?.title ?? source.titleOriginal,
        abstract: trimText(resolved.value?.abstract, maxChars),
        content: trimText(resolved.value?.content ?? source.contentOriginal, maxChars),
        originalTitle: rawInput.includeOriginal ? source.titleOriginal : undefined,
        originalContent: rawInput.includeOriginal ? trimText(source.contentOriginal, maxChars) : undefined,
        sourceType: source.sourceType,
        isPrimarySource: source.isPrimarySource,
        originCountry: source.originCountry,
        institution: source.institution,
        authorOrCreator: source.authorOrCreator,
        createdDate: source.createdDate,
        publishedDate: source.publishedDate,
        historicalPeriod: source.historicalPeriod,
        canonicalUrl: source.canonicalUrl,
        archiveIdentifier: source.archiveIdentifier,
        accessedAt: source.accessedAt,
        license: source.license,
        rightsStatus: source.rightsStatus,
        reuseTerms: source.reuseTerms,
        attributionText: source.attributionText,
        checksum: source.checksum,
        version: source.version,
        verificationStatus: source.verificationStatus,
        requestedLanguage: resolved.requestedLanguage,
        resolvedLanguage: resolved.resolvedLanguage,
        fallbackUsed: resolved.fallbackUsed,
        fallbackReason: resolved.fallbackReason,
        availableLanguages: resolved.availableLanguages,
        originalLanguage: source.originalLanguage,
        fragments,
        claimContexts,
        media: media.map((asset: any) => ({
          mediaId: asset.id,
          kind: asset.kind,
          externalUrl: asset.externalUrl,
          thumbnailUrl: asset.thumbnailUrl,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          durationMs: asset.durationMs,
          rightsStatus: asset.rightsStatus,
          creditLine: asset.creditLine,
          publicDeliveryMode: asset.publicDeliveryMode,
        })),
      };
    },

    async searchMedia(rawInput) {
      const input = rawInput ?? {};
      const language = parseLanguage(input.language);
      const limit = clampLimit(input.limit);
      const offset = decodeCursor(input.cursor);
      const query = input.query?.trim().slice(0, 200);
      const filters: any[] = [eq(sources.verificationStatus, "published")];
      if (input.mediaTypes?.length) filters.push(inArray(mediaAssets.kind, input.mediaTypes.slice(0, 20)));
      if (input.rightsFilter === "reusable") {
        filters.push(inArray(mediaAssets.rightsStatus, ["verified_reusable", "public_domain"]));
      } else if (input.rightsFilter === "view_only") {
        filters.push(inArray(mediaAssets.rightsStatus, ["view_only", "verified_reusable", "public_domain"]));
      }
      if (query) {
        const pattern = `%${query}%`;
        filters.push(or(ilike(sources.titleOriginal, pattern), ilike(sourceLocalizations.title, pattern)));
      }

      const rows = await db
        .select({ asset: mediaAssets, source: sources, localization: sourceLocalizations })
        .from(mediaAssets)
        .innerJoin(sources, eq(mediaAssets.sourceId, sources.id))
        .leftJoin(sourceLocalizations, eq(sources.id, sourceLocalizations.sourceId))
        .where(and(...filters))
        .orderBy(asc(mediaAssets.id))
        .limit((offset + limit + 1) * 4);

      const grouped = new Map<string, { asset: any; source: any; localizations: any[] }>();
      for (const row of rows) {
        const entry = grouped.get(row.asset.id) ?? { asset: row.asset, source: row.source, localizations: [] };
        if (row.localization) entry.localizations.push(row.localization);
        grouped.set(row.asset.id, entry);
      }

      const page = [...grouped.values()].slice(offset, offset + limit + 1);
      const hasMore = page.length > limit;
      return {
        items: page.slice(0, limit).map(({ asset, source, localizations }) => {
          const resolved = resolveLocalization(localizations, language, source.originalLanguage);
          return {
            mediaId: asset.id,
            sourceId: source.id,
            title: resolved.value?.title ?? source.titleOriginal,
            kind: asset.kind,
            externalUrl: asset.externalUrl,
            thumbnailUrl: asset.thumbnailUrl,
            mimeType: asset.mimeType,
            width: asset.width,
            height: asset.height,
            durationMs: asset.durationMs,
            rightsStatus: asset.rightsStatus,
            allowedUses: asset.allowedUses,
            creditLine: asset.creditLine,
            publicDeliveryMode: asset.publicDeliveryMode,
            requestedLanguage: resolved.requestedLanguage,
            resolvedLanguage: resolved.resolvedLanguage,
            fallbackUsed: resolved.fallbackUsed,
          };
        }),
        nextCursor: hasMore ? encodeCursor(offset + limit) : undefined,
        language,
      };
    },

    async getTimeline(rawInput) {
      const input = rawInput ?? {};
      const language = parseLanguage(input.language);
      const limit = clampLimit(input.limit);
      const offset = decodeCursor(input.cursor);
      const filters: any[] = [eq(events.reviewStatus, "published")];
      if (input.dateFrom) filters.push(gte(events.startDate, input.dateFrom.slice(0, 10)));
      if (input.dateTo) filters.push(lte(events.startDate, input.dateTo.slice(0, 10)));
      if (input.topic) {
        const pattern = `%${input.topic.trim().slice(0, 200)}%`;
        filters.push(or(ilike(eventLocalizations.title, pattern), ilike(eventLocalizations.description, pattern)));
      }

      const rows = await db
        .select({ event: events, localization: eventLocalizations })
        .from(events)
        .leftJoin(eventLocalizations, eq(events.id, eventLocalizations.eventId))
        .where(and(...filters))
        .orderBy(asc(events.startDate), asc(events.id));

      const grouped = new Map<string, { event: any; localizations: any[] }>();
      for (const row of rows) {
        const entry = grouped.get(row.event.id) ?? { event: row.event, localizations: [] };
        if (row.localization) entry.localizations.push(row.localization);
        grouped.set(row.event.id, entry);
      }

      const page = [...grouped.values()].slice(offset, offset + limit + 1);
      const hasMore = page.length > limit;
      const items = [];
      for (const { event, localizations } of page.slice(0, limit)) {
        const resolved = resolveLocalization(localizations, language, "en");
        const evidence = await db
          .select({ sourceId: sourceEventLinks.sourceId, fragmentId: sourceEventLinks.fragmentId })
          .from(sourceEventLinks)
          .where(eq(sourceEventLinks.eventId, event.id));
        items.push({
          eventId: event.id,
          title: resolved.value?.title ?? event.id,
          description: resolved.value?.description ?? resolved.value?.content ?? resolved.value?.abstract ?? resolved.value?.text,
          startDate: event.startDate,
          endDate: event.endDate,
          datePrecision: event.datePrecision,
          eventType: event.eventType,
          placeName: event.placeName,
          evidence,
          requestedLanguage: resolved.requestedLanguage,
          resolvedLanguage: resolved.resolvedLanguage,
          fallbackUsed: resolved.fallbackUsed,
        });
      }

      return {
        items,
        nextCursor: hasMore ? encodeCursor(offset + limit) : undefined,
        language,
      };
    },
  };
}
