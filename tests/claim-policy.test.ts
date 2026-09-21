import { describe, expect, test } from "bun:test";
import { validateClaimPublication } from "../gencow/claims/policy";

describe("claim publication policy", () => {
  test("blocks a claim that requires counter-evidence when none is published", () => {
    expect(() =>
      validateClaimPublication({
        assessmentStatus: "refuted",
        requiresCounterEvidence: true,
        evidence: [],
      }),
    ).toThrow("cannot be published");
  });

  test("requires an exact fragment for a refuted assessment", () => {
    expect(() =>
      validateClaimPublication({
        assessmentStatus: "refuted",
        requiresCounterEvidence: true,
        evidence: [
          { relationship: "contradicts", sourceId: "source-1", reviewStatus: "published" },
        ],
      }),
    ).toThrow("exact counter-evidence fragment");
  });

  test("requires counter-evidence for every refuted assessment", () => {
    expect(() => validateClaimPublication({ assessmentStatus: "refuted", requiresCounterEvidence: false, evidence: [] })).toThrow("cannot be published");
  });

  test("allows a reviewed rebuttal with a locator", () => {
    expect(() =>
      validateClaimPublication({
        assessmentStatus: "refuted",
        requiresCounterEvidence: true,
        evidence: [
          {
            relationship: "contradicts",
            sourceId: "source-1",
            fragmentId: "fragment-1",
            reviewStatus: "published",
          },
        ],
      }),
    ).not.toThrow();
  });
});
