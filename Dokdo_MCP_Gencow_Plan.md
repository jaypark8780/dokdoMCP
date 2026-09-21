# 독도 역사·이미지·영상 자료 MCP 서버 개발 계획서

> 문서 버전: **1.2.0**<br>
> 기준일: **2026-09-21**<br>
> 기본 제공 언어: **English (`en`)**<br>
> 선택 언어: **한국어 (`ko`), 日本語 (`ja`)**

## 문서 변경 이력

| 버전 | 날짜 | 주요 변경 |
|---|---|---|
| 1.0.0 | 2026-09-21 | 업로드된 아이디어와 Gencow 공식 문서를 바탕으로 최초 기획 |
| 1.1.0 | 2026-09-21 | 영어 기본·한국어/일본어 선택형 다국어 정책, 언어별 검색·응답·번역·검수 구조 추가 |
| 1.2.0 | 2026-09-21 | Gencow MVP 코드, MCP 최신·레거시 이중 호환, 핵심 검색 도구와 테스트 구현 |

## 1. 기획 요약

### 목표

독도 관련 역사 자료, 지도, 조약·외교 문서, 사진, 영상, 음성 및 전사문을 출처·권리정보와 함께 구조화하고, AI가 MCP(Model Context Protocol)를 통해 검색·열람·인용할 수 있는 원격 서버를 구축한다.

서비스의 기본 표시·검색·응답 언어는 영어(`en`)로 한다. 사용자는 각 MCP 요청에서 한국어(`ko`) 또는 일본어(`ja`)를 선택할 수 있으며, 선택하지 않으면 영어를 반환한다. 사료의 원문 언어는 변경하지 않고 별도 보존한다.

이 프로젝트의 핵심은 특정 결론을 답변에 강제하는 것이 아니라 다음을 보장하는 데 있다.

- 원자료와 해설을 구분한다.
- 한국, 일본, 제3국 자료를 출처별로 함께 제공한다.
- 모든 검색 결과에 기관, 작성자, 날짜, 원본 URL, 언어, 자료 유형, 권리정보, 정확한 인용 위치를 붙인다.
- 번역문·OCR·전사문은 원문과 연결하고, 기계 생성 여부와 검수 상태를 명시한다.
- AI가 자료 속 문장을 “명령”으로 실행하지 않고, 인용 가능한 비신뢰 콘텐츠로만 다루도록 한다.
- 영어 번역은 공개 자료의 기본 제공본으로 관리하고, 한국어·일본어 번역은 같은 자료 ID 아래 선택형 표현으로 제공한다.
- 번역이 없는 경우 다른 언어의 문장을 조용히 섞지 않고, 명시적인 fallback 정보와 원문을 반환한다.

### 다국어 제공 원칙

1. **원문 보존:** 한국어·한문·일본어·영어 등 원 사료의 텍스트는 `original` 표현으로 변경 없이 보존한다.
2. **영어 기본:** 공개 상태가 되려면 제목, 초록, 핵심 인용구의 영어 표현이 반드시 있어야 한다.
3. **선택형 한국어·일본어:** 요청의 `language`가 `ko` 또는 `ja`이면 해당 번역을 우선 반환한다.
4. **결정적 fallback:** 요청 언어가 없으면 `requested language → en → original` 순서로 반환하고, 실제 반환 언어를 표시한다.
5. **검색 언어 일치:** 질의 언어를 감지하되 명시적인 `language` 값이 항상 우선한다. 검색은 선택 언어와 원문을 함께 조회하되 결과 설명은 선택 언어로 반환한다.
6. **독립 검수:** 영어·한국어·일본어는 각각 번역 방식, 검수자, 검수 상태와 버전을 가진다.
7. **고유명사 통제:** 지명·인명·기관명은 언어별 표기 사전과 로마자 표기 정책을 사용하고, 원문 표기도 함께 제공한다.

### 권장 구축 형태

