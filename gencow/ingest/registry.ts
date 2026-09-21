export const DISCOVERY_METHODS = ["api", "rss", "sitemap", "manual"] as const;
export type DiscoveryMethod = (typeof DISCOVERY_METHODS)[number];

export type SourceRegistryInput = {
  id: string;
  institution: string;
  country: string;
  baseUrl: string;
  discoveryMethod: DiscoveryMethod;
  allowedDomains: string[];
  apiDailyLimit?: number;
  metadataReuse?: string;
  fileReuseDefault?: string;
  requiresItemRightsReview?: boolean;
  enabled?: boolean;
};

function hostname(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("baseUrl must be an absolute URL");
  }
  if (url.protocol !== "https:") throw new Error("baseUrl must use HTTPS");
  return url.hostname.toLowerCase();
}

export function validateSourceRegistry(input: SourceRegistryInput): SourceRegistryInput {
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(input.id)) throw new Error("id must be a stable lowercase registry identifier");
  if (!input.institution.trim() || !input.country.trim()) throw new Error("institution and country are required");
  const baseHost = hostname(input.baseUrl);
  if (!input.allowedDomains.length) throw new Error("allowedDomains must contain the official hostname");
  const domains = [...new Set(input.allowedDomains.map((domain) => domain.trim().toLowerCase()).filter(Boolean))];
  if (!domains.some((domain) => baseHost === domain || baseHost.endsWith(`.${domain}`))) {
    throw new Error("allowedDomains must include the baseUrl hostname");
  }
  if (input.apiDailyLimit !== undefined && (!Number.isInteger(input.apiDailyLimit) || input.apiDailyLimit < 1)) {
    throw new Error("apiDailyLimit must be a positive integer");
  }
  return {
    ...input,
    baseUrl: input.baseUrl.replace(/\/$/, ""),
    allowedDomains: domains,
    requiresItemRightsReview: input.requiresItemRightsReview ?? true,
    enabled: input.enabled ?? false,
  };
}

export function isAllowedSourceUrl(registry: SourceRegistryInput, candidate: string): boolean {
  const normalized = validateSourceRegistry(registry);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return normalized.allowedDomains.some((domain) => url.hostname.toLowerCase() === domain || url.hostname.toLowerCase().endsWith(`.${domain}`));
}
