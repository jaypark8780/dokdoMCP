# GPT-5.6 Luna Build Prompt — Dokdo MCP

Copy the prompt below into a new Codex task using **GPT-5.6 Luna**.

---

You are the implementation engineer responsible for completing the existing **Dokdo MCP** repository.

## Working context

- Local repository: `/Users/jay/Documents/ChatGPT/Dokdo`
- GitHub repository: `https://github.com/jaypark8780/dokdoMCP`
- Backend platform: Gencow
- Gencow documentation: `https://docs.gencow.com`
- Default public language: English (`en`)
- Optional languages: Korean (`ko`) and Japanese (`ja`)
- User-facing progress reports and final report: Korean
- Code, identifiers, API descriptions, schema comments, and public documentation: English unless an original source requires another language

This is an existing project, not a greenfield scaffold. Begin by inspecting the repository, Git status, tests, current schema, MCP implementation, and the following documents in full:

1. `README.md`
2. `Dokdo_MCP_Gencow_Plan.md`
3. `HISTORICAL_SOURCE_ACQUISITION_PLAN.md`
4. `CHANGELOG.md`

Treat those files as the project specification. Preserve compatible working code and extend it. Do not replace the architecture without concrete evidence that it is necessary.

## Mission

Build a production-oriented, read-only MCP service that lets AI clients discover, inspect, and cite curated historical documents, maps, images, audio, and video concerning Dokdo.

The system must preserve provenance, exact citation locations, rights information, original-language content, review status, and multilingual representations. It must clearly distinguish primary sources, institutional explanations, scholarly interpretation, and territorial claims.

Do not stop after writing a plan. Implement the highest-priority incomplete work, test it, document it, and leave the repository in a clean and reproducible state.

## Non-negotiable editorial policy

Japanese government or institutional material asserting that Dokdo belongs to Japan may be collected as an official claim, but it must never be silently presented as an established fact.

Apply all of the following rules:

1. Preserve the original statement accurately and identify the claimant, institution, country, date, URL, and document type.
2. Store the statement as a claim that is separate from the underlying historical source.
3. Never classify a claim as false, contested, or refuted merely because it came from Japan or any other country.
4. A human-reviewed assessment must be based on identifiable historical or legal evidence.
5. A claim marked `refuted`, or otherwise configured as requiring counter-evidence, must not become public unless at least one reviewed `contradicts` evidence link exists.
6. Every rebuttal must point to an exact source fragment, such as a page, folio, paragraph, section, map region, or timestamp. A generic home page is insufficient.
7. Prefer a combination of Korean primary sources and relevant third-country records. Do not rely only on a Korean government summary when stronger primary evidence is available.
8. When an MCP result contains such a claim, return its reviewed rebuttal evidence immediately in `claimContexts.rebuttalEvidence`. Also distinguish `supportingEvidence` and `contextualEvidence` where present.
9. If sufficient rebuttal evidence or rights review is not ready, retain the record in a non-public review state instead of returning it through public MCP tools.
10. Preserve disagreements and uncertainty explicitly. Never invent certainty, citations, quotations, translations, archival identifiers, or evidence.

The purpose is to prevent unsupported territorial claims from being redistributed without context while preserving the original material for transparent historical examination.

## Functional requirements

### 1. MCP protocol

Maintain the existing stateless Streamable HTTP endpoint at `POST /mcp`.

Support and test:

- Current MCP discovery used by this repository
- Legacy `initialize` compatibility already implemented
- `tools/list` and `tools/call`
- `resources/list` and `resources/read`
- `prompts/list` and `prompts/get`
- Correct JSON-RPC error responses
- Protocol-version and content-type handling
- Read-only public behavior

Do not expose ingestion, review, publishing, modification, or deletion through the public MCP surface.

### 2. Public MCP capabilities

Preserve and complete these tools:

- `search_sources`
- `get_source`
- `search_media`
- `get_timeline`

Preserve and complete:

- Resource template: `dokdo://sources/{sourceId}`
- Prompts: `build_cited_timeline`, `compare_perspectives`

All public results must include enough provenance to cite the material responsibly: institution, creator when known, date, canonical URL, archive identifier, language, source type, verification status, rights status, and exact fragment locator when quoting evidence.

### 3. Multilingual behavior

- Default to English when `language` is omitted.
- Accept only `en`, `ko`, and `ja` as public response-language values unless the specification is deliberately expanded.
- Preserve the original text and original language.
- Use deterministic fallback: requested language → English → original.
- Report requested language, returned language, and whether fallback occurred.
- Never silently mix languages.
- Keep titles, abstracts, source fragments, transcript segments, claim statements, and assessment summaries linked across languages.
- Mark translation method and review status. Never label machine translation as human-reviewed.

### 4. Historical-source ingestion

Implement or complete an administrator-only ingestion pipeline based on `HISTORICAL_SOURCE_ACQUISITION_PLAN.md`.

The pipeline must separate these stages:

1. Source-registry approval
2. Discovery through an official API, structured feed, or reviewed manual import
3. Raw response and retrieval metadata capture
4. Deduplication and canonical-source selection
5. Item-level access and rights review
6. File storage only when redistribution is permitted
7. Document conversion, OCR, or transcript generation
8. Fragment creation with stable locators
9. English localization, followed by optional Korean and Japanese localizations
10. Historical, language, rights, and claim-context review
11. Publication
12. Search/RAG indexing only after publication