- Gencow `backend-only` 앱으로 API, 데이터베이스, 스토리지, 검색, 워크플로, Cron을 운영한다.
- 원격 MCP 엔드포인트는 `https://<app>.gencow.app/mcp`로 시작한다.
- 공개 서비스 단계에서는 `https://mcp.dokdo-archive.example/mcp` 같은 전용 도메인을 연결한다.
- 관리자 검수 화면이 필요해지는 2단계에서 Vite + React 프런트엔드를 추가해 `fullstack` 앱으로 확장한다.
- 원본 메타데이터와 권리정보는 앱 소유 PostgreSQL 테이블에, 검색용 문서 청크는 Gencow의 canonical RAG 테이블에 저장한다.
- 저작권이 확인된 이미지·영상만 Gencow Storage에 보관한다. 그 외 자료는 원기관 URL과 임베드·썸네일·구간 메타데이터만 제공한다.

## 2. Gencow 적합성 판단

Gencow는 이 프로젝트의 백엔드 기반으로 적합하다.

| 요구사항 | Gencow 적용 방식 |
|---|---|
| 구조화 데이터 | PostgreSQL + Drizzle 스키마 |
| 공개 검색 API | `httpRoute`와 `procedure.query` |
| MCP 엔드포인트 | `/mcp`에 등록하는 커스텀 `httpRoute` 프로토콜 어댑터 |
| 원문·이미지·영상 | `ctx.storage`, 공개 URL 또는 단기 read grant |
| PDF/HWPX/DOCX 변환 | `workflow()`의 `wf.services.document.convert()` |
| 이미지 OCR | `ai.vision.extractText()` |
| 영상·음성 전사 | `ai.speech.transcribe()`의 비동기 작업, 한국어·영어·일본어 후보 및 타임스탬프 |
| 전문 검색 | canonical RAG + `ctx.search()` 하이브리드 검색 |
| 정기 동기화 | `cron` + `procedure.internal` 또는 장기 `workflow()` |
| 운영 배포 | Dev 검증 후 Production 승격, 필요 시 커스텀 도메인 |

### 중요한 기술 전제

Gencow 문서에는 MCP 서버가 기본 기능으로 명시되어 있지 않다. 대신 `httpRoute`가 REST 스타일 GET/POST/PUT/DELETE/PATCH, 요청 헤더, 원시 JSON·텍스트·바이트, 응답 상태와 헤더를 제공한다. 따라서 MCP JSON-RPC 어댑터는 구현 가능성이 높지만, 다음 항목은 착수 직후 실제 클라이언트로 검증해야 한다.

1. `POST /mcp`에서 `initialize`, `tools/list`, `tools/call` JSON-RPC 요청과 응답이 정확히 전달되는지
2. 알림 요청에 `202`와 빈 본문을 반환할 수 있는지
3. `Content-Type`, `Accept`, `MCP-Protocol-Version` 헤더가 보존되는지
4. Gencow 응답 직렬화가 MCP 클라이언트와 호환되는지
5. 필요할 경우 `GET /mcp` SSE를 지원할 수 있는지

문서에서 임의 스트리밍 응답 지원은 확인되지 않았다. 따라서 1차 제품은 세션 없는 JSON 응답형 Streamable HTTP로 설계하고, SSE가 반드시 필요한 클라이언트까지 지원해야 한다면 PoC 결과에 따라 별도의 얇은 MCP 게이트웨이를 두는 방안을 예비안으로 둔다. 데이터·검색·스토리지 백엔드는 계속 Gencow를 사용한다.

## 3. 전체 아키텍처

```text
MCP Client / AI Agent
        |
        | HTTPS JSON-RPC
        v
Gencow httpRoute: /mcp
        |
        +-- MCP protocol dispatcher
        |      +-- initialize
        |      +-- tools/list, tools/call
        |      +-- resources/list, resources/read
        |      +-- prompts/list, prompts/get
        |
        +-- Domain services
               +-- source search / evidence graph / timeline
               +-- media search / transcript segment search
               +-- citation formatter / rights policy
        |
        +-- PostgreSQL/Drizzle
        |      +-- source metadata
        |      +-- events, claims, evidence links
        |      +-- media and transcript metadata
        |      +-- review and audit records
        |
        +-- Canonical RAG
        |      +-- converted original text
        |      +-- multilingual chunks and embeddings
        |      +-- grounded citations
        |
        +-- Gencow Storage
               +-- licensed originals
               +-- OCR/converted Markdown
               +-- private transcripts and subtitles
               +-- public thumbnails where permitted

Admin reviewer
        |
        +-- authenticated Gencow procedures / later React console
               +-- ingest, rights review, translation review, publish
```

