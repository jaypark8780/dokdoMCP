# Dokdo MCP 역사자료 수집 계획

> 계획 버전: **1.0**<br>
> 작성일: **2026-09-21**<br>
> 적용 대상: Dokdo MCP `v1.2.x` 이후

## 1. 목표

독도에 관한 문헌, 지도, 조약·외교문서, 사진, 영상, 음성을 신뢰할 수 있는 원기관에서 수집하고, 출처·인용 위치·권리정보·언어·검수 상태를 보존한 뒤 MCP를 통해 제공한다.

수집은 특정 국가의 결론을 미리 정하고 그에 맞는 자료만 모으는 방식으로 진행하지 않는다. 한국, 일본, 제3국의 기록을 같은 메타데이터 규칙으로 관리하고, 원자료와 각 기관의 해설·주장을 구분한다.

### 핵심 원칙

1. 검색 가능한 자료와 재배포 가능한 자료는 다르다.
2. 원본 파일을 저장하기 전에 문서 단위의 권리상태를 확정한다.
3. 원문, OCR, 번역, 요약, 해설을 별도 표현으로 보관한다.
4. 안정적인 기관 식별자·문서번호·페이지·이미지 번호·타임코드를 인용의 기준으로 삼는다.
5. API가 있으면 API를 우선하고, 대량 HTML 크롤링은 최후 수단으로 둔다.
6. robots 정책, 이용약관, 호출량 제한과 삭제 요청을 준수한다.
7. 공개 전에는 역사자료 검수와 언어 검수를 모두 통과해야 한다.

## 2. 수집 대상 범위

### 자료 유형

- 관찬 사서, 지리지, 관보, 칙령, 행정문서
- 지도, 해도, 항로도, 지명 색인
- 조약, 부속문서, 외교전문, 회의록
- 제2차 세계대전 전후 연합국 문서와 지령
- 정부·공공기관의 공식 입장 자료
- 사진, 항공사진, 위성사진, 유물 이미지
- 뉴스·기록·다큐멘터리 영상과 구술자료
- 동료평가 논문, 학술서, 연구기관 보고서

### 시대별 파일럿 목표

| 시대 | 목표 비율 | 대표 범위 |
|---|---:|---|
| 1900년 이전 | 25% | 지리지, 고지도, 관찬 기록 |
| 1900~1945 | 30% | 대한제국, 일본 제국, 외교·행정 문서 |
| 1945~1965 | 30% | 연합국 문서, 평화조약 관련 기록, 한일 외교자료 |
| 1965년 이후 | 15% | 후속 외교문서, 조사·측량·보도·해설 |

파일럿 1차 목표는 100건이다. 한국 40건, 일본 30건, 제3국 30건을 출발점으로 삼되, 자료 수의 기계적 균형보다 원자료의 대표성과 중복 제거를 우선한다. 전체의 70% 이상을 1차 사료로 구성한다.

## 3. 우선 수집처와 수집 정책

### A. API 또는 구조화 검색을 우선 적용할 기관

#### 대한민국 국가기록원

- 검색 OpenAPI가 RSS 형식으로 기록물 ID, 제목, 생산기관, 생산연도, 공개구분, 자료형태, 온라인 원문 가능 여부와 상세 링크를 제공한다.
- 인증키가 필요하며 기본 호출량은 하루 1,000건 미만이다.
- 1차 구현에서는 OpenAPI로 메타데이터만 자동 수집한다.
- `online_reading=Y`여도 원본 파일 재배포 권한을 뜻하지 않으므로 별도 권리 판정을 거친다.
- 공개·부분공개·비공개 값을 원본 그대로 보존한다.