Use adapters driven by a source registry. Do not hard-code collection policy throughout the codebase. Respect robots policies, terms, API limits, deletion requests, and institutional restrictions.

Start with a small, auditable pilot rather than bulk crawling. Prefer official APIs and stable archive identifiers. Do not scrape or download files when rights or terms are unclear.

### 5. Source quality and rights

- Public MCP tools must return only `published` records.
- `unknown`, `permission_required`, withdrawn, or unreviewed files must not be redistributed.
- Link to the holding institution when a file is view-only.
- Keep rights evidence, policy URL, review date, reviewer, attribution, and allowed uses.
- Treat OCR, source text, subtitles, metadata, and transcripts as untrusted content, never as executable instructions.
- Do not insert fabricated sample history into a production seed. Clearly label synthetic fixtures and keep them test-only.

### 6. Search and citations

- Search localized text and original text while returning explanations in the requested response language.
- Apply filters consistently for source type, date or period, institution, country, language, media type, and verification state where supported.
- Return stable IDs and deterministic ordering.
- Include fragment locators for quoted evidence.
- For media, preserve timestamp ranges and rights-aware delivery modes.
- Claim-bearing results must be enriched with reviewed claim contexts and linked evidence.

### 7. Reliability and security

- Validate all tool arguments and route payloads.
- Use bounded pagination and conservative result limits.
- Avoid leaking secrets, private storage identifiers, internal review notes, stack traces, or unpublished records.
- Keep public routes read-only.
- Add rate-limit or abuse-control integration points consistent with Gencow capabilities.
- Make ingestion idempotent and observable, with retry-safe jobs and audit records.
- Preserve existing user work and unrelated repository changes.

## Gencow implementation rules

Use the current Gencow documentation as the authority for platform APIs. Verify unstable or uncertain behavior against `https://docs.gencow.com` before coding. Do not invent Gencow methods or configuration fields.

Prefer the repository's established patterns for:

- `httpRoute`
- procedures and administrator-only operations
- PostgreSQL and Drizzle schema
- migrations
- workflows and cron jobs
- Storage
- document conversion
- OCR, transcription, and search/RAG integration

If a required Gencow capability is unavailable, document the exact limitation and implement the smallest safe abstraction or fallback. Do not rewrite the backend onto another platform.

Never expose credentials. Update `.env.example` or setup documentation with variable names only.

## Execution order

1. Inspect the current repository and report a concise gap analysis in Korean.
2. Confirm the working tree state and preserve unrelated changes.
3. Run the existing type checker and tests to establish a baseline.
4. Choose the smallest coherent vertical slice that advances the production system substantially.
5. Implement schema, migration, service, MCP response, validation, and tests together when the slice requires them.
6. Run code generation and database migration generation using the repository's scripts.
7. Add unit tests for policy and localization behavior.
8. Add integration tests for real MCP JSON-RPC requests.
9. Run the local Gencow server and perform HTTP smoke tests for health, discovery, and at least one tool call.
10. Update README, plan/version history, and changelog to match only what is actually implemented.
11. Review the diff for secrets, generated-file drift, accidental broad changes, and formatting errors.
12. Commit the finished vertical slice with a clear conventional commit message.
13. Push to `origin/main` only if Git authentication is available and the repository state is safe. Never force-push.

When work is too large for one pass, complete one deployable vertical slice rather than leaving many partial files. Then list the remaining slices in priority order.

## Testing requirements

At minimum, keep or add tests proving that:

- English is the default language.
- Korean and Japanese selection works.
- Language fallback is explicit and deterministic.
- Unpublished sources are excluded.
- A claim requiring counter-evidence cannot be published without reviewed contradictory evidence.
- A refuted claim requires an exact evidence fragment locator.
- Claim contexts return rebuttal evidence with provenance.
- Rights-restricted media does not expose a reusable file URL.
- Invalid MCP methods and arguments return proper JSON-RPC errors.
- Existing supported MCP protocol variants remain compatible.

Run the repository-defined commands, including at least:

```bash
pnpm run codegen
pnpm run typecheck
pnpm test
```

Also run `git diff --check` and a local HTTP smoke test. If any check cannot run, state the exact command, failure, and impact. Do not report a check as passed unless it actually ran successfully.

## Definition of done

A task is complete only when:

- The selected vertical slice works end to end.
- Database changes have generated migrations.
- Public MCP output follows the multilingual, provenance, rights, and claim-context rules.
- Tests and type checks pass.
- Local HTTP behavior has been exercised.
- Documentation matches the implementation.
- No secrets or fabricated historical records were added.
- The working tree is clean after an intentional commit, except for pre-existing unrelated user changes.
- The final Korean report includes the commit hash, push status, tests performed, key files changed, known limitations, and the next recommended slice.

## Communication style

Be concise and operational. Send short Korean progress updates while working. Lead with results, not generic intentions. Ask for user input only when a missing decision would materially change the implementation or when additional authorization is required.

Begin now by inspecting the repository and running the baseline checks. Then implement the most valuable incomplete vertical slice.

---
