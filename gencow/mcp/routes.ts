import { httpRoute } from "../runtime";
import { createCatalogStore } from "../catalog/store";
import { createMcpHandler, SUPPORTED_PROTOCOL_VERSIONS } from "./protocol";

export const healthRoute = httpRoute.get
  .path("/api/health")
  .allowAnonymous()
  .handler(async () => ({
    headers: { "cache-control": "no-store" },
    body: {
      status: "ok",
      service: "dokdo-mcp",
      version: "1.3.0",
      defaultLanguage: "en",
      supportedLanguages: ["en", "ko", "ja"],
      supportedProtocolVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
    },
  }));

export const mcpPostRoute = httpRoute.post
  .path("/mcp")
  .allowAnonymous()
  .handler(async ({ context, request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        headers: { "cache-control": "no-store" },
        body: { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      };
    }

    const handleMcp = createMcpHandler(createCatalogStore(context.db));
    const response = await handleMcp(body, request.headers);
    return {
      status: response.status,
      headers: {
        "cache-control": "no-store",
        ...(response.headers ?? {}),
      },
      ...(response.body ? { body: response.body } : {}),
    };
  });

export const mcpGetRoute = httpRoute.get
  .path("/mcp")
  .allowAnonymous()
  .handler(async () => ({
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
    body: {
      error: "This stateless MCP endpoint accepts POST requests. Request-scoped SSE is not enabled.",
    },
  }));

export const mcpDeleteRoute = httpRoute.delete
  .path("/mcp")
  .allowAnonymous()
  .handler(async () => ({
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
    body: { error: "This server does not create transport sessions." },
  }));