참고: [국가기록원 OpenAPI 안내](https://www.archives.go.kr/next/newsearch/openAPI01.do)

#### 미국 National Archives and Records Administration

- National Archives Catalog API를 사용해 카탈로그 설명과 디지털 객체 정보를 수집한다.
- 문서별 use restriction, access restriction, 기증자료·제3자 권리를 확인한다.
- 미국 연방정부 기록이라는 이유만으로 모든 항목을 자동으로 public domain 처리하지 않는다.
- API 원본 JSON을 수집 증거로 보존하고, 카탈로그 식별자를 안정 ID에 포함한다.

참고: [NARA Catalog API](https://catalog.archives.gov/api/v2/api-docs/)

#### 영국 The National Archives Discovery

- Discovery API 또는 카탈로그 검색으로 문서번호, 소장계층, 날짜, 설명과 디지털 제공 여부를 수집한다.
- 웹사이트의 Crown copyright 텍스트는 별도 표시가 없으면 OGL 대상이지만, Discovery에서 내려받은 문서 이미지에는 같은 허가가 적용되지 않는다.
- 디지털 문서 이미지는 연구·비상업 교육 범위를 기본으로 보고, MCP에서는 메타데이터와 원문 링크를 우선 제공한다.
- 문서 이미지 재배포는 별도 허가나 명시적 라이선스가 있을 때만 한다.

참고: [Discovery](https://discovery.nationalarchives.gov.uk/), [저작권 정책](https://www.nationalarchives.gov.uk/terms-and-conditions/copyright/)

### B. 기관 식별자가 안정적이지만 권리 판정이 필요한 기관

#### Japan Center for Asian Historical Records(JACAR)

- 일본 국립공문서관, 외무성 외교사료관, 방위연구소 등의 근현대 공식문서 이미지를 검색한다.
- JACAR reference code를 주 식별자로 사용한다. 카탈로그 제목이 수정되어도 reference code는 원칙적으로 유지된다.
- 국립공문서관·외교사료관 제공 이미지는 원칙적으로 2차 이용 제한이 없다고 안내하지만, JACAR·소장기관·reference code를 표시한다.
- 방위연구소 이미지를 출판·방송에 사용하려면 직접 문의가 필요하다.
- 그 밖의 제휴기관 자료는 각 소장기관의 조건을 개별 적용한다.
- 따라서 어댑터가 자동으로 재배포 여부를 결정하지 않고 `holding_institution`별 권리 규칙을 적용한다.

참고: [JACAR](https://www.jacar.go.jp/english/), [문서 이미지 이용 안내](https://www.jacar.archives.go.jp/aj/www/doc/en/)

#### 일본 국립국회도서관 디지털 컬렉션

- 상세검색으로 지도·도서·관보·지리자료를 찾고, NDL bibliographic ID와 영구 URL을 저장한다.
- 공개 범위가 인터넷 공개, 도서관 송신, 관내 이용으로 나뉠 수 있으므로 접근수준을 메타데이터로 보존한다.
- 사이트와 항목별 이용조건이 확인되기 전에는 이미지 파일을 복제하지 않고 메타데이터·링크만 제공한다.

참고: [NDL Digital Collections](https://dl.ndl.go.jp/?__lang=en)

#### 대한민국 국립중앙도서관

- `Korean History in the Eyes of the Dokdo Islands` 디지털 컬렉션을 우선 조사한다.
- 사이트가 `All rights reserved`로 표시되므로 메타데이터·영구 링크 우선 정책을 적용한다.
- 원문 이미지·PDF 저장은 항목별 이용조건 또는 서면 허가가 확보된 경우에만 한다.

참고: [National Library of Korea](https://www.nl.go.kr/EN/main/index.do)

### C. 공식 입장·해설 자료

#### 대한민국 외교부 독도 사이트

- 연표, 사실관계 설명, 동영상, 갤러리, 공식 입장 페이지를 수집 후보로 등록한다.
- 역사적 원자료와 외교부 해설을 같은 유형으로 취급하지 않는다. `source_type=official_position` 또는 `institutional_explanation`으로 분리한다.
- 사이트가 모든 권리를 외교부에 귀속한다고 표시하므로 원본 미디어는 링크 중심으로 제공하고, 재사용 허가가 확인된 자료만 Storage에 저장한다.

참고: [대한민국 외교부 독도 사이트](https://dokdo.mofa.go.kr/eng/)

#### 일본 외무성 Takeshima 사이트

- 공식 입장, 지도, 영상, PDF, 전후 처리·평화조약 등 주제별 설명을 수집 후보로 등록한다.
- 대한민국 외교부 자료와 동일하게 `official_position`으로 분류하고 원자료와 구분한다.
- PDF·영상·지도는 권리조건 확인 전에는 원기관 링크만 제공한다.

참고: [일본 외무성 Takeshima 사이트](https://www.mofa.go.jp/region/asia-paci/takeshima/)

### D. 추가 후보 기관

- 국사편찬위원회 한국사데이터베이스: 원문·사료 목록과 안정 링크를 우선 수집하고, `All Rights Reserved` 자료는 링크 중심으로 제공
- 동북아역사재단·독도연구소, 독도박물관: 소장목록과 학술자료를 협력 수집 대상으로 등록
- Library of Congress: 공식 JSON API를 사용하되 각 항목의 rights advisory가 재사용을 허용하는 경우만 파일 저장
- UN Treaty Collection: 조약 식별자, 당사국, 체결·발효일, 원문 링크를 수집하고 UN 저작권·항목 조건에 따라 전문 저장 여부 결정
- 대학도서관·박물관: 기관별 소장번호와 이용허가를 확인한 뒤 수동 등록

## 4. 검색어와 탐색 전략

### 기본 검색어 사전

| 언어 | 검색어 후보 |
|---|---|
| 한국어·한문 | 독도, 석도, 우산도, 가지도, 울릉도, 대한제국 칙령 제41호 |
| 일본어 | 竹島, 松島, 石島, 隠岐, 島根県, リヤンコ島 |
| 영어·서양어 표기 | Dokdo, Takeshima, Liancourt Rocks, Dagelet, Matsushima, Utsuryo |

과거 지명은 시기와 지도 제작자에 따라 다른 섬을 가리킬 수 있다. 검색어가 일치했다는 사실만으로 독도 관련 자료로 확정하지 않는다. 후보를 넓게 모은 뒤 지도 좌표, 주변 지명, 본문 맥락, 소장기관 기술을 사람이 검토한다.

### 탐색 순서

1. 기관별 사전 검색으로 결과 규모와 식별자 체계를 파악한다.
2. 정확검색, 표기변형, 관련 지명, 기관·연도 필터 순으로 질의를 확장한다.
3. 결과를 `discovered` 상태로 저장하고 본문·이미지는 아직 공개하지 않는다.
4. 동일 문서의 다른 디지털 사본을 묶고 가장 권위 있는 원기관을 canonical source로 지정한다.
5. 문서가 인용한 선행 문서와 부속 지도를 따라가며 snowball 방식으로 추가 발견한다.

## 5. 소스 레지스트리

자동 수집 코드는 기관을 직접 하드코딩하지 않고 `source_registry` 설정을 읽는다.

```json
{
  "id": "nak",
  "institution": "National Archives of Korea",
  "country": "KR",
  "baseUrl": "https://www.archives.go.kr/",
  "discoveryMethod": "api",
  "apiDailyLimit": 900,
  "allowedDomains": ["archives.go.kr", "search.archives.go.kr"],
  "metadataReuse": "reviewed",
  "fileReuseDefault": "unknown",
  "requiresItemRightsReview": true,
  "robotsReviewedAt": "2026-09-21",
  "termsReviewedAt": "2026-09-21",
  "enabled": true
}
```

### 필수 레지스트리 필드

- 기관명, 국가, 담당자·문의처
- 공식 도메인 allowlist
- API, RSS, sitemap, 수동 업로드 등 발견 방식
- 인증키 위치와 호출량 제한
- robots·이용약관·저작권 정책 URL과 최종 검토일
- 메타데이터·썸네일·원본 파일의 기본 재사용 판정
- 크롤링 주기, 요청 간격, 최대 페이지 수
- 오류·차단 시 자동 중단 조건
- 삭제·정정 요청 접수 경로

## 6. 권리 판정과 전달 방식

### 권리상태

| 상태 | 의미 | MCP 전달 방식 |
|---|---|---|
| `public_domain` | 퍼블릭 도메인이 확인됨 | 원본·썸네일 제공 가능 |
| `verified_reusable` | 명시적 라이선스나 기관 허가 확인 | 조건에 맞춰 원본 제공 |
| `view_only` | 열람은 가능하지만 재배포 제한 | 원기관 링크와 메타데이터만 제공 |
| `permission_required` | 이용 목적별 사전 승인 필요 | 관리자만 원본 접근, MCP는 링크만 제공 |
| `unknown` | 아직 확인되지 않음 | MCP 공개 제외 |
| `withdrawn` | 권리 철회·삭제 요청 | 검색·RAG·Storage에서 제거 |

### 권리 판정 증거

- 정책 URL과 캡처 또는 원문 발췌
- 확인 날짜와 검토자
- 적용되는 소장기관·컬렉션·문서 범위
- 라이선스 버전, 귀속 문구, 상업적 이용·변형 제한
- 서면 허가 파일이나 문의 티켓 번호

권리정보가 기관 전체에 동일하게 적용된다고 추정하지 않는다. 컬렉션이나 문서 제공기관이 다르면 별도 판정을 생성한다.

## 7. 수집·가공 워크플로

```text
출처 레지스트리 승인
  → 검색/API로 후보 발견
  → 원기관 식별자와 메타데이터 저장
  → 중복·버전 판정
  → 접근·저작권 검토
  → 허용된 경우에만 파일 저장
  → 문서 변환/OCR/전사
  → 영어 기본 번역
  → 한국어·일본어 선택 번역
  → 인용 fragment와 locator 생성
  → 역사·언어·권리 검수
  → published 승인
  → canonical RAG 색인
  → MCP 공개
```

### 1. 발견

- API 결과 원문을 `ingest_job.raw_response` 또는 별도 감사 Storage에 보존한다.
- `institution + archive_identifier`를 안정 ID의 기본 재료로 사용한다.
- 수집시각, 요청 URL, 응답 해시, HTTP ETag·Last-Modified를 기록한다.

### 2. 중복 제거

- 정확 중복: 파일 SHA-256
- 메타데이터 중복: 기관 ID, 문서번호, 제목·날짜 조합
- 근사 중복: OCR 텍스트 fingerprint와 페이지 이미지 perceptual hash
- 동일 문서의 여러 기관 사본은 삭제하지 않고 `same_as` 관계로 연결한다.

### 3. 원본 저장

- `public_domain`과 `verified_reusable`만 Gencow Storage 저장 후보가 된다.
- 대용량 영상은 권리가 있어도 외부 원본 링크 + 썸네일 + 전사문을 기본으로 한다.
- 원본, 변환 Markdown, OCR, 썸네일, 자막은 서로 다른 asset로 기록한다.

### 4. 문서 변환·OCR

- PDF/HWP/HWPX/DOCX/XLSX: Gencow document conversion workflow
- 스캔 PDF: 페이지별 OCR과 원본 페이지 번호 보존
- 이미지: `ai.vision.extractText()` 사용
- 표와 지도 범례는 일반 본문과 분리해 fragment 생성
- 제안 검수 기준:
  - OCR confidence 95 이상: 자동 후보, 표본검수
  - 80~94: 해당 fragment 사람 검수
  - 80 미만: 공개 전 이중검수

수치는 초기 운영 기준이며 실제 오류율을 측정한 뒤 조정한다.

### 5. 영상·음성

- 권리 확인 전에는 원본을 다운로드하지 않는다.
- 허용된 파일은 private Storage에 저장하고 Gencow Speech 비동기 작업으로 전사한다.
- 언어 후보는 `en-US`, `ko-KR`, `ja-JP`, timestamp는 phrase 또는 word로 설정한다.
- 전사 segment는 `start_ms`, `end_ms`, 화자, confidence를 가진다.
- MCP는 영상 전체 대신 원기관 링크, 썸네일, 관련 타임코드 전사문을 반환한다.

### 6. 다국어 처리

- 원문은 항상 보존한다.
- 영어 제목·초록·핵심 fragment는 공개 전 필수다.
- 한국어·일본어는 선택 제공하며 준비되지 않은 경우 영어로 fallback한다.
- 역사 지명·기관명·문서명은 용어집 ID로 연결한다.
- 고지도·고문서 번역은 현대 지명으로 조용히 치환하지 않고 원문 표기와 주석을 함께 둔다.
- 기계번역은 모델, 생성시각, 입력 해시를 기록하고 `machine` 상태로 표시한다.

### 7. 검수와 공개

자료 한 건은 다음 네 검수를 통과해야 한다.

1. **출처 검수:** 원기관·식별자·URL·날짜가 맞는가
2. **내용 검수:** 독도 관련성이 실제 본문·좌표·맥락에서 확인되는가
3. **언어 검수:** 영어 기본본과 제공되는 한국어·일본어가 원문을 왜곡하지 않는가
4. **권리 검수:** MCP 전달 방식이 이용조건과 일치하는가

최종 상태 흐름:

```text
discovered → metadata_verified → rights_reviewed
→ processed → content_reviewed → published
                                ↘ rejected / permission_required
published → corrected / withdrawn
```

## 8. 필수 메타데이터

공개 자료는 최소한 다음 필드를 가져야 한다.

- `source_id`, `institution`, `archive_identifier`
- 원문 제목, 원문 언어, 자료유형
- 영어 제목과 초록
- 작성·생산일과 날짜 정밀도
- 원본 URL, 수집일, checksum
- 국가·작성기관·저자 또는 생산자
- 1차 사료 여부
- 권리상태, 정책 URL, 귀속 문구
- 검수상태와 검수자
- fragment별 페이지·문단·이미지 번호·타임코드
- 기계 생성 필드와 생성 방법

필수 필드가 없으면 `published`로 전환할 수 없도록 DB 또는 관리자 procedure에서 검증한다.

## 9. Gencow 구현 계획

### 추가할 모듈

```text
gencow/ingest/
├── registry.ts
├── workflow.ts
├── rights.ts
├── deduplicate.ts
├── publish.ts
└── adapters/
    ├── national-archives-kr.ts
    ├── jacar.ts
    ├── nara.ts
    ├── tna-discovery.ts
    └── manual-csv.ts
```

### 실행 원칙

- 외부 수집은 `workflow()`에서 작은 checkpoint로 나눈다.
- Cron은 후보 갱신 작업만 예약하고 대량 본문을 직접 처리하지 않는다.
- API 키는 `gencow/.env` 또는 Cloud env에만 둔다.
- 도메인 allowlist 밖의 URL은 요청하지 않는다.
- 실패 재시도는 지수 backoff와 기관별 일일 예산을 적용한다.
- 동일 기관 ID와 응답 checksum에는 idempotency key를 적용한다.
- published 승인 후에만 canonical RAG로 ingest한다.
- 정정·삭제 시 원본, 파생 asset, localization, RAG chunk를 함께 추적한다.

## 10. 단계별 실행 일정

### 1주차 — 레지스트리와 수동 수집

- `source_registry`, `rights_reviews`, `ingest_jobs` 스키마 추가
- 관리자용 CSV/JSON import 구현
- 기관 10곳의 이용조건 검토와 연락처 등록
- 자료 20건을 수동으로 end-to-end 처리

### 2주차 — 국가기록원 어댑터

- 인증키 기반 OpenAPI 검색
- 일 900건 예산, pagination, resume cursor
- 공개구분·자료유형 매핑
- 메타데이터 후보 200건 발견 후 중복 제거

### 3주차 — JACAR 어댑터

- reference code와 소장기관 추출
- 문서·이미지 번호 단위 locator
- 소장기관별 권리 규칙 적용
- 독도 관련 후보 100건을 사람이 relevance 판정

### 4주차 — NARA·TNA 어댑터

- 영문 카탈로그 검색과 원문 링크 수집
- SCAP·연합국·평화조약 관련 query set 운영
- use restriction과 디지털 객체 권리 판정

### 5주차 — OCR·번역·전사

- 대표 PDF·지도·사진·영상 처리
- 영어 기본 localization과 한국어·일본어 선택 localization
- OCR·번역 품질 표본평가와 threshold 조정

### 6주차 — 파일럿 공개

- 100건 검수 완료
- MCP 검색·인용 정확도 평가
- 권리 위반, 잘못된 지명 연결, 중복 결과 점검
- 정정·삭제 시뮬레이션 후 published 전환

## 11. 품질 지표

- 공개 자료 100%에 원기관 URL·식별자·권리상태 존재
- 공개 자료 100%에 영어 제목·초록 존재
- 1차 사료 fragment의 95% 이상이 정확한 페이지·이미지 번호·타임코드로 이동
- 대표 검색어 30개에서 상위 10개 결과 관련성 90% 이상
- 중복 source 비율 3% 미만
- 저신뢰 OCR fragment 검수 누락 0건
- 권리상태 `unknown`인 자료의 MCP 노출 0건
- withdrawn 처리 후 MCP·RAG·Storage 잔존 0건

## 12. 주요 위험과 대응

| 위험 | 대응 |
|---|---|
| 역사 지명 오연결 | 좌표·주변 지명·연대·문서 맥락을 함께 검수 |
| 기관 사이트 구조 변경 | API·안정 ID 우선, adapter contract test와 변경 알림 |
| 과도한 호출 또는 차단 | 기관별 예산, 요청 간격, ETag, 증분 수집 |
| 저작권 오판 | 기본값 `unknown`, 문서 단위 증거와 이중 권리 검수 |
| 기계번역 왜곡 | 원문 병기, 용어집, 핵심 fragment 사람 검수 |
| 한쪽 자료 과대표현 | 국가뿐 아니라 시대·자료유형·기관별 coverage dashboard 운영 |
| 해설을 원자료로 오인 | `primary_source`, `official_position`, `scholarship` 유형 분리 |
| 원기관 정정·삭제 | 주기적 checksum 확인, supersedes·withdrawn 전파 |

## 13. 파일럿 시작 순서

가장 안전한 시작 순서는 다음과 같다.

1. 국가기록원 OpenAPI로 메타데이터 후보를 수집한다.
2. JACAR에서 안정 reference code를 가진 일본 측 공식문서를 수집한다.
3. NARA·TNA에서 전후 제3국 문서 후보를 수집한다.
4. 각 국가 외교부 사이트는 원자료가 아닌 공식 입장 자료로 별도 등록한다.
5. 첫 20건을 완전 수동으로 검수해 메타데이터와 권리 모델을 고친다.
6. 그 뒤에만 자동 수집량을 100건 규모로 늘린다.

이 순서를 따르면 검색량보다 출처·인용·권리의 정확성을 먼저 검증할 수 있다.
