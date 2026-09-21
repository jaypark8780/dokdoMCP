import { and, eq, inArray } from "drizzle-orm";
import { resolveLocalization, type Language } from "../i18n/language";
import {
  claimEvidence,
  claimLocalizations,
  claims,
  fragmentLocalizations,
  sourceClaims,
  sourceFragments,
  sourceLocalizations,
  sources,
} from "../schema";

type DbClient = any;

export async function getClaimContextsForSource(db: DbClient, sourceId: string, language: Language) {
  const linkedClaims = await db
    .select({ link: sourceClaims, claim: claims })
    .from(sourceClaims)
    .innerJoin(claims, eq(sourceClaims.claimId, claims.id))
    .where(and(eq(sourceClaims.sourceId, sourceId), eq(claims.reviewStatus, "published")));

  const contexts = [];
  for (const { link, claim } of linkedClaims) {
    const localizations = await db
      .select()
      .from(claimLocalizations)
      .where(and(eq(claimLocalizations.claimId, claim.id), eq(claimLocalizations.reviewStatus, "published")));
    const resolvedClaim = resolveLocalization(localizations, language, "en");

    const evidenceRows = await db
      .select({ evidence: claimEvidence, source: sources, fragment: sourceFragments })
      .from(claimEvidence)
      .innerJoin(sources, eq(claimEvidence.sourceId, sources.id))
      .leftJoin(sourceFragments, eq(claimEvidence.fragmentId, sourceFragments.id))
      .where(
        and(
          eq(claimEvidence.claimId, claim.id),
          eq(claimEvidence.reviewStatus, "published"),
          eq(sources.verificationStatus, "published"),
        ),
      );

    const evidenceSourceIds: string[] = [
      ...new Set<string>(
        evidenceRows.map((row: any) => row.source.id).filter((id: unknown): id is string => typeof id === "string"),
      ),
    ];
    const evidenceFragmentIds: string[] = [
      ...new Set<string>(
        evidenceRows.map((row: any) => row.fragment?.id).filter((id: unknown): id is string => typeof id === "string"),
      ),
    ];
    const evidenceLocalizations = evidenceSourceIds.length
      ? await db.select().from(sourceLocalizations).where(inArray(sourceLocalizations.sourceId, evidenceSourceIds))
      : [];
    const evidenceFragmentLocalizations = evidenceFragmentIds.length
      ? await db.select().from(fragmentLocalizations).where(inArray(fragmentLocalizations.fragmentId, evidenceFragmentIds))
      : [];

    const evidence = evidenceRows.map((row: any) => {
      const sourceLocalization = resolveLocalization(
        evidenceLocalizations.filter((item: any) => item.sourceId === row.source.id),
        language,
        row.source.originalLanguage,
      );
      const fragmentLocalization = row.fragment
        ? resolveLocalization(
            evidenceFragmentLocalizations.filter((item: any) => item.fragmentId === row.fragment.id),
            language,
            row.source.originalLanguage,
          )
        : undefined;

      return {
        relationship: row.evidence.relationship,
        sourceId: row.source.id,
        fragmentId: row.fragment?.id,
        title: sourceLocalization.value?.title ?? row.source.titleOriginal,
        institution: row.source.institution,
        originCountry: row.source.originCountry,
        sourceType: row.source.sourceType,
        locator: row.fragment
          ? { type: row.fragment.locatorType, value: row.fragment.locatorValue }
          : undefined,
        excerpt: fragmentLocalization?.value?.text ?? row.fragment?.textOriginal,
        relevanceNote: row.evidence.relevanceNote,
        canonicalUrl: row.source.canonicalUrl,
        requestedLanguage: language,
        resolvedLanguage: fragmentLocalization?.resolvedLanguage ?? sourceLocalization.resolvedLanguage,
      };
    });

    contexts.push({
      claimId: claim.id,
      sourceRelationship: link.relationship,
      claimantCountry: claim.claimantCountry,
      claimantInstitution: claim.claimantInstitution,
      claimType: claim.claimType,
      statement: resolvedClaim.value?.statement,
      assessmentStatus: claim.assessmentStatus,
      assessmentSummary: resolvedClaim.value?.assessmentSummary,
      editorialNotice:
        "This is an institutional claim, not a standalone fact. Reviewed supporting, contradicting and contextual evidence is attached below.",
      rebuttalEvidence: evidence.filter((item: any) => item.relationship === "contradicts"),
      supportingEvidence: evidence.filter((item: any) => item.relationship === "supports"),
      contextualEvidence: evidence.filter((item: any) => item.relationship === "contextualizes"),
      requestedLanguage: language,
      resolvedLanguage: resolvedClaim.resolvedLanguage,
      fallbackUsed: resolvedClaim.fallbackUsed,
    });
  }

  return contexts;
}
