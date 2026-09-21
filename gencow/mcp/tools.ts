import { parseLanguage } from "../i18n/language";
import type { CatalogStore } from "../catalog/types";

export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
};

const languageProperty = {
  type: "string",
  enum: ["en", "ko", "ja"],
  default: "en",
  description: "Response language. English is the default; Korean and Japanese are optional.",
};

export const TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: "search_sources",
    title: "Search Dokdo Sources",
    description: "Search published Dokdo historical sources with provenance, rights and deterministic language fallback.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", maxLength: 200 },
        language: languageProperty,
        sourceTypes: { type: "array", maxItems: 20, items: { type: "string" } },
        countries: { type: "array", maxItems: 20, items: { type: "string" } },
        primaryOnly: { type: "boolean", default: false },
        rightsFilter: { type: "string", enum: ["reusable", "view_only", "any"], default: "any" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        cursor: { type: "string" },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_source",
    title: "Get a Dokdo Source",
    description: "Read one published source, its exact citation fragments and linked media.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["sourceId"],
      properties: {
        sourceId: { type: "string", minLength: 1 },
        language: languageProperty,
        includeOriginal: { type: "boolean", default: false },
        includeFragments: { type: "boolean", default: true },
        maxChars: { type: "integer", minimum: 200, maximum: 50000, default: 12000 },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "search_media",
    title: "Search Dokdo Media",
    description: "Search published maps, images, audio and video without embedding large media in the response.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", maxLength: 200 },
        language: languageProperty,
        mediaTypes: { type: "array", maxItems: 20, items: { type: "string" } },
        rightsFilter: { type: "string", enum: ["reusable", "view_only", "any"], default: "any" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        cursor: { type: "string" },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_timeline",
    title: "Get a Cited Dokdo Timeline",
    description: "Return reviewed historical events with links to supporting source and fragment IDs.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        dateFrom: { type: "string", description: "Inclusive ISO date or year." },
        dateTo: { type: "string", description: "Inclusive ISO date or year." },
        topic: { type: "string", maxLength: 200 },
        language: languageProperty,
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        cursor: { type: "string" },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

function requireObject(value: unknown): Record<string, any> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("arguments must be an object");
  return value as Record<string, any>;
}

function assertAllowedKeys(args: Record<string, any>, allowed: string[]) {
  const extras = Object.keys(args).filter((key) => !allowed.includes(key));
  if (extras.length) throw new Error(`Unknown argument(s): ${extras.join(", ")}`);
}

function optionalString(args: Record<string, any>, key: string, maxLength = 200) {
  if (args[key] === undefined) return;
  if (typeof args[key] !== "string" || args[key].length > maxLength) {
    throw new Error(`${key} must be a string of at most ${maxLength} characters`);
  }
}

function optionalStringArray(args: Record<string, any>, key: string) {
  if (args[key] === undefined) return;
  if (!Array.isArray(args[key]) || args[key].length > 20 || args[key].some((item: unknown) => typeof item !== "string")) {
    throw new Error(`${key} must be an array of at most 20 strings`);
  }
}

function optionalBoolean(args: Record<string, any>, key: string) {
  if (args[key] !== undefined && typeof args[key] !== "boolean") throw new Error(`${key} must be a boolean`);
}

function optionalInteger(args: Record<string, any>, key: string, minimum: number, maximum: number) {
  if (args[key] === undefined) return;
  if (!Number.isInteger(args[key]) || args[key] < minimum || args[key] > maximum) {
    throw new Error(`${key} must be an integer from ${minimum} to ${maximum}`);
  }
}

function optionalEnum(args: Record<string, any>, key: string, values: string[]) {
  if (args[key] !== undefined && !values.includes(args[key])) {
    throw new Error(`${key} must be one of: ${values.join(", ")}`);
  }
}

function validateCommon(args: Record<string, any>) {
  if ("language" in args) args.language = parseLanguage(args.language);
  optionalInteger(args, "limit", 1, 50);
  optionalString(args, "cursor", 200);
}

export async function callTool(store: CatalogStore, name: string, rawArguments: unknown) {
  const args = requireObject(rawArguments);
  validateCommon(args);

  let structuredContent: Record<string, unknown>;
  switch (name) {
    case "search_sources":
      assertAllowedKeys(args, ["query", "language", "sourceTypes", "countries", "primaryOnly", "rightsFilter", "limit", "cursor"]);
      optionalString(args, "query");
      optionalStringArray(args, "sourceTypes");
      optionalStringArray(args, "countries");
      optionalBoolean(args, "primaryOnly");
      optionalEnum(args, "rightsFilter", ["reusable", "view_only", "any"]);
      structuredContent = await store.searchSources(args);
      break;
    case "get_source":
      assertAllowedKeys(args, ["sourceId", "language", "includeOriginal", "includeFragments", "maxChars"]);
      if (typeof args.sourceId !== "string" || !args.sourceId.trim()) throw new Error("sourceId is required");
      optionalBoolean(args, "includeOriginal");
      optionalBoolean(args, "includeFragments");
      optionalInteger(args, "maxChars", 200, 50_000);
      structuredContent = await store.getSource(args as any);
      break;
    case "search_media":
      assertAllowedKeys(args, ["query", "language", "mediaTypes", "rightsFilter", "limit", "cursor"]);
      optionalString(args, "query");
      optionalStringArray(args, "mediaTypes");
      optionalEnum(args, "rightsFilter", ["reusable", "view_only", "any"]);
      structuredContent = await store.searchMedia(args);
      break;
    case "get_timeline":
      assertAllowedKeys(args, ["dateFrom", "dateTo", "topic", "language", "limit", "cursor"]);
      optionalString(args, "dateFrom", 10);
      optionalString(args, "dateTo", 10);
      optionalString(args, "topic");
      structuredContent = await store.getTimeline(args);
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    resultType: "complete",
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  };
}
