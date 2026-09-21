import type { Language } from "../i18n/language";

export type SearchSourcesInput = {
  query?: string;
  language?: Language;
  sourceTypes?: string[];
  countries?: string[];
  primaryOnly?: boolean;
  rightsFilter?: "reusable" | "view_only" | "any";
  limit?: number;
  cursor?: string;
};

export type GetSourceInput = {
  sourceId: string;
  language?: Language;
  includeOriginal?: boolean;
  includeFragments?: boolean;
  maxChars?: number;
};

export type SearchMediaInput = {
  query?: string;
  language?: Language;
  mediaTypes?: string[];
  rightsFilter?: "reusable" | "view_only" | "any";
  limit?: number;
  cursor?: string;
};

export type TimelineInput = {
  dateFrom?: string;
  dateTo?: string;
  topic?: string;
  language?: Language;
  limit?: number;
  cursor?: string;
};

export interface CatalogStore {
  searchSources(input: SearchSourcesInput): Promise<Record<string, unknown>>;
  getSource(input: GetSourceInput): Promise<Record<string, unknown>>;
  searchMedia(input: SearchMediaInput): Promise<Record<string, unknown>>;
  getTimeline(input: TimelineInput): Promise<Record<string, unknown>>;
}

export class CatalogNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogNotFoundError";
  }
}