### 읽기와 쓰기 경계

- MCP v1은 공개된 자료의 **읽기 전용** 도구만 제공한다.
- 수집, 수정, 공개, 삭제는 MCP에서 노출하지 않고 인증된 관리자 procedure와 workflow에서만 수행한다.
- 공개 MCP 라우트는 `.allowAnonymous()`를 사용하되, 자체 API 키·레이트 제한·남용 방지 미들웨어를 적용한다.
- 베타 단계는 API 키, 공개 단계는 익명 읽기 + 보수적 레이트 제한을 권장한다.

## 4. 자료 범위와 수집 우선순위

### 1차 자료 우선순위

1. 조선시대 관찬 문헌, 지도, 행정 기록
2. 대한제국 칙령과 관보
3. 일본 정부·지방 행정 문서 및 지도
4. 제2차 세계대전 전후 연합국 문서와 지도
5. 조약, 외교 문서, 국제법 관련 원문
6. 현장 사진, 항공·위성 이미지, 박물관 소장 이미지
7. 정부·공공기관 기록 영상, 뉴스·다큐멘터리, 구술 기록
8. 동료평가 학술논문과 연구기관 해설

### 출처군

- 대한민국: 외교부 독도 사이트, 국가기록원, 국립중앙도서관, 동북아역사재단 독도연구소, 독도박물관, 국사편찬위원회 등
- 일본: 외무성, 국립공문서관, 국회도서관, 시마네현 등
- 제3국: 미국 NARA·Library of Congress, 영국 The National Archives, 연합국 및 국제기구 기록 등

각 기관은 “후보 출처 레지스트리”에 먼저 등록하고, 이용약관·저작권·robots 정책·API 제공 여부를 검토한 뒤 수집한다. 단순히 공개 웹페이지라는 이유만으로 원본 파일을 재배포하지 않는다.

## 5. 데이터 모델

### 핵심 테이블

다국어 필드는 단순히 한 테이블에 `*_en`, `*_ko`, `*_ja` 열을 계속 추가하기보다 공통 번역 테이블을 사용한다. 자료의 언어가 늘어나도 스키마를 변경하지 않고 표현을 추가할 수 있기 때문이다.

#### `sources`

- `id`, `slug`, `title_original`
- `source_type`: chronicle, map, decree, treaty, diplomatic_record, article, photo, video 등
- `is_primary_source`
- `origin_country`, `institution`, `author_or_creator`
- `created_date`, `published_date`, `historical_period`
- `language`, `script`
- `content_original`
- `canonical_url`, `archive_identifier`, `accessed_at`
- `license`, `rights_status`, `reuse_terms`, `attribution_text`
- `checksum`, `version`, `supersedes_id`
- `verification_status`: imported, machine_processed, reviewed, published, disputed, withdrawn
- `original_language`, `original_script`

#### `source_localizations`

- `source_id`, `language`: `en`, `ko`, `ja`
- `title`, `abstract`, `content`
- `translation_method`: human, machine, hybrid, source_native
- `translation_model`, `translator_or_reviewer`
- `review_status`: draft, machine_reviewed, human_reviewed, published
- `version`, `updated_at`
- `(source_id, language, version)` 고유 제약

영어 표현은 공개 전 필수다. 한국어와 일본어 표현은 없을 수 있지만, MCP 응답이 fallback을 사용했다는 사실을 반드시 표시한다.

#### `source_fragments`

정확한 인용 위치를 보존한다.

- `source_id`
- `locator_type`: page, folio, section, paragraph, timestamp, map_region
- `locator_value`
- `text_original`
- `image_crop_storage_id`
- `ocr_confidence`, `review_status`

#### `fragment_localizations`

- `source_fragment_id`, `language`
- `text`, `translation_method`, `review_status`, `version`
- 인용 locator는 모든 언어 표현이 동일한 원문 fragment를 가리키도록 유지

#### `media_assets`

- `source_id`, `kind`: image, map, audio, video, thumbnail, subtitle
- `storage_id` 또는 `external_url`
- `mime_type`, `width`, `height`, `duration_ms`
- `thumbnail_storage_id`
- `transcript_status`, `subtitle_languages`
- `rights_status`, `allowed_uses`, `credit_line`
- `public_delivery_mode`: public_url, signed_url, external_only, metadata_only

