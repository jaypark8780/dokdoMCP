import { describe, expect, test } from "bun:test";
import type { CatalogStore } from "../gencow/catalog/types";
import { createMcpHandler, LATEST_PROTOCOL_VERSION } from "../gencow/mcp/protocol";

const sample = {
  sourceId: "source-1",
  title: "Imperial Ordinance No. 41",
  requestedLanguage: "en",
  resolvedLanguage: "en",
  fallbackUsed: false,
};

function createTestStore(): CatalogStore {
  return {
    async searchSources(input) {
      return { items: [{ ...sample, requestedLanguage: input.language ?? "en" }], language: input.language ?? "en" };
    },
    async getSource(input) {
      if (input.sourceId !== "source-1") throw new Error("Published source not found");
      return { ...sample, requestedLanguage: input.language ?? "en" };
    },
    async searchMedia(input) {
      return { items: [], language: input.language ?? "en" };
    },
    async getTimeline(input) {
      return { items: [], language: input.language ?? "en" };
    },
  };
}

const modernMeta = {
  "io.modelcontextprotocol/protocolVersion": LATEST_PROTOCOL_VERSION,
  "io.modelcontextprotocol/clientCapabilities": {},
};

describe("Dokdo MCP protocol", () => {
  const handle = createMcpHandler(createTestStore());

  test("advertises modern and legacy protocol versions", async () => {
    const response = await handle({
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: { _meta: modernMeta },
    }, { "mcp-protocol-version": LATEST_PROTOCOL_VERSION });

    expect(response.status).toBe(200);
    expect((response.body as any).result.supportedVersions).toContain(LATEST_PROTOCOL_VERSION);
    expect((response.body as any).result.capabilities.tools).toEqual({});
  });

  test("supports legacy initialize", async () => {
    const response = await handle({
      jsonrpc: "2.0",
      id: "init",
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } },
    });

    expect((response.body as any).result.protocolVersion).toBe("2025-11-25");
    expect((response.body as any).result.serverInfo.name).toBe("dokdo-mcp");
  });

  test("uses English by default and accepts Korean", async () => {
    const english = await handle({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { _meta: modernMeta, name: "search_sources", arguments: {} },
    }, { "mcp-protocol-version": LATEST_PROTOCOL_VERSION });
    expect((english.body as any).result.structuredContent.language).toBe("en");

    const korean = await handle({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { _meta: modernMeta, name: "search_sources", arguments: { language: "ko" } },
    }, { "mcp-protocol-version": LATEST_PROTOCOL_VERSION });
    expect((korean.body as any).result.structuredContent.language).toBe("ko");
  });

  test("rejects unsupported languages", async () => {
    const response = await handle({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { _meta: modernMeta, name: "search_sources", arguments: { language: "fr" } },
    }, { "mcp-protocol-version": LATEST_PROTOCOL_VERSION });
    expect((response.body as any).error.code).toBe(-32602);
  });

  test("rejects undeclared tool arguments", async () => {
    const response = await handle({
      jsonrpc: "2.0",
      id: 41,
      method: "tools/call",
      params: { _meta: modernMeta, name: "search_sources", arguments: { unsafeUrl: "https://example.com" } },
    }, { "mcp-protocol-version": LATEST_PROTOCOL_VERSION });
    expect((response.body as any).error.code).toBe(-32602);
  });

  test("returns supported versions for an unknown modern version", async () => {
    const response = await handle({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/list",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "1900-01-01",
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    }, { "mcp-protocol-version": "1900-01-01" });
    expect(response.status).toBe(400);
    expect((response.body as any).error.code).toBe(-32022);
  });

  test("acknowledges notifications with HTTP 202", async () => {
    const response = await handle({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(response).toEqual({ status: 202 });
  });
});
