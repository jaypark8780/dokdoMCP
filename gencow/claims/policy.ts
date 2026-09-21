export type ClaimEvidenceForPolicy = {
  relationship: "supports" | "contradicts" | "contextualizes" | string;
  sourceId: string;
  fragmentId?: string | null;
  reviewStatus: string;
};

export type ClaimForPublication = {
  assessmentStatus: string;
  requiresCounterEvidence: boolean;
  evidence: ClaimEvidenceForPolicy[];
};

/**
 * Prevents a reviewed territorial assertion from being published alone when
 * the editorial record says that counter-evidence is required.
 */
export function validateClaimPublication(claim: ClaimForPublication): void {
  if (!claim.requiresCounterEvidence) return;

  const reviewedCounterEvidence = claim.evidence.filter(
    (item) => item.relationship === "contradicts" && item.reviewStatus === "published",
  );
  if (reviewedCounterEvidence.length === 0) {
    throw new Error("A claim that requires counter-evidence cannot be published without a reviewed contradicting source");
  }

  if (claim.assessmentStatus === "refuted" && reviewedCounterEvidence.some((item) => !item.fragmentId)) {
    throw new Error("A refuted assessment requires an exact counter-evidence fragment locator");
  }
}