#### `transcript_segments`

- `media_asset_id`, `start_ms`, `end_ms`, `speaker`
- `language_original`, `text_original`
- `confidence`, `review_status`

#### `transcript_localizations`

- `transcript_segment_id`, `language`: `en`, `ko`, `ja`
- `text`, `translation_method`, `review_status`, `version`
- 원 영상의 `start_ms`, `end_ms`는 언어와 무관하게 동일하게 유지

#### `events`

- `id`, `title`, `start_date`, `end_date`, `precision`
- `description_neutral`, `event_type`
- `place_id`, `review_status`

#### `claims`와 `claim_evidence`

서로 다른 해석을 출처와 분리해 표현한다.

- `claims`: 주장 문장, 주장 주체, 국가·기관, 제기 시점, 주제, 상태
- `claim_evidence`: `claim_id`, `source_fragment_id`, 관계 유형(supports, contradicts, contextualizes), 검토 메모

이 구조는 서버가 어느 한 해석을 사실처럼 합쳐 쓰는 대신, “누가 무엇을 주장했고 어떤 자료가 연결되는지”를 보여주게 한다.

#### 운영 테이블

- `source_registry`: 허용된 원기관과 수집 정책
- `ingest_jobs`: 수집·변환·OCR·전사 상태
- `review_tasks`: 사료·번역·권리 검수
- `audit_log`: 변경 주체, 시각, 이전값, 이후값
- `takedown_requests`: 권리자 요청과 처리 상태

### RAG 저장 원칙

- 앱 테이블이 메타데이터와 진실의 원본(source of truth)이다.
- published 상태의 자료만 canonical RAG corpus `dokdo-published`에 넣는다.
- 청크 메타데이터에 `source_id`, `fragment_id`, 언어, 자료유형, 기관, 날짜, 권리상태를 포함한다.
- 원문과 영어·한국어·일본어 번역은 별도 청크로 만들고 `source_id`, `fragment_id`, `language`, `translation_version`으로 연결한다.
- 영어 청크를 기본 검색 corpus/view로 사용하고, `language=ko|ja` 요청은 해당 언어 청크를 우선 검색한 뒤 원문·영어 청크로 recall을 보완한다.
- 검색 결과를 병합할 때 같은 fragment의 언어별 청크가 중복 결과로 나타나지 않도록 canonical fragment ID로 deduplicate한다.
- 답변 생성보다 `ctx.search()`를 통한 검색 결과 반환을 우선한다. MCP 서버는 “사료 제공자”이고 최종 해석은 클라이언트가 수행하도록 한다.

## 6. MCP 표면 설계

### 필수 도구 v1

#### `search_sources`

독도 관련 문헌·지도·공문서·학술자료를 하이브리드 검색한다.

입력:

- `query`
- `language`: `en | ko | ja`, 기본값 `en`
- `source_types[]`, `countries[]`, `languages[]`
- `date_from`, `date_to`
- `primary_only`
- `rights_filter`: reusable, view_only, any
- `limit`, `cursor`

출력:

- 안정적인 `source_id`
- 제목·기관·날짜·언어·자료유형
- 원문/번역 검색 발췌문
- 정확한 locator
- 원본 URL, 라이선스, 검수 상태, relevance score

#### `get_source`

자료 한 건의 전체 메타데이터와 요청한 범위의 원문·번역문을 반환한다.

입력: `source_id`, `language: en | ko | ja = en`, `include_original`, `include_fragments`, `max_chars`

#### `search_primary_sources`

`search_sources`의 1차 사료 전용 단축 도구다. MCP 클라이언트가 학술자료와 원자료를 쉽게 구분하게 한다.

#### `get_treaty_evidence`

조약·외교문서·부속 지도와 특정 쟁점의 관련 구절을 반환한다.

입력: `query`, `language: en | ko | ja = en`, `treaty_or_document`, `year`, `countries[]`

#### `search_media`

사진·지도 이미지·영상·음성을 검색한다.

입력: `query`, `language: en | ko | ja = en`, `media_types[]`, `date_from`, `date_to`, `rights_filter`, `has_transcript`, `limit`

