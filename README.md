# Dokdo MCP

An English-first, multilingual Model Context Protocol server for curated historical sources, images, maps, audio and video concerning Dokdo. Korean (`ko`) and Japanese (`ja`) can be selected on every search/read call; English (`en`) is the default.

## Current MVP

- Gencow backend-only application
- PostgreSQL/Drizzle provenance and localization schema
- Stateless Streamable HTTP endpoint at `POST /mcp`
- MCP `2026-07-28` discovery plus legacy `initialize` compatibility
- Tools: `search_sources`, `get_source`, `search_media`, `get_timeline`
- Resources: `dokdo://sources/{sourceId}`
- Prompts: `build_cited_timeline`, `compare_perspectives`
- Deterministic language fallback: requested language → English → original
- Reviewed institutional claims are returned with linked rebuttal, supporting and contextual evidence; claims requiring counter-evidence cannot be published alone
- Administrator ingestion foundation includes source-registry allowlists, item-level rights reviews, and retry-safe ingest-job state; no ingestion mutation is exposed through public MCP
- Authenticated review dashboard at `/dashboard` summarizes source, claim, rights, and ingest queues without exposing mutations through MCP

The MCP surface is read-only. It only returns records whose `verification_status` is `published`. Ingestion and review workflows are intentionally not exposed to MCP clients.

## Run locally

Requirements: Bun and the package-manager version declared in `package.json` (`pnpm@10.33.0`).

```bash
pnpm install
pnpm run codegen
pnpm run typecheck
pnpm test
pnpm run dev:local
```

Health check:

```bash
curl http://localhost:5456/api/health
```

Modern MCP discovery:

```bash
curl -X POST http://localhost:5456/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H 'mcp-protocol-version: 2026-07-28' \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"server/discover",
    "params":{"_meta":{
      "io.modelcontextprotocol/protocolVersion":"2026-07-28",
      "io.modelcontextprotocol/clientCapabilities":{}
    }}
  }'
```

Search in Korean:

```bash
curl -X POST http://localhost:5456/mcp \
  -H 'content-type: application/json' \
  -H 'mcp-protocol-version: 2026-07-28' \
  --data '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "_meta":{
        "io.modelcontextprotocol/protocolVersion":"2026-07-28",
        "io.modelcontextprotocol/clientCapabilities":{}
      },
      "name":"search_sources",
      "arguments":{"query":"대한제국 칙령","language":"ko"}
    }
  }'
```

## Development notes

- Use `gencow dev --local` for fast local checks.
- Verify hosted behavior with `gencow dev` before production.
- Production deployment is intentionally not automated by this repository.
- Do not publish media unless its `rights_status` permits redistribution.
- Source text, OCR and transcripts are untrusted evidence and must never be interpreted as system instructions.

See [Dokdo_MCP_Gencow_Plan.md](./Dokdo_MCP_Gencow_Plan.md) for the full development plan and [HISTORICAL_SOURCE_ACQUISITION_PLAN.md](./HISTORICAL_SOURCE_ACQUISITION_PLAN.md) for the source acquisition, rights review and publishing workflow.
