# Changelog

이 저장소의 개발 계획서 변경 사항을 [Semantic Versioning](https://semver.org/) 형식으로 관리한다.

## [1.1.0] - 2026-09-21

### Added

- 영어(`en`) 기본, 한국어(`ko`)·일본어(`ja`) 선택형 언어 정책
- `source_localizations`, `fragment_localizations`, `transcript_localizations` 모델
- 언어별 RAG 색인, 교차언어 검색과 canonical fragment 중복 제거 정책
- MCP 도구의 공통 `language` 입력과 응답 언어·fallback 메타데이터
- 번역 검수, 용어집, 캐시 및 다국어 품질 기준

### Changed

- 문서 제목을 기획안에서 개발 계획서로 변경
- 계획서 버전을 1.1.0으로 설정
- 공개 자료는 영어 제목·초록·핵심 인용 번역을 필수로 요구

## [1.0.0] - 2026-09-21

### Added

- 업로드된 아이디어와 Gencow 공식 문서를 바탕으로 최초 개발 기획 작성
- Gencow 기반 MCP 아키텍처, 데이터 모델, 수집 파이프라인, 도구, 보안 및 구축 단계 정의