출력은 원본 또는 썸네일 URL, 크기·길이, 권리정보, 크레딧 문구, 관련 사료 ID를 포함한다.

#### `get_media`

미디어 한 건의 전달 가능한 URL과 메타데이터를 반환한다. 비공개 원본은 짧은 read grant, 외부 전용 자료는 원기관 URL만 제공한다.

입력: `media_id`, `language: en | ko | ja = en`, `include_original`, `include_transcript`, `start_ms`, `end_ms`

#### `get_timeline`

기간·주제별 역사 사건을 관련 사료 인용과 함께 반환한다.

입력: `date_from`, `date_to`, `topic`, `language: en | ko | ja = en`, `source_types[]`

#### `compare_source_perspectives`

특정 주제에 대해 한국·일본·제3국 자료를 출처별로 나란히 반환한다. 서버가 승패나 결론을 생성하지 않고 인용 가능한 근거 묶음을 제공한다.

입력: `topic`, `language: en | ko | ja = en`, `countries[]`, `primary_only`, `max_sources_per_group`

### MCP Resources

- `dokdo://sources/{source_id}`
- `dokdo://sources/{source_id}/fragments/{fragment_id}`
- `dokdo://media/{media_id}`
- `dokdo://events/{event_id}`
- `dokdo://collections/primary-sources`
- `dokdo://collections/maps`
- `dokdo://collections/treaties`

### MCP Prompts

- `build_cited_timeline`: 기간과 주제를 받아 사료 중심 연표 작성 지침 제공
- `compare_perspectives`: 국가·기관별 자료를 섞지 않고 비교하는 지침 제공
- `analyze_primary_source`: 원문, 번역, 작성 맥락, 한계, 인용 위치를 분리하는 지침 제공

### 응답 공통 규칙

모든 도구 결과에는 다음을 공통으로 포함한다.

- `source_id` 또는 `media_id`
- `title`, `institution`, `date`, `language`
- `canonical_url`, `accessed_at`
- `citation_label`, `locator`
- `license`, `rights_status`, `attribution_text`
- `verification_status`
- `machine_generated_fields[]`
- `content_warning` 또는 `uncertainty_note`
- `requested_language`, `resolved_language`
- `fallback_used`, `fallback_reason`
- `available_languages[]`
- `original_language`

이미지는 작은 미리보기만 MCP image content로 직접 반환하고, 고해상도 원본은 resource link를 기본으로 한다. 영상은 바이너리 전체를 MCP 응답에 넣지 않고 링크, 썸네일, 길이, 자막, 타임코드가 있는 전사 구간을 제공한다.

## 7. 수집·가공·검수 파이프라인

```text
출처 등록
  -> 이용조건/권리 검토
  -> 메타데이터 수집
  -> checksum 중복 확인
  -> 원본 저장 또는 외부 링크 보존
  -> 문서 변환 / 이미지 OCR / 영상·음성 전사
  -> 원문 언어 감지
  -> 영어 기본 번역 생성·검수
  -> 한국어·일본어 선택 번역 생성·검수
  -> 사건·인물·장소·날짜 후보 추출
  -> 사람 검수
  -> published 승인
  -> canonical RAG 색인
  -> MCP 공개
```

### 유형별 처리

- PDF/HWP/HWPX/DOCX/XLSX: Gencow document conversion workflow로 Markdown·텍스트·페이지 구조를 얻는다.
- 스캔 PDF: 자동 경로의 품질을 확인한 뒤 필요할 때만 OCR·유료 fallback을 명시적으로 허용하고 서비스 크레딧 상한을 둔다.
- PNG/JPEG/WebP/GIF: document conversion이 아니라 `ai.vision.extractText()`를 사용한다.
- 영상·음성: private Storage에 올리고 `ai.speech.transcribe()` 비동기 작업으로 `en-US`, `ko-KR`, `ja-JP` 후보, phrase/word timestamp, 필요 시 화자 분리를 요청한다. 전사 원문을 먼저 보존한 뒤 영어 기본본과 선택형 한국어·일본어 번역을 별도로 생성한다.
- 외부 플랫폼 영상: 다운로드·재배포 권리가 없으면 외부 URL, 공식 임베드, 썸네일, 공인 자막·요약만 저장한다.

