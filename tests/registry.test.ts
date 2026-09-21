import { describe, expect, test } from "bun:test";
import { isAllowedSourceUrl, validateSourceRegistry } from "../gencow/ingest/registry";

const registry = {
  id: "nak",
  institution: "National Archives of Korea",
  country: "KR",
  baseUrl: "https://www.archives.go.kr/",
  discoveryMethod: "api" as const,
  allowedDomains: ["archives.go.kr"],
};

describe("source registry policy", () => {
  test("normalizes and defaults a registry to disabled and item-level rights review", () => {
    const value = validateSourceRegistry(registry);
    expect(value.baseUrl).toBe("https://www.archives.go.kr");
    expect(value.enabled).toBe(false);
    expect(value.requiresItemRightsReview).toBe(true);
  });

  test("only allows HTTPS URLs on approved domains", () => {
    expect(isAllowedSourceUrl(registry, "https://search.archives.go.kr/item/1")).toBe(true);
    expect(isAllowedSourceUrl(registry, "http://www.archives.go.kr/item/1")).toBe(false);
    expect(isAllowedSourceUrl(registry, "https://example.com/item/1")).toBe(false);
  });

  test("rejects a registry whose allowlist omits the official hostname", () => {
    expect(() => validateSourceRegistry({ ...registry, allowedDomains: ["example.com"] })).toThrow();
  });
});