### 자동화

- 매일: 등록된 피드/API의 변경 메타데이터 확인
- 매주: 끊어진 원문 링크, 만료된 라이선스, checksum 변화 확인
- 매월: 권리 미확인 자료와 기계번역 미검수 자료 보고서 생성
- 긴 수집 작업: `workflow()` 체크포인트 사용
- 작은 증분 처리: internal procedure + scheduler 사용

## 8. Gencow 프로젝트 구조

```text
dokdo-mcp/
├── gencow/
│   ├── schema.ts
│   ├── schema-auth.ts
│   ├── schema-sources.ts
│   ├── schema-media.ts
│   ├── schema-events.ts
│   ├── schema-evidence.ts
│   ├── schema-review.ts
│   ├── runtime.ts
│   ├── index.ts
│   ├── mcp/
│   │   ├── routes.ts
│   │   ├── protocol.ts
│   │   ├── errors.ts
│   │   ├── registry.ts
│   │   └── tools/
│   │       ├── sources.ts
│   │       ├── media.ts
│   │       ├── timeline.ts
│   │       └── perspectives.ts
│   ├── ingest/
│   │   ├── workflows.ts
│   │   ├── document.ts
│   │   ├── image-ocr.ts
│   │   ├── speech.ts
│   │   └── rights-policy.ts
│   ├── search/
│   │   ├── sources.ts
│   │   ├── citations.ts
│   │   └── ranking.ts
│   ├── i18n/
│   │   ├── resolve-language.ts
│   │   ├── terminology.ts
│   │   ├── localization.ts
│   │   └── fallback.ts
│   ├── admin/
│   │   ├── review.ts
│   │   └── publish.ts
│   └── auth.ts
├── tests/
│   ├── mcp-conformance/
│   ├── citation-fixtures/
│   └── rights-policy/
├── gencow.config.js
└── package.json
```

`gencow/index.ts`에는 MCP `httpRoutes`, 관리자 procedures, 수집 workflows, cron을 명시적으로 등록한다. Gencow는 파일을 자동 발견하지 않으므로 등록 누락을 CI에서 검사한다.

## 9. MCP 프로토콜 구현 방안

### 초기 지원 범위

- JSON-RPC 2.0
- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`, `tools/call`
- `resources/list`, `resources/read`
- `prompts/list`, `prompts/get`
- 서버 기능 버전과 데이터셋 버전 노출

### 세션 정책

v1은 상태 없는 서버로 운영한다.

- 요청별로 독립 처리한다.
- 서버 세션 ID를 요구하지 않는다.
- 진행 알림, 서버발 이벤트, SSE는 후속 단계로 둔다.
- 검색 결과는 cursor 기반 페이지네이션을 사용한다.

### 호환성 PoC 판정 기준

다음 세 종류 이상의 MCP 클라이언트에서 같은 결과를 얻어야 한다.

1. MCP Inspector 또는 표준 프로토콜 테스트 도구
2. 데스크톱 MCP 클라이언트 1종
3. API 기반 MCP 클라이언트 1종

필수 통과 항목:

- 초기화 협상 성공
- 도구·리소스 스키마 노출 성공
- 한글·일본어·한자 JSON 손상 없음
- `language` 미지정 시 영어 응답, `ko`·`ja` 지정 시 해당 언어 우선 응답
- 번역이 없는 fixture에서 `requested → en → original` fallback과 관련 메타데이터가 정확함
- 202 알림 처리
- JSON-RPC 표준 오류 코드와 도메인 오류 분리
- 1 MB급 응답을 만들지 않도록 pagination/max_chars 적용
- 취소·타임아웃 시 안전한 종료

PoC가 실패하는 경우 Gencow 앞단에 표준 MCP SDK를 실행하는 작은 게이트웨이를 배치하고, 게이트웨이가 Gencow의 HTTPS procedures를 호출하도록 한다. 이 예비안에서도 데이터·RAG·Storage·워크플로는 이동하지 않는다.

## 10. 보안·신뢰·권리 정책

### 보안

- MCP는 읽기 전용이고 관리자 작업은 별도 인증 경로로 분리한다.
- 임의 URL 수집 도구를 MCP에 제공하지 않는다. 등록된 도메인 allowlist만 수집한다.
- 입력 길이, 필터 수, 반환 건수, 번역·AI 호출 비용을 제한한다.
- HTML, OCR, 전사문, 문서 본문은 모두 비신뢰 데이터로 표시한다.
- 자료 안의 프롬프트·명령문을 시스템 지시로 사용하지 않는다.
- 관리자 권한과 공개 읽기 권한을 DB 및 애플리케이션 레벨에서 분리한다.
- 비밀키는 `gencow/.env` 또는 Cloud env에만 두고 프런트엔드에 노출하지 않는다.
- `ctx.unsafeDb` 사용은 마이그레이션·운영관리처럼 명확히 승인된 코드로 제한한다.

### 저작권과 재사용

- `rights_status`가 `verified_reusable`인 자료만 원본 다운로드 URL을 제공한다.
- `view_only`는 작은 미리보기나 원기관 링크만 제공한다.
- `unknown`은 관리자만 볼 수 있고 MCP 검색에서 기본 제외한다.
- 권리표시, 출처표기 문구, 변경금지·비상업 조건을 기계 판독 필드로 저장한다.
- 삭제 요청이 들어오면 Storage 원본, 변환본, 썸네일, RAG 청크까지 추적 삭제한다.

### 역사자료 신뢰성

- 원자료, 번역, 해설, AI 요약을 서로 다른 필드로 분리한다.
- OCR confidence가 낮은 구절은 검색 결과에 경고를 붙인다.
- 날짜가 불확실하면 임의의 단일 날짜로 정규화하지 않고 precision을 저장한다.
- 상충하는 자료를 덮어쓰지 않고 각각 별도 버전과 출처로 유지한다.
- 번역의 문장 선택이나 용어 차이를 원자료의 차이로 오인하지 않도록 원문 fragment ID를 항상 노출한다.
- “공개됨”은 사실관계에 대한 국가적 합의를 뜻하지 않고, 메타데이터·권리·인용 위치 검수를 통과했다는 의미로만 사용한다.

## 11. 성능과 비용 설계

- MCP 검색 응답은 기본 10건, 최대 50건으로 제한한다.
- `get_source`는 기본적으로 전문 전체가 아닌 인용 가능한 fragment를 반환한다.
- 이미지 원본과 영상은 MCP JSON에 base64로 넣지 않는다.
- 동일 질의와 공개 메타데이터는 짧게 캐시하되, 권리상태 변경 시 즉시 무효화한다.
- 캐시 키에는 `language`와 번역 버전을 포함한다.
- 임베딩은 published 자료에만 생성한다.
- 문서 변환의 `paidFallback`은 기본 false, 사용할 때는 `maxServiceCredits`를 지정한다.
- 영상 전사는 비동기 job ID를 보관해 중복 실행을 막는다.

Gencow 현재 문서 기준으로 `httpRoute` 실행 한도는 5분이지만, 장시간 OCR·전사는 HTTP 요청을 붙잡아 두지 않고 workflow 또는 Speech의 durable job으로 넘긴다. 영상 업로드까지 운영하려면 앱 저장 한도가 병목이 된다. Pro는 최대 파일 500 MB와 Storage 20 GB를 제공하므로 파일을 직접 보관하는 파일럿에 적합하다. 대규모 영상 아카이브는 원기관 링크 중심 또는 별도 오브젝트 저장소 연계를 검토해야 한다.

## 12. 구축 단계

### 0단계 — MCP/Gencow 호환성 PoC (2~3일)

- Gencow backend-only 앱 생성
- `/api/health`, `/mcp` 라우트 구현
- 메모리 기반 1개 도구 `search_sources` 구현
- MCP 초기화, 목록, 호출, 오류, 알림 검증
- Dev의 `*.gencow.app`에서 3개 클라이언트 테스트

**종료 조건:** Gencow 단독 구현 또는 게이트웨이 예비안 중 하나를 확정한다.

### 1단계 — 데이터 기반 (1주)

- Drizzle 스키마와 마이그레이션
- 출처 레지스트리, 권리상태, 검수 상태 모델
- 샘플 30건: 한국 15, 일본 8, 제3국 7 정도로 균형 있는 fixture 구성
- 정확한 citation locator와 checksum 구현
- 영어 기본 표현과 한국어·일본어 localization fixture 구현
- 지명·기관명·시대명 용어집의 첫 버전 작성

### 2단계 — 수집·가공 (1~2주)

- 문서 변환 workflow
- 이미지 OCR
- 영상·음성 전사 job
- 중복 탐지, 버전관리, 검수 큐
- canonical RAG 색인
- 언어별 청크 색인, 교차언어 검색, fragment 기준 중복 제거

### 3단계 — MCP v1 (1주)

- 필수 8개 도구
- Resources와 Prompts
- cursor pagination, max_chars, 표준 오류
- API 키·레이트 제한·감사 로그

### 4단계 — 품질 검증 (1주)

- 대표 역사 질문 50개 평가세트
- 검색 recall, 잘못된 출처 연결, 인용 위치 정확도 측정
- 한국어·일본어·영어 교차검색
- 언어 미지정 영어 기본값과 번역 fallback 테스트
- 저작권 정책 및 삭제 전파 테스트
- 프롬프트 인젝션·SSRF·대용량 입력 테스트

### 5단계 — 공개 파일럿 (1주)

- Dev 검토 후 명시적으로 Production 배포
- Personal 이상 요금제에서 커스텀 도메인/TLS 연결
- 상태 페이지, 이용약관, 출처·권리 정책, 정정·삭제 요청 창구 공개
- 제한된 사용자로 2~4주 운영 후 자료량과 미디어 보관 정책 조정

## 13. 성공 지표

- 공개된 모든 자료의 100%가 원본 URL·기관·날짜·권리상태를 가진다.
- 인용 반환의 95% 이상이 정확한 페이지·문단·타임코드로 이동한다.
- 기계번역·OCR·AI 추출 필드의 100%가 생성 방식과 검수 상태를 표시한다.
- published 자료의 100%가 영어 제목·초록·핵심 인용 번역을 가진다.
- `language=en|ko|ja` 응답의 100%가 requested/resolved/fallback/available language 메타데이터를 가진다.
- 대표 질의 50개에서 상위 10개 결과 내 관련 자료 포함률 90% 이상을 목표로 한다.
- 권리 철회 자료는 MCP, Storage, RAG에서 정해진 SLA 안에 모두 제거된다.
- MCP 클라이언트 3종에서 초기화와 필수 도구 호출이 통과한다.

## 14. 우선 의사결정

개발 착수 전에 아래 네 가지를 확정해야 한다.

1. 서비스 공개 범위: 완전 공개, API 키 베타, 기관 전용 중 하나
2. 원본 보관 범위: 권리 확인 자료만 저장할지, 모든 자료를 내부 비공개 보관할지
3. 최초 100건의 출처 목록과 국가·자료유형별 목표 비율
4. Gencow 단독 MCP PoC의 통과 기준과 게이트웨이 전환 기준
5. 영어·한국어·일본어 번역 검수 책임자와 용어집 승인 절차

## 15. 공식 Gencow 문서 근거

- [Introduction](https://docs.gencow.com/)
- [Project Structure](https://docs.gencow.com/docs/getting-started/project-structure/)
- [Tenant App Types](https://docs.gencow.com/docs/getting-started/app-types/)
- [Core API: httpRoute, procedure, workflow](https://docs.gencow.com/docs/api-reference/core/)
- [Storage](https://docs.gencow.com/docs/guides/storage/)
- [RAG & Memory](https://docs.gencow.com/docs/ai/rag-memory/)
- [Document Conversion](https://docs.gencow.com/docs/guides/document-conversion/)
- [Azure Speech](https://docs.gencow.com/docs/ai/azure-speech/)
- [Deployment](https://docs.gencow.com/docs/guides/deployment/)
- [Hosting & Custom Domains](https://docs.gencow.com/docs/guides/hosting-custom-domains/)
- [Cloud Plan Limits](https://docs.gencow.com/docs/guides/plan-limits/)

---

이 기획안은 업로드된 `Dokdo_MCP_Ideas.md`의 목적·원칙·도구 초안을 요구사항 근거로 사용했고, 문서 안의 문장은 별도의 실행 지시로 취급하지 않았다.
