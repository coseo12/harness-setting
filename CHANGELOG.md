# Changelog

이 파일은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/) 포맷을 따르며, 버전은 [Semantic Versioning](https://semver.org/lang/ko/) 을 사용한다.

> **NOTICE — 버저닝 정책 변경 (v2.6.2~)**
>
> "규약 추가 = MINOR" 선례(v2.5.0~v2.6.0) 폐기. v2.6.3 부터 **에이전트 지시어·스킬 절차의 행동 변화는 MINOR**, **행동 변화 없는 문서/문구/오타는 PATCH** 로 분기한다. MINOR/MAJOR 릴리스는 `### Behavior Changes` 섹션을 필수로 포함한다.
> 분류 기준 전문: [CLAUDE.md `### 릴리스`](CLAUDE.md#릴리스).

## [3.6.0] — 2026-04-25

v3.5.0 이후 **MINOR 릴리스** — volt #77 반영 (메인 오케스트레이터 단계 게이트 + headless self-compare 자명 PASS 함정). MINOR 분류는 메인 오케스트레이터의 sub-agent 단계 진행 정책 (행동 제약) 추가로 결정.

**포함 범위**:

- volt #77 반영 (MINOR, /volt-review) — PR [#242](https://github.com/coseo12/harness-setting/pull/242)

### Behavior Changes

- **CLAUDE.md §"sub-agent 검증 완료 ≠ GitHub 박제 완료" 에 "메인 오케스트레이터 단계 게이트" 신규 (volt [#77](https://github.com/coseo12/volt/issues/77))** — `developer → reviewer → qa → 사용자/머지` 순서 강제. developer sub-agent 의 self-compare 자명 PASS 함정 (자기 변경분 baseline 을 자기 변경분으로 비교 → mismatch=0) 을 reviewer/qa 단계가 차단. 예외: docs only / chore (행동 변화 없음 — "행동 변화 vs 문서 변경 판정 질문" 적용). volt #24 (sub-agent 박제 누락) / #33 (headless 한계) / #72 (DoD PASS ≠ 제품 동작) 의 워크플로 게이트 변형. 상세: [docs/lessons/headless-browser-verification.md](docs/lessons/headless-browser-verification.md)

### 내부 변경 요약

- `CLAUDE.md` line 312 — 1줄 포인터 항목 추가 (cross-validate Gemini 권고로 5줄 → 1줄 압축, sha `8eefd921`)
- `docs/lessons/headless-browser-verification.md` — "baseline self-compare 자명 PASS 함정" 단락 신규 (증상 / 원인 분해 / 차단 규약 / CRITICAL #3 와의 관계)

### Notes

- **cross-validate 박제 직후 1회 루틴 완수** — Gemini 2.5 Pro 교차검증 (2026-04-25 18:53) 에서 "1줄 포인터 약속 vs 실제 길이 불일치" 지적 수용 → CLAUDE.md 항목 압축 (5줄 → 1줄, 709 chars 감소). 합의 1건, 이견 0건, 고유 발견 0건. 로그: `.claude/logs/cross-validate-code-20260425-185312.log`
- volt #77 은 cross-repo 이슈로 GitHub auto-close 미동작 (이미 CLOSED 상태). 본 릴리스는 harness 측 박제용

## [3.5.0] — 2026-04-25

v3.4.0 이후 누적된 **MINOR 릴리스** — 볼트 6개 이슈 (#71 #70 #68 #72 #74 #73 #75 #76) 의 하네스 반영. MINOR 분류는 `qa.md` / `pm.md` 에이전트 행동 규칙 신규 + CLAUDE.md 스프린트 계약 6-a / 10-a sub-rule 추가로 결정.

**포함 범위**:

- volt #71 / #70 / #68 반영 (MINOR, /volt-review) — PR [#235](https://github.com/coseo12/harness-setting/pull/235)
- volt #72 / #74 / #73 / #75 / #76 반영 (MINOR, /volt-review) — PR [#236](https://github.com/coseo12/harness-setting/pull/236)

### Behavior Changes

- **CLAUDE.md §"스프린트 계약" 에 6-a "순수 함수 추출 우선 원칙" 신규 (volt [#71](https://github.com/coseo12/volt/issues/71))** — ROI 5문 체크의 "yes 편향" 을 차단하는 보강 3문 + 분기 조건이 입력 타입만으로 결정 / 사이드 이펙트가 반환값 소비로 분리 가능 / 다른 컨텍스트 재사용 여지 — 3조건 중 하나라도 해당 시 **ROI 체크 결과와 무관하게 추출 + 단위 테스트 우선**. "테스트 생략 판정의 drift" 도 회귀 생성원 (volt #49 의 역방향)
- **CLAUDE.md §"스프린트 계약" 에 10-a "메인 오케스트레이터 SSoT JSON 부호 규약 자기 점검" 신규 (volt [#73](https://github.com/coseo12/volt/issues/73) / [#75](https://github.com/coseo12/volt/issues/75))** — SSoT JSON 필드명이 의미 단어 (`regression` / `error` / `loss` / `diff`) 를 포함할 때 부호 규약은 필드명만으론 판정 불가. 메인 오케스트레이터가 수치 DoD 판정 전 **리포트 본문 선행 확인 + 부호 규약 인용** 의무. 극단값 (±100% 이상) 은 부호 규약 재확인 자동 트리거. 항목 10 "측정 방법 검증 우선" 의 메인 오케스트레이터 버전
- **CLAUDE.md §"빌드 성공 ≠ 동작하는 앱" 에 "monorepo dist stale 변형" sub-bullet 추가 (volt [#70](https://github.com/coseo12/volt/issues/70))** — monorepo core 패키지 `src/` 수정 후 앱 dev 서버가 기존 `dist/` 아티팩트를 참조해 수정 미반영. QA 재검증이 결정적으로 동일 실패를 재현해 "수정 효과 없음" 오판 유도. 방어: `pnpm --filter <pkg> build` 선행 + dev 재기동 / `--watch` / tsconfig `paths` src 직접 매핑
- **CLAUDE.md §"빌드 성공 ≠ 동작하는 앱" 에 "엄격 원칙 + 동적 적응 부재 함정" sub-bullet 추가 (volt [#68](https://github.com/coseo12/volt/issues/68))** — 단일 축 엄격 원칙 (사실성/정확/무결) + 동적 문맥 적응 부재 = 자동 검증 PASS / 실사용 실패. 원칙 박제 직후 실 뷰포트 시뮬레이션 필수. 상세: [docs/lessons/strict-principle-dynamic-context.md](docs/lessons/strict-principle-dynamic-context.md)
- **CLAUDE.md §"빌드 성공 ≠ 동작하는 앱" 에 "DoD PASS ≠ 제품 동작" sub-bullet 추가 (volt [#72](https://github.com/coseo12/volt/issues/72) / [#74](https://github.com/coseo12/volt/issues/74))** — 수치 DoD 전부 PASS 여도 기본 진입 화면 (default URL) 이 빈 화면인 UX 회귀 가능. **원칙 폐기 ADR 은 downstream UX 계약 전체 재검증 동반 필수**. UX DoD 는 성능 DoD 와 별도 축으로 박제. 상세: [docs/lessons/ux-dod-vs-product-behavior.md](docs/lessons/ux-dod-vs-product-behavior.md)
- **CLAUDE.md §"sub-agent multi-turn 라운드 이탈" 에 "PM 이슈 DoD 구조 drift 재현" 각주 추가 (volt [#76](https://github.com/coseo12/volt/issues/76))** — volt #34 가 1회성 교훈이 아닌 반복 패턴임을 확증 (astro-simulator P11-B.2 PM 재계약에서 원본 D5 재배치로 사라진 사례)
- **`.claude/agents/qa.md` §2 브라우저 검증 선행 조건 체크리스트 (volt [#70](https://github.com/coseo12/volt/issues/70))** — monorepo core 수정 시 build → dev 재기동 선행 조건 추가. "수정 미반영 false-positive" 차단
- **`.claude/agents/pm.md` multi-turn 라운드 이어받기 규칙 §"DoD 구조 유지 제약" 신규 (volt [#76](https://github.com/coseo12/volt/issues/76))** — 원본 DoD ID 의미 변경 금지 / 사용자 응답은 각 DoD 파라미터 (수치/경계/선택지) 만 조정 / 라운드 N+1 출력에 **DoD 변경 전/후 diff 명시 의무**. 원본 DoD 구조 변경 요구 감지 시 **재계약 필요를 명시적으로 알리고 사용자 재확인 후 진행**

### 내부 변경 요약

**volt #71 #70 #68 (PR #235)** — ROI 보강 + monorepo dist + 엄격 원칙 함정
- `CLAUDE.md` — 스프린트 계약 6-a 신규 + 빌드 성공 ≠ 동작 섹션 sub-bullet 2건 (+12 lines)
- `.claude/agents/qa.md` — §2 선행 조건 체크리스트 (+11 lines)
- `docs/lessons/strict-principle-dynamic-context.md` — 신규 (+67 lines)
- `docs/lessons/README.md` — 인덱스 1줄 추가

**volt #72 #74 #73 #75 #76 (PR #236)** — UX DoD + SSoT 부호 규약 + PM DoD 구조 drift
- `CLAUDE.md` — 10-a sub-rule / UX DoD sub-bullet / #76 각주 (+3 lines)
- `.claude/agents/pm.md` — §"DoD 구조 유지 제약" 신규 섹션 (+18 lines)
- `docs/lessons/ux-dod-vs-product-behavior.md` — 신규 (+71 lines)
- `docs/lessons/README.md` — 인덱스 1줄 추가

### Notes

- **CLAUDE.md 각인 예산** — 31,425 → 33,166 chars (35,000 warn 임계 여유 1,834). 다음 볼트 반영 사이클에서 경고 임계 돌파 가능성 있음. 실전 교훈 블록 중 일부를 `docs/lessons/` 로 추가 승격 검토 필요
- **volt #65 (auto-close 비결정) 스킵 지속** — 1회 관찰 상태 유지. 본 릴리스에서도 재현 추적 대기. 지식 컴파일 규약 "3회 이상 관찰 시 행위 규칙 박제" 미충족
- **cross-repo 볼트 이슈 non-close 정합** — volt 이슈는 auto-close 대상이 아니므로 harness 릴리스 후 수동 close 또는 `capture-merge` 스킬로 처리
- **볼트 이슈 중복 통합 패턴** — #72=#74, #73=#75 는 같은 사례를 재캡처한 중복 이슈. 통합 반영 시 lesson 1 파일 + rule 1 항목으로 처리, CHANGELOG 에는 양쪽 링크 명시
- **PR #235 reviewer non-blocking 권고** (docs/lessons README 진입 추가 / lessons 서두에 volt 원본 vs 승격 분화 목적 선언 / qa.md §2-선행 번호 관습) — 본 릴리스 범위 밖 후속 이슈 후보
- **PR #236 reviewer non-blocking 권고** (CLAUDE.md 여유 1,834 chars warn 임계 근접 / 10-a 단락 560 chars 재현 사례 누적 시 분기 / 실전 교훈 블록 근거 표기 방식 명시화) — 마찬가지로 후속 이슈 후보
- 선행 관찰: volt [#68](https://github.com/coseo12/volt/issues/68) / [#70](https://github.com/coseo12/volt/issues/70) / [#71](https://github.com/coseo12/volt/issues/71) / [#72](https://github.com/coseo12/volt/issues/72) / [#73](https://github.com/coseo12/volt/issues/73) / [#74](https://github.com/coseo12/volt/issues/74) / [#75](https://github.com/coseo12/volt/issues/75) / [#76](https://github.com/coseo12/volt/issues/76)

---

## [3.4.0] — 2026-04-23

v3.3.0 이후 누적된 **MINOR 릴리스** — PATCH (회귀 가드 영속화) + MINOR (cross-validate / reviewer / CLAUDE.md 행동 규칙 각인) 혼합. MINOR 분류는 에이전트 지시어·스킬 절차 행동 변경으로 결정.

**포함 범위**:

- [#228](https://github.com/coseo12/harness-setting/issues/228) — 6c 리포팅 회귀 가드 3건 (PATCH) — PR [#231](https://github.com/coseo12/harness-setting/pull/231)
- volt #66 / #67 / #69 반영 (MINOR, /volt-review) — PR [#232](https://github.com/coseo12/harness-setting/pull/232)

### Behavior Changes

- **cross-validate 스킬 §결과 분석에 "단계 0 수용 전 실측 sanity check" 선행 추가 (volt [#66](https://github.com/coseo12/volt/issues/66))** — Gemini 가 제안한 **수치 DoD 재정의·물리/환경 제약** 은 ADR/계약 박제 전 1회 실측으로 자가모순 확인 선행. AI (Gemini+Claude 공유) "엄격한 DoD = 안전" 편향으로 self-contradiction 을 간과하는 경향 차단. 교차검증 자체로는 이 편향을 걸러내지 못하므로 실측이 유일한 가드
- **reviewer 에이전트 §절차에 "파괴적 리팩토링 체크리스트" (step 4) 추가 (volt [#69](https://github.com/coseo12/volt/issues/69))** — 상수 제거·SSoT 이동·함수 폐기 PR 에 4단계 점검 의무화: `(Grep) 저장소 전체 검색` / `(Dead Reference) 주석 SSoT 참조 확인` / `(Invariant Test) 상대 비율 불변식 테스트` / `(ADR Prediction) 예측 대비 실측 diff`. 주 모듈에서 상수 폐기 + 위성 모듈 독립 선언 잔존으로 상대 비율/스케일 drift 를 조용히 생성하는 "은닉 상수 drift" 패턴 차단. step 5/6 번호 재매핑
- **CLAUDE.md 실전 교훈 §"인계 항목 실측 재검증" 에 "조사 국면 확장" 추가 (volt [#67](https://github.com/coseo12/volt/issues/67))** — Explore 정적 분석이 `(C) 미결정` 반환 시 20~30줄 debug 스크립트 실측 선행 권장. 정적 분석은 주석·타입 시그니처까지만 본다 — runtime 조건 분기 omission 버그는 실측이 유일한 확정 경로
- **CLAUDE.md §"교차검증" 에 "수용 전 실측 sanity check" cross-ref 1줄 추가** — cross-validate 스킬 단계 0 과 교차 참조
- **CLAUDE.md §"주석 계약 vs 구현 drift" 에 "숨은 상수 변형" cross-ref 1줄 추가** — reviewer 파괴적 리팩토링 체크리스트와 교차 참조

### 내부 변경 요약

**#228 (PR #231)** — 6c 리포팅 회귀 가드 3건 (non-blocking 제안 영속화)
- `test/ci-6c-report-url.test.js` — 테스트 3건 추가 (132 → 135 pass)
  - `REPORT_ISSUE_BASE_URL` ↔ `package.json::repository.url` drift 가드 (포크/리네임 조기 감지)
  - `collectEnvMeta` `unreadable` 경로 (chmod 000, win32 skip, root readable silent skip)
  - 극단 긴 `harnessVersion` 현 동작 영속 관찰 — 갈래 (a) 관찰만 선택 (premature abstraction 회피)
- `package.json` — npm 표준 `repository` 필드 추가 (drift 가드 SSoT). metadata 만, 행동 변화 없음

**volt #66 #67 #69 (PR #232)** — harness 행동 규칙 승격
- `.claude/skills/cross-validate/SKILL.md` — §결과 분석 단계 0 추가 (+1 line)
- `.claude/agents/reviewer.md` — §절차 step 4 파괴적 리팩토링 체크리스트 추가 + 5/6 번호 재매핑 + 카테고리 볼드 레이블 (+9 / -2 lines, cross-validate Gemini 제안 수용 후속 커밋 포함)
- `CLAUDE.md` — cross-ref 3줄 추가 (+3 lines, 28470 → 29533 code points, 35k 임계 여유 5467)

### Notes

- **volt #65 (auto-close 비결정) / #68 (Fact-First 가시성 침식) 은 의도적 스킵** — #65 는 1회 관찰 (본문 자체가 3회 대기 명시), #68 은 astro-simulator 도메인 특수로 일반 원칙이 기존 CRITICAL #3 / "빌드 성공 ≠ 동작" 으로 커버됨. 지식 컴파일 규약 준수 (1회 관찰 즉시 규칙화 금지)
- **cross-validate 박제 직후 루틴 (volt #23) 실측 재현** — PR #232 자체를 Gemini 로 교차검증 (outcome=applied). 고유 발견 "볼드 레이블" 1건 수용 → 후속 커밋 `ee5f5588`. CLAUDE.md 크기 주의 권고는 §비대화 방지 정량 게이트로 기 커버됨 (오탐 아님, 중복 반영 불필요)
- **Gemini API 429 재시도 5회 후 정상 응답** — capacity 소진 중에도 스크립트 레벨 retry 로 완주. claude-only 폴백 박제 불필요 (outcome=applied)
- **PR #231 QA sub-agent 의 `chmod 000` 회귀 가드 변조-원복 사이클** — 3건 모두 기대대로 FAIL 재현 후 원복 확인, 작업 트리 clean. 회귀 감지 실효성 검증 완료
- 선행 관찰: volt [#66](https://github.com/coseo12/volt/issues/66) / [#67](https://github.com/coseo12/volt/issues/67) / [#69](https://github.com/coseo12/volt/issues/69)

---

## [3.3.0] — 2026-04-23

v3.2.0 이후 **단일 PR MINOR 릴리스** — v3.0.0 `.github/workflows/` 책임 분리 마이그레이션의 6c 경로 리포팅 자동화. 사용자 수정 감지로 자동 분리가 스킵된 다운스트림이 환경 메타를 담은 **pre-filled GitHub 이슈 URL** 로 원클릭 리포트할 수 있도록 확장.

**포함 범위**:

- [#208](https://github.com/coseo12/harness-setting/issues/208) — 6c 경로 리포팅 자동화 (pre-filled URL + 마크다운 템플릿, MINOR) — PR [#227](https://github.com/coseo12/harness-setting/pull/227)

### Behavior Changes

- **v3.0.0 마이그레이션 6c 경로 stderr 포맷 확장 (`lib/migrations/2.31.0-to-3.0.0.js`)** — 사용자 수정 감지로 자동 분리가 스킵될 때 stderr 메시지 앞에 `[ACTION REQUIRED]` 헤더가 붙고, 환경 메타 (harness version / Node version / OS / ci.yml sha256 앞 12자리) 가 **pre-filled 된 GitHub 이슈 URL** 이 출력된다. 사용자는 URL 을 클릭해 `.github/ISSUE_TEMPLATE/6c-migration-report.md` 템플릿으로 이동 후 관찰/동기만 보완해 제출할 수 있다. `notes` 배열 내용도 동일하게 확장
- **신규 이슈 템플릿 `.github/ISSUE_TEMPLATE/6c-migration-report.md`** — 6c 경로 리포트 전용 classic markdown 템플릿. 환경 메타 자동 수집 + 관찰/동기/재현 섹션 구조 제공. 라벨은 기존 `enhancement` + `scope:framework` 재사용 (신규 라벨 생성 없음)
- **수동 가이드 (`docs/harness-ci-migration.md`) §"6c 감지 시 리포팅" 섹션 신규** — stderr URL 사용법과 pre-filled 필드 명세. 제출 의무는 없음 (선택적)

### 내부 변경 요약

**#208** — 6c 경로 리포팅 자동화 (volt-style downstream 시그널 수집)

- `lib/migrations/2.31.0-to-3.0.0.js` — `collectEnvMeta(cwd)` / `build6cReportUrl(meta)` 헬퍼 추가 (테스트에서 import 가능하도록 `_helpers` 로 export). 6c 분기 stderr / notes 에 ACTION REQUIRED 헤더 + pre-filled URL 삽입. 기존 6a / 6b / already-migrated 경로와 멱등성 불변
- `.github/ISSUE_TEMPLATE/6c-migration-report.md` 신규 — frontmatter + 환경 메타 / 관찰 내용 / 재현 정보 섹션
- `test/ci-6c-report-url.test.js` 신규 — 10 테스트 (collectEnvMeta 3 경로, URL 포맷 / 환경 메타 삽입 / title 식별자 / 한글·특수문자 round-trip / URL 길이 / raw 한글 부재 / 6c 통합 / 템플릿 파일 존재)
- `docs/harness-ci-migration.md` — "6c 감지 시 리포팅" 섹션 추가

### Notes

- URL 길이는 표준 메타 기준 약 1.4KB 로 GitHub 제한 (~8KB) 대비 여유
- body 파라미터는 환경 메타 섹션만 자동 채우고 나머지는 placeholder 로 둠 (전체 템플릿 복제 시 drift 위험 + URL 팽창). GitHub 이 `body=` 제공 시 `template=` 의 본문을 교체하는 동작에 대응
- 라벨 `migration:6c` 는 기존에 존재하지 않아 신규 생성 없이 `enhancement` + `scope:framework` 조합 재사용 (신규 라벨 도입 여부는 본 범위 밖)
- 선행 관찰: PR [#206](https://github.com/coseo12/harness-setting/pull/206) ADR 교차검증 (Gemini 2.5-pro) 고유 발견 — 범위 밖으로 #208 분리

---

## [3.2.0] — 2026-04-23

v3.1.2 이후 **단일 PR MINOR 릴리스** — CI 자체 검증 경로 확장. upstream 3중 방어의 다운스트림 blindspot (pnpm workspace + dist-based exports) 을 fixture 로 영속 가드.

**포함 범위**:

- [#190](https://github.com/coseo12/harness-setting/issues/190) — CI fixture: pnpm workspace 스모크 테스트 (MINOR + ADR) — PR [#223](https://github.com/coseo12/harness-setting/pull/223)

### Behavior Changes

- **CI `fixture-smoke-test` job 추가 (`.github/workflows/ci.yml`)** — pnpm workspace + dist-based exports 경로를 upstream PR 단계에서 실측 검증. v2.28.2 (`pnpm: not found`) / v2.29.1 (`--if-present` forwarding) 부류 regression 이 upstream 에서는 초록이고 다운스트림에서만 빨강으로 드러나던 blindspot 차단. 다운스트림에 직접 영향 없으나, harness 자체 릴리스 품질 향상으로 `harness update` 회귀 빈도 감소 기대
- **`package.json::files` 누수 가드 영속화 (`test/package-files-no-test-leak.test.js`)** — `test/fixtures/*` 가 실수로 `files` 배열에 포함돼 다운스트림에 publish 되는 것을 유닛 테스트로 차단. Gemini 교차검증에서 "매우 중요한 보안 가드" 로 격상
- **DX: 루트 `scripts.test:fixture` 추가** — 로컬에서 `npm run test:fixture` 로 fixture 독립 실행 가능 (`cd test/fixtures/pnpm-monorepo && pnpm install --frozen-lockfile && pnpm run --if-present test`)

### 내부 변경 요약

**#190 (PR #223)** — upstream self-coverage 확장
- `test/fixtures/pnpm-monorepo/` 신규 — `@fixture/lib` (dist-based exports) + `@fixture/app` (`workspace:*` 소비) 최소 구조 13 파일 (`.gitignore` / `package.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml` / `packages/{lib,app}/*`)
- `.github/workflows/ci.yml` — 신규 `fixture-smoke-test` job (matrix.fixture 확장 지점 + `package_json_file` 명시로 root `packageManager` 부재 대응)
- `docs/decisions/20260423-ci-fixture-pnpm-workspace.md` 신규 — ADR 박제 (축 3개 비교)
- `docs/harness-update-compat-checklist.md` — 체크리스트 1~2 항목 ↔ fixture 양방향 링크
- `test/ci-fixture-smoke-test.test.js` / `test/package-files-no-test-leak.test.js` 신규 — 유닛 가드 2개 (CI job 선언 정규식 + `files` 누수 blacklist/whitelist 이중 방어)
- `scripts.test:fixture` DX 스크립트

### Notes

- regression signature 는 pnpm 9 에서 `--if-present` forwarding 이 재현되지 않아 **dist-based exports 의존 실패** 로 전환 (v2.29.1 의도를 더 정확히 표현). 실패 Actions 링크는 PR #223 에 박제
- ADR §최종 CI job 구조 블록에 `package_json_file` 각주 추가 (reviewer non-blocking 제안 #1, footnote 로 Amendment 해결)
- 범위 밖 (후속 이슈): WASM fixture (ADR 위험 #4), yarn/bun matrix 확장 (ADR 재검토 조건 #3)
- 선행 관찰: volt [#62](https://github.com/coseo12/volt/issues/62) / [#64](https://github.com/coseo12/volt/issues/64)

---

## [3.1.2] — 2026-04-23

v3.1.1 이후 누적된 **단일 PR PATCH 릴리스**. 행동 변화 없음 (도구 + ADR 추가, 에이전트 파일 미수정).

**포함 범위**:

- [#184](https://github.com/coseo12/harness-setting/issues/184) — sub-agent 반환 JSON SSoT 런타임 variance 검증 (PATCH + ADR) — PR [#220](https://github.com/coseo12/harness-setting/pull/220)

### Behavior Changes: None — 도구 + ADR 추가

신규 `lib/verify-agent-return.js` / `scripts/verify-agent-return.sh` 는 메인 오케스트레이터 opt-in 호출 도구이며 에이전트 파일(`.claude/agents/*.md`)은 미수정. hook 자동화 없음 → 에이전트가 같은 입력에 다르게 동작하지 않음. 본 섹션 명시는 CLAUDE.md `### 릴리스` 규약 (PATCH 도 frozen 변경 시 `### Behavior Changes` 명시) 준수.

### 내부 변경 요약

**#184 (PR #220)** — 정적 `verify-agent-ssot.sh` 의 blindspot (sub-agent 런타임 반환 variance) 해소
- `docs/decisions/20260422-subagent-runtime-variance-defense.md` 신규 — ADR 박제 (후보 A/B/C/D 비교, 채택 A: 메인 post-parse 헬퍼)
- `lib/verify-agent-return.js` 신규 — 9 코어 필드 존재 + 타입 + enum 검증. `--json` / `--file` / `--stdin` 3 입력 모드
- `scripts/verify-agent-return.sh` 신규 — Node 호출 thin wrapper (shell 호환)
- `test/verify-agent-return.test.js` 신규 — 16 테스트 (3 variance 패턴 실측 재현: #167/#178 필드 누락, #170 null 이탈)

### Notes

- volt [#57](https://github.com/coseo12/volt/issues/57) "3회 박제 규약" 발동 근거 실측 — #167 / #170 / #178 3건에서 정적 45/45 pass + 런타임 variance 병존 관찰
- 후보 B (jq schema) 는 ADR 20260420 (jq NO-OP) 와 상충하여 기각 — ADR 간 일관성 유지
- 후보 C (LLM 자가 체크) 는 variance 원인 = 검증 주체의 논리적 약점으로 기각
- 후보 D (3층 방어) 는 본 범위 외 — ADR "미래 확장 여지" 에 명시

---

## [3.1.1] — 2026-04-22

v3.1.0 이후 누적된 **2개 PR 통합 PATCH 릴리스**. 행동 변화 없음 (문서 + 가드 강화).

**포함 범위**:

- [#213](https://github.com/coseo12/harness-setting/issues/213) — `docs/lessons/` 목차 README + `scripts/verify-lessons-readme.sh` 동기화 가드 (PATCH) — PR [#216](https://github.com/coseo12/harness-setting/pull/216)
- [#203](https://github.com/coseo12/harness-setting/issues/203) — `verify-docs-links.js` 엣지케이스 + 상수 SSoT + locale 독립성 (PATCH) — PR [#217](https://github.com/coseo12/harness-setting/pull/217)

### Behavior Changes: None — 내부 도구 강화 + 문서

frozen 파일 (`lib/` / `scripts/` / `docs/lessons/`) 이 변경되어 다운스트림 `harness update` 시 반영되나, 에이전트가 같은 입력에 다르게 동작하지 않음. 본 섹션 명시는 CLAUDE.md `### 릴리스` 규약 (PATCH 도 frozen 변경 시 `### Behavior Changes` 명시) 준수.

### 내부 변경 요약

**#213 (PR #216)** — `docs/lessons/` 확장 대비 선제적 인덱스
- `docs/lessons/README.md` 신규 — 6 파일 목차 (제목 / 1줄 요지 / 관련 볼트 이슈)
- `scripts/verify-lessons-readme.sh` 신규 — `docs/lessons/*.md` ↔ README 동기화 drift 자동 차단
- `.github/workflows/harness-guards.yml` — 신규 가드 step 통합

**#203 (PR #217)** — verify 인프라 robustness 3종
- `verify-docs-links.js` 엣지케이스: tilde 펜스 / HTML 주석 / 4-space 들여쓰기 / reference-style 링크 정의
- `lib/claudemd-size-constants.js` SSoT 신설 — 35k/40k/45k 임계값을 3 위치 하드코딩에서 1 파일로 통합
- `lib/verify-claudemd-size.js` Node 포트 — self-hosted runner 에서 `LC_ALL=en_US.UTF-8` locale 미설치 시 62% byte 부풀림 오탐 차단. `scripts/verify-claudemd-size.sh` 는 thin wrapper 로 잔존 (호환 100%)

### Notes

- 세션 누적 실측: PR #211 (v3.1.0 포함) 에서 도입한 awk 교체가 PR #212 / #217 의 large diff cross-validate 를 정상 통과시킴 (2000 라인 초과 조용한 exit 재발 0건)
- `docs/lessons/` 가 10+ 파일로 확장될 때 Phase 3-B (Tier 1 블록 이동) 와 묶어 재평가 가능 — #213 후속 이슈 제안에 명시

---

## [3.1.0] — 2026-04-22

v3.0.0 이후 누적된 **2개 PR 통합 릴리스**. MINOR 분류는 [#195](https://github.com/coseo12/harness-setting/issues/195) 의 "N 적용 시나리오" 라벨 규약 (에이전트 행동 변화) 에 의해 결정. #194 / #199 / #207 동반 수록.

**포함 범위**:

- [#207](https://github.com/coseo12/harness-setting/issues/207) — `cross_validate.sh` diff 2000줄 초과 SIGPIPE 회귀 수정 (PATCH, bug fix) — PR [#211](https://github.com/coseo12/harness-setting/pull/211)
- [#199](https://github.com/coseo12/harness-setting/issues/199) — CLAUDE.md 비대화 방지 Phase 3-A (실전 교훈 Tier 2 + 교차검증 추출, **MINOR**) — PR [#212](https://github.com/coseo12/harness-setting/pull/212)
- [#195](https://github.com/coseo12/harness-setting/issues/195) — "N 적용 시나리오" 실측/가정 라벨 규약 + 박제 문턱 공식 (**MINOR**, #199 와 함께 흡수)
- [#194](https://github.com/coseo12/harness-setting/issues/194) — cross-validate flag 가드 검증 명령 템플릿 (PATCH, #199 와 함께 흡수)

### Behavior Changes — #199 Phase 3-A 실전 교훈 + 교차검증 추출 (MINOR)

- **CLAUDE.md 각인층 대폭 감축** — 43,305 → 28,470 chars (**34% 감축**, 목표 35k 대비 17% 여유). Tier 2 실전 교훈 7 블록 + 교차검증 섹션 전체를 `docs/lessons/` + `docs/guides/` 로 추출. CLAUDE.md 는 1~3 줄 포인터만 유지
- **신규 `docs/lessons/` 디렉토리** — 실전 교훈 전용 (6 파일): `ci-and-downstream-verification.md` / `workflow-dispatch-pitfalls.md` / `comment-implementation-drift.md` / `data-not-code-extension.md` / `headless-browser-verification.md` / `sub-agent-multiturn-drift.md`
- **신규 `docs/guides/cross-validate-protocol.md`** — 교차검증 섹션 전문 (폴백 프로토콜 / 편향 체크리스트 / 검증 매트릭스 / 고유 발견 3단 프로토콜)
- **`.claude/skills/run-tests/SKILL.md` 참조 경로 갱신** — `CLAUDE.md "주석 계약 vs 구현 drift"` → `docs/lessons/comment-implementation-drift.md` 로 치환

### Behavior Changes — #195 '적용 시나리오' 라벨 규약 (MINOR)

- **"N 적용 시나리오" 근거 박제 시 `[실측]` / `[가정]` 라벨 필수** — 라벨 없는 시나리오 동등 나열 금지. 1회 관찰을 N 시나리오로 일반화 주장할 때의 남용 방지
- **박제 문턱 공식** — 실측 ≥ 1 + 가정 ≥ 3 + 공통 조건 매트릭스 (3조건 동시 충족). 반영 위치: `docs/lessons/ci-and-downstream-verification.md`
- **미래 승격 트리거** — `[가정]` 관찰 시 `[실측]` 라벨로 갱신 + 박제 문턱 재평가 (관찰 이슈 링크 필수)
- **소급 적용** — volt #60 (다운스트림 실측이 최종 가드) 의 5 시나리오 중 npm↔React 만 `[실측]`, 나머지 4개는 `[가정]` 로 라벨 부여

### Behavior Changes — #194 cross-validate flag 가드 검증 명령 템플릿 (PATCH)

- **flag 호환성 검증 템플릿** — `<tool> --help | grep -A 2 <flag>` (공식 지원 여부 판정). 반영 위치: `docs/guides/cross-validate-protocol.md` §6.3
- **실측 예시 2건** — pnpm `--if-present` (미지원, 서브커맨드 형태 필수) / npm `--if-present` (공식 지원, 직접 사용). volt #59 셀프 위반 재발 방지
- **판정 기준 3가지** — 결과 존재 (지원) / 결과 없음 (미지원, 복사 금지) / 애매 (공식 문서 재확인)

### Behavior Changes — #207 cross-validate diff truncation (PATCH)

- **`cross_validate.sh` 의 `echo | head -2000` → `printf | awk 'NR<=2000'`** 로 교체 — `set -euo pipefail` 하에서 파이프 버퍼(64KB) 초과 시 SIGPIPE 로 조기 exit 141 되던 버그. awk 는 EOF 까지 입력 소비하여 SIGPIPE 회피
- **회귀 가드 신설** — `test/cross-validate-diff-truncation.test.js` (gh/gemini mock 으로 3000 라인 / 1000 라인 두 분기 검증)

### Phase 3-B 판단 (#199 Phase 3 완결)

Phase 3-A 만으로 목표 (35k) 달성 + 여유 확보. Tier 1 블록 (sub-agent 검증 완료 5,642 bytes / 매니페스트 최신 3,711 bytes) 은 10 파일 / 5 파일 SSoT 결합 복잡도가 높고 현 28k 수준에서 추가 감축 이득 작음. **Phase 3-B 불필요 — #199 완결**. 후속 발견 [#213](https://github.com/coseo12/harness-setting/issues/213) (`docs/lessons/README.md` 목차) 은 별도 이슈로 분리 (Phase 3-B 재평가 시점과 묶어 처리 가능).

### Notes

- cross-validate PR #212 결과 `applied` (종합 양호) — 단일 모델 편향 노출 확보. Gemini 고유 발견 1건 (`docs/lessons/README.md` 목차) 은 현 스프린트 비목표로 #213 후속 이슈 분리
- diff 가 큰 PR 검증 시 #207 수정이 선행 적용되어 Gemini 호출 도달 성공 (2000 라인 초과 diff 에서 조용한 exit 재발 방지)

---

## [3.0.0] — 2026-04-22

v2.31.0 이후 누적된 **5개 PR 통합 릴리스**. MAJOR 분류는 [#196](https://github.com/coseo12/harness-setting/issues/196) 의 breaking change (파일 rename + 카테고리 재분류) 에 의해 결정. 포함된 MINOR 2건 (#197 / #200) 의 Behavior Changes 도 본 엔트리에 수록.

**포함 범위**:

- [#196](https://github.com/coseo12/harness-setting/issues/196) — `.github/workflows/` 책임 분리 (**MAJOR**, breaking: 파일 rename + 카테고리 재분류). volt [#62](https://github.com/coseo12/volt/issues/62) 실측 (astro-simulator PR #270 6단계 push-fail-fix 루프) 근거
- [#197](https://github.com/coseo12/harness-setting/issues/197) — CLAUDE.md 비대화 방지 근본 지침 박제 (**MINOR**, Phase 1)
- [#200](https://github.com/coseo12/harness-setting/issues/200) — CLAUDE.md 각인 예산 강제 메커니즘 (**MINOR**, Phase 2)
- [#199](https://github.com/coseo12/harness-setting/issues/199) — Phase 3 추출 실행 계획 박제 (PATCH, 설계 전용 — 행동 변화 없음)
- [#202](https://github.com/coseo12/harness-setting/issues/202) — verify-docs-links 삼항 단순화 + leading slash 회귀 가드 (PATCH, 행동 변화 없음)

### Behavior Changes — #196 `.github/workflows/` 책임 분리 (MAJOR)

- **`.github/workflows/harness-*.yml` 만 frozen (upstream 소유)** — `lib/categorize.js` 규칙 변경. 이전에는 `.github/workflows/` 디렉토리 전체가 frozen 이었음. **다운스트림 ci.yml 을 이제 자유롭게 수정 가능** — upstream `harness update --apply-all-safe` 가 더 이상 ci.yml 을 덮어쓰지 않는다. 근거: volt #62 에서 관찰된 "upstream 가드 vs 다운스트림 빌드 혼재" 구조 문제 해소
- **`.github/workflows/ci.yml` → user-only 로 재분류** — 말미 harness 전용 가드 블록 (agent SSoT / release version bump / CLAUDE.md 각인 / CLAUDE.md 링크) 4개가 신규 `harness-guards.yml` 로 이동. ci.yml 에는 `detect-and-test` (다언어 자동 감지/실행) 만 잔존
- **`.github/workflows/harness-guards.yml` 신설 (frozen)** — upstream 전용 가드 workflow. 각 step 은 `hashFiles('scripts/verify-*.sh') != ''` 조건으로 보호돼 해당 스크립트 미보유 다운스트림에선 조용히 스킵
- **`.github/workflows/pr-review.yml` → `harness-pr-review.yml` rename** — 내부 `name:` 도 `Harness PR 자동 리뷰 트리거` 로 갱신. harness- prefix 관습 준수
- **자동 마이그레이션 hook 도입** — `lib/migrations/2.31.0-to-3.0.0.js` 가 3단 매칭으로 기존 다운스트림을 자동 전환:
  - **6a** (ci.yml 순정 v2.31.0) → 완전 덮어쓰기
  - **6b** (detect-and-test 수정 + 가드 블록 byte-exact 원형) → 가드 블록만 제거
  - **6c** (가드 블록 자체 수정) → 스킵 + stderr 수동 가이드 (`docs/harness-ci-migration.md`)
- **백업 보장** — 모든 마이그레이션 경로가 원본 ci.yml / pr-review.yml 을 `.harness/backup/ci-split-<ISO-timestamp>/` 에 자동 보존. 실패 시 수동 복원 경로 명확
- **마이그레이션 실패 시 `exit 1` 금지** — 6c 경로는 notes + stderr 경고 반환, `harness update` 전체가 실패하지 않도록 보장 (CLAUDE.md "매니페스트 최신 ≠ 파일 적용 완료" 교훈)
- **`docs/frozen-file-split.md` / `docs/harness-update-compat-checklist.md` 갱신** — v3.0.0 책임 경계 명문화. 기존 "옵션 C (divergent 수정)" 의 단점이 해소됐음을 명시
- **`docs/harness-ci-migration.md` 신설** — 6c 경로 발동 시 수동 마이그레이션 가이드 (단계별 체크리스트 + 제거 대상 step 목록)

### Behavior Changes — #197 CLAUDE.md 비대화 방지 (MINOR, Phase 1)

- **새 실전 교훈/프로토콜 블록 추가 시 기본 경로 변경** — `docs/lessons/<topic>.md` (또는 유사 위치) 생성 + CLAUDE.md 는 1~3 줄 포인터만. 매트릭스(3행+)·코드블록(5라인+)·프로토콜(3스텝+)·근거 체인(이슈 2+) 은 `docs/` 로 추출 대상
- **인라인 유지 예외 절차** — 예외는 ADR 로만 박제 (`docs/decisions/<YYYYMMDD>-claudemd-exception-<topic>.md`). 사유·대체 불가 근거·재검토 조건 필수
- **정량 게이트 선언** — 35k chars warn / 40k PR warn (신규 인라인 금지 안내) / 45k CI fail. 강제 메커니즘은 #200 에서 구현
- **40k/45k 임계 접근 시 대응 원칙** — "예외 박제" 가 아니라 **기존 블록 가지치기 (각인층 → 참조층 이동)**
- **상세 프로토콜 위치** — `docs/guides/claudemd-governance.md` 9 섹션 (임계 조정 여지 / 동적 운영 지표 / 가지치기 프로세스 / 링크 무결성 CI / 1인 개발자 환경 ADR 대체 등)

### Behavior Changes — #200 CLAUDE.md 각인 예산 강제 (MINOR, Phase 2)

- **CLAUDE.md 가 45k chars 초과 시 CI fail** — `scripts/verify-claudemd-size.sh` 가 `detect-and-test` 에서 exit 1 반환 → PR 머지 차단. 환경변수 override: `CLAUDEMD_SIZE_LIMIT_FAIL` / `CLAUDEMD_SIZE_LIMIT_WARN_PR` / `CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY`
- **40k 초과 시 PR 체크 로그 경고** — exit 0 유지 (머지 차단 없음), 신규 인라인 금지 안내 노출
- **`harness doctor` "CLAUDE.md 각인 예산" 항목 추가** — 로컬 charCount 기반 pass/warn/fail 3단 가시화
- **CLAUDE.md 상대 링크 rot 방어** — `scripts/verify-docs-links.sh` + `lib/verify-docs-links.js` 가 깨진 상대 링크 감지 시 CI fail. 코드펜스/인라인 코드/외부 URL/앵커 전용 링크 스킵
- **현재 실측**: CLAUDE.md = **43,305 chars** (PR warn 구간, exit 0). Phase 3 (#199 설계 박제 → 후속 세션 Phase 3-A PR 실행) 에서 35k 이하 복귀 예정

### Migration Guide (다운스트림)

```bash
# 1. harness update 실행 (자동 마이그레이션 시도)
npx github:coseo12/harness-setting update --apply-all-safe

# 2. 출력에서 분기 확인:
#    - "가드 블록 제거 완료 (6a/6b 경로)" → 성공
#    - "6c — 사용자 수정 감지" (stderr) → 수동 절차 필요 → docs/harness-ci-migration.md

# 3. 검증
npx github:coseo12/harness-setting doctor
```

자세한 경로 판정 로직: [docs/decisions/20260421-workflows-responsibility-split.md](docs/decisions/20260421-workflows-responsibility-split.md) §3단 매칭.

### Notes

- **MAJOR 정당화 근거** — `lib/categorize.js` 의 공개 계약 (카테고리 분류 규칙) 이 변경됐고, 파일 rename (`pr-review.yml` → `harness-pr-review.yml`) 이 다운스트림 브랜치 보호 룰의 required check 이름에도 영향. SemVer 분류 기준상 "하위 호환 깨지는 변경" 에 해당
- **ADR 박제** — `docs/decisions/20260421-workflows-responsibility-split.md` (후보 비교 4개 축 + 결정 근거 + Concrete Prediction 3개 + 재검토 트리거 4개). architect 코멘트에 "생성 완료" 로 표기됐으나 디스크엔 부재였던 누락을 보완
- **Concrete Prediction 실증** — (1) 다운스트림 ci.yml 커스터마이즈 유지 확인 / (2) upstream harness-guards.yml 자동 전파 / (3) 멱등성 (2회차 변경 0) 3건 모두 테스트로 검증 완료 (`test/ci-split-migration.test.js` 7 테스트 통과)
- **Phase 분리 고려** — 본 릴리스는 카테고리 변경 + 파일 rename + 마이그레이션을 한 번에 묶었다. Phase 1 (categorize 수정) + Phase 2 (마이그레이션) 분리도 검토했으나, Phase 1 단독 배포 시 기존 다운스트림에서 "가드 블록이 ci.yml 과 harness-guards.yml 양쪽에서 실행" 되는 상태가 발생해 backward-compat 조건 불만족 → 단일 릴리스로 통합. CLAUDE.md `### 릴리스` "Phase 분리 리듬" 판정 기준 적용
- **upstream 3중 방어 blindspot 인지** — 다운스트림 실 적용이 최종 가드 (CLAUDE.md 교훈). 본 PR 머지 후 대표 다운스트림 (astro-simulator) 에서 `harness update` 실행 결과를 1차 모니터링 대상. 6c 경로 발동 빈도가 재검토 트리거
- **추가 수록 PR (행동 변화 없음)**:
  - [#199](https://github.com/coseo12/harness-setting/issues/199) Phase 3 실행 계획 박제 (PATCH) — Tier 분류 + Phase 3-A (~27k chars 감축 예상) / 3-B 분할. CLAUDE.md 본문 무수정. 실제 추출 실행은 후속 세션의 Phase 3-A PR 에서 수행
  - [#202](https://github.com/coseo12/harness-setting/issues/202) verify-docs-links 청결성 (PATCH) — 삼항 연산자 무의미 단순화 + leading slash 회귀 가드 테스트. `path.resolve` 전환 제안은 파일 시스템 루트 이탈 버그 유발로 반려 (PR #201 cross-validate 재시도 결과)
- **drift 보완 경위** — 본 v3.0.0 엔트리는 최초 #196 만 담고 있었으나, v2.31.0 이후 develop 에 누적된 #197/#200 MINOR Behavior Changes 와 #199/#202 PATCH 가 누락된 상태였음. release PR (develop → main) 생성 직전 drift 감지 → CHANGELOG 보강 커밋으로 통합. CLAUDE.md 릴리스 규약 "MINOR/MAJOR 릴리스는 `### Behavior Changes` 섹션 필수 포함" 준수

### Breaking Changes Summary

다운스트림이 본 릴리스 적용 시 **수동 개입이 필요한 유일한 경우**는 `.github/workflows/ci.yml` 의 가드 블록을 **byte-exact 원형에서 벗어나게 수정**한 경우 (6c 경로). 이 경우 `docs/harness-ci-migration.md` 를 참조한 수동 절차 필요. 그 외 모든 경우 `harness update` 1회 실행으로 자동 마이그레이션.


## [2.31.0] — 2026-04-20

[#191](https://github.com/coseo12/harness-setting/pull/191) — volt [#62](https://github.com/coseo12/volt/issues/62) [#63](https://github.com/coseo12/volt/issues/63) 반영. 세션 의도 이탈 감지 + harness update 부합성 체크리스트 (MINOR). volt [#64](https://github.com/coseo12/volt/issues/64) 는 [harness#190](https://github.com/coseo12/harness-setting/issues/190) 실행 이슈로 분리.

### Behavior Changes

- **메인 오케스트레이터 세션 의도 이탈 감지 규약 신설** — CLAUDE.md `## 원칙` 에 '세션 의도 이탈 감지' 섹션. 이탈 시그널 4개 (upstream PR 3+ / 릴리스 태그 역전 / 세션 시간 × 2 보조 / 관심사 4+ 트랙) 중 **2개 이상 충족 시 사용자에게 '원 의도 복귀 vs 현 작업 완결' 명시 선택 요청** 의무. 각 시그널에 `gh` / `git` 런타임 측정 명령 박제. 예외 조건은 **세션 시작 시점 이전 사용자 선언 한정** + **사후 재분류 금지** (escape hatch 차단, reviewer #191 권고 #2). 근거: volt #63 — 2026-04-20 세션 실측 (P10-A 의도가 harness 3 릴리스로 80% 흡수)
- **`docs/harness-update-compat-checklist.md` 신규 박제** — `harness update` 다운스트림 적용 전 4단계 사전 체크 (모노레포 재귀 호출 / 빌드 산출물 exports / 특수 빌드 도구 / 기존 전용 워크플로) + 4개 옵션 비교표 (A scripts.test 제거 / B no-op shim / C divergent / D upstream 확장). 판정 애매 시 A 추천. astro-simulator PR #270 6단계 실측 trace 수록. CLAUDE.md 실전 교훈에 참조 링크 박제. 근거: volt #62
- **외부 툴 가드 "Claude 도입 / Gemini 제안 공통" 표제 유지** (v2.30.0 이어) + 본 릴리스에서 체크리스트 문서로 확장

### Notes

- **메타 소급 투명성** — 본 세션 자체가 volt #63 이탈 시그널 4/4 충족 (오늘 11번째 릴리스). 박제 당시에는 '원 의도 = 인프라 운영' 예외 조건으로 시그널 무시했으나, reviewer #191 권고 #2 가 이 escape hatch 를 정확히 지적 → '세션 시작 시점 이전 선언 한정 + 사후 재분류 금지' 규약 추가로 본 규약 자체의 실효성 강화. 자기 비판적 박제 완료
- **Reviewer 권고 5건 전부 반영** — escape hatch 차단 / 런타임 측정 명령 박제 / 체크리스트 링크 경로 / Python/Rust drift 경고 / 실측 사례 주장 정정
- **cross-validate 정상 경로 복구** — v2.30.0 (PR #185) 에서 Gemini capacity 소진 폴백 → 본 릴리스 (PR #191) 에서 정상 응답. [harness#189](https://github.com/coseo12/harness-setting/issues/189) reminder 이슈는 PR #185 대상이라 별도 재검증 대기
- **Reviewer SSoT `bg_process_handoff` 5번째 variance** — PR #191 에서 `{}` 반환. 누적 5회 (#167 누락 / #170 null / #178 누락 / #185 `{}` / #191 `{}`). [harness#184](https://github.com/coseo12/harness-setting/issues/184) (런타임 SSoT 검증) 긴급도 누적 임계 도달
- **오늘 2026-04-20 11번째 릴리스** — v2.24.0 → ... → v2.30.0 → v2.31.0. 본 릴리스로 볼트 캡처 6건 (#56~#61) + 신규 3건 (#62~#64) 중 8건 harness 반영 완료, 1건 (#64) harness#190 실행 이슈로 분리. 볼트-반영 왕복이 세션 내 완결된 최초 사례이자 volt #63 관찰의 원천


## [2.30.0] — 2026-04-20

[#185](https://github.com/coseo12/harness-setting/pull/185) — volt #59 #60 반영. cross-validate 가드 2차 방어선 + 다운스트림 실측 최종 가드 (MINOR).

### Behavior Changes

- **cross-validate "외부 툴 동작 주장 실측" 가드 Claude 자신에게도 적용 명시** — 기존 "Gemini 제안 시" 가드가 표제 재기술 (`(Claude 도입 / Gemini 제안 공통)`) 로 확장. Claude 가 새 외부 도구 flag 를 도입할 때도 동일 4단계 실측 요구. 근거: volt [#59](https://github.com/coseo12/volt/issues/59) — v2.28.2 pnpm `--if-present` 셀프 위반 실증
- **"같은 생태계 내 도구 간 flag 호환 가정 금지" 규약 추가** — npm/pnpm/yarn/bun 는 Node.js 생태계여도 CLI 독립 설계. flag 복사 금지 + 각 도구 개별 검증 필수. 그룹 B (호출 시점 가드) 로 체크리스트 2단계 편성
- **cross-validate 호출 프롬프트에 '신규 외부 도구 flag 실측 질문' 명시 삽입 의무** — "Gemini 의 침묵 = 안전 아님" 박제. 주장하지 않으면 가드 미발동 (volt #59 관찰). 질문 템플릿: "도입한 `<도구>` 의 flag / 각 flag 의 공식 문서 명시 여부 / 같은 생태계 내 다른 도구 flag 복사 여부". volt [#61](https://github.com/coseo12/volt/issues/61) (1회 관찰 후보 추적) 간접 반영
- **"다운스트림 실측이 최종 가드" 실전 교훈 신규 섹션** — upstream 3중 방어 (단위 테스트 + reviewer + cross-validate) blindspot 인정. upstream 사전 방어 3가지 (긴급 PATCH 파이프라인 템플릿 / 대표 다운스트림 튜플 규격화 / 회귀 가드 소급 승격). 5 적용 시나리오 (Rust crate / npm / Docker / DB migration / LLM 모델). 근거: volt [#60](https://github.com/coseo12/volt/issues/60) — v2.28.2 → astro-simulator#270 → v2.29.1 복구 체인

### Notes

- **cross-validate 폴백 박제 (volt #40 프로토콜)** — 본 PR #185 의 cross-validate 가 Gemini gemini-2.5-pro capacity 소진으로 2회 시도 모두 실패. outcome=`429-fallback-claude-only`. **claude-only analysis completed — 단일 모델 편향 노출 미확보**. 릴리스 후 reminder 이슈 수동 생성하여 API 복구 시 재검증 경로 확보 예정. CLAUDE.md 영구성 우선순위에 따라 본 CHANGELOG `### Notes` 에 1회 기록 (PR 코멘트/커밋/ADR 중복 기록 없음)
- **1회 관찰 박제 예외 적용**: volt #59 는 "가드 자기 위반" 으로 compile 규약 "3회 이상" 예외 (즉시 박제). volt #60 은 1회 관찰 + 5 적용 시나리오로 관찰 등가 증거력 확보. volt #61 은 CLAUDE.md 편향 5종 박제 보류 (1회 + 일반화 범위 미증명 → 추적 이슈로 누적 대기)
- **Reviewer 5 권고 전부 반영**: 6단계 → 2 그룹 (A: 사전 실측 / B: 호출 시점) 재구성 / "확장" → "직교 관계" 표현 완화 / 대표 다운스트림 튜플 규격화 / 표제 재기술 / 링크 일관성
- **Reviewer SSoT `bg_process_handoff` 4번째 variance 관찰** — 본 PR #185 에서 `{}` (빈 객체) 반환. 이전 3회 (#167 누락 / #170 null / #178 누락) 와 다른 4번째 형태. harness [#184](https://github.com/coseo12/harness-setting/issues/184) (sub-agent 반환 JSON 런타임 SSoT 검증) 우선순위 재확인 근거 축적
- **오늘 2026-04-20 9번째 MINOR 릴리스** — v2.24.0 부터 v2.30.0 까지. Phase 분리 리듬 유지, 각 릴리스 독립 관찰 가능


## [2.29.1] — 2026-04-20

[#181](https://github.com/coseo12/harness-setting/issues/181) — CI pnpm 경로 `--if-present` 인자 forwarding 버그 수정 (PATCH — bug fix).

### Behavior Changes

- **pnpm 프로젝트**: `pnpm test --if-present` 에서 `--if-present` 가 script args 로 forward 되던 버그 수정. 모노레포에서 `pnpm -r test --if-present` 형태가 되어 vitest/jest 등 런너에서 "Unknown option `--ifPresent`" 으로 실패하던 현상 해소. 이제 `pnpm run --if-present test` (pnpm 8+ 공식 지원) 로 pnpm 이 `--if-present` 를 자체 플래그로 인식
- **npm / yarn / lock 없는 프로젝트**: 영향 없음

### Fixed

- **`.github/workflows/ci.yml` `pnpm test` step** — `pnpm test --if-present` → `pnpm run --if-present test`. v2.28.2 (#176) 에서 pnpm 경로 도입 시 npm `--if-present` 패턴을 그대로 이식한 것이 원인. pnpm 은 npm 과 달리 `--if-present` 를 네이티브로 인식하지 않음

### Notes

- 다운스트림 관찰: [astro-simulator#270](https://github.com/coseo12/astro-simulator/pull/270) v2.28.2 적용 시 `detect-and-test` red. 본 릴리스 적용으로 green
- yarn 경로는 `yarn test` + `node -e` scripts.test 존재 체크로 우회 구현되어 있어 동일 버그 없음 (#178). npm 은 native `--if-present` 지원으로 정상
- 기술부채 관점: yarn 경로의 `node -e` 우회도 추후 `yarn run --if-present test` (yarn 1.x/2+ 모두 지원) 로 단순화 가능하나 본 PATCH 범위 외 — 동작은 정상이므로 후속 리팩토링 후보

## [2.29.0] — 2026-04-20

[#178](https://github.com/coseo12/harness-setting/pull/178) — CI `detect-and-test` 다언어 실 실행 복구 + Node.js yarn 지원 (MINOR).

### Behavior Changes

- **Python 실 실행 복구** — 기존 `echo "Python 프로젝트 감지됨"` → 실제 `pytest` 실행. 패키지 매니저 우선순위 자동 분기 (`uv.lock` > `poetry.lock` > `Pipfile.lock` > `requirements.txt` / `pyproject.toml` / `setup.py`). uv 는 공식 `astral-sh/setup-uv@v3` action 사용 (Gemini 보안 권고 반영). poetry/pipenv 경로는 pytest 감지 실패 시 명시 설치. `pytest` exit 5 (수집 0건) 는 경고로 처리. 근거: volt [#48](https://github.com/coseo12/volt/issues/48)
- **Go 실 실행 복구** — `actions/setup-go@v5` + `go test ./...`. `go.mod` 의 `go` 버전 사용. 근거: volt #48
- **Rust 실 실행 복구** — `actions-rust-lang/setup-rust-toolchain` + `cargo test --lib` (debug 빌드). 장기 테스트 이원화 (volt [#54](https://github.com/coseo12/volt/issues/54)) 는 다운스트림 옵션. 근거: volt #48
- **Node.js yarn 지원 추가** — `yarn.lock` 감지 시 실행. berry (`.yarnrc.yml` 존재) 와 classic 자동 분기:
  - berry: `yarn install --immutable` + `yarn test`
  - classic: `yarn install --frozen-lockfile` + `yarn test`
  - `corepack enable` 로 `packageManager` 필드 우선 존중
  - `scripts.test` 유무 체크 스크립트 삽입 (yarn 은 `--if-present` flag 없음)
- **run-tests 스킬 감지 테이블 확장** — Node.js 7 lock 우선순위 (pnpm / yarn berry / yarn classic / Bun / Deno / npm / npm fallback) + Python 6 도구 분기. 하이브리드 lock 혼재 시 상위 우선 + 경고 원칙 명시

### Notes

- **배타 조건 분기 전략 (volt #51 외부 툴 실측 가드 준수)** — setup-node@v4 `cache: 'yarn'` 은 `yarn.lock` 부재 시 실패. 단일화 대신 다중 step 유지 (volt [#51](https://github.com/coseo12/volt/issues/51) 케이스 A 재현 방지)
- **Gemini cross-validate 보안 고유 발견 수용** — uv 설치를 `curl \| sh` 패턴에서 공식 `astral-sh/setup-uv@v3` action 으로 전환. 공급망 공격 표면 축소 + 버전 고정 + 캐싱. Gemini 제안의 차선안 (checksum 검증) 보다 권장안 (공식 action) 채택 — 운영 오버헤드 낮음
- **Reviewer 권고 6건 전부 반영** — setup-python cache 지시어 제거 + python-version '3.x' fallback + poetry/pipenv pytest 명시 설치 + cargo --release 제거 + SKILL.md Bun/Deno drift 각주 + pip 경로 주석 보강. 권고 #7 closing keyword 는 연결 이슈 없어 N/A
- **Bun / Deno 의도적 drift** — SKILL.md 감지 테이블에는 포함 / CI 구현 미포함. 각주 ¹ 로 명시하고 향후 harness 추가 검토 (volt #49 주석-구현 drift 경계 준수 — drift 가 의도적임을 문서화)
- **dogfooding**: v2.28.1 에 도입한 `verify-release-version-bump.sh` 가 본 릴리스에서 정상 작동 — package.json 2.28.2 → 2.29.0 동시 bump 보증
- **Reviewer SSoT 2필드 3번째 누락 관찰** (PR #167 / #170 / #178) — compile 규약 "3회 이상 관찰 시 후속 분리" 발동 조건 달성. v2.29.0 릴리스 후 별도 후속 이슈로 분리 검토 예정
- **오늘 2026-04-20 8번째 릴리스** (v2.24.0 → v2.25.0 → v2.26.0 → v2.27.0 → v2.28.0 → v2.28.1 → v2.28.2 → v2.29.0). Phase 분리 리듬 유지, 각 릴리스 독립 관찰 가능


## [2.28.2] — 2026-04-20

[#175](https://github.com/coseo12/harness-setting/issues/175) — CI 템플릿 (`.github/workflows/ci.yml`) 의 `detect-and-test` job 에 pnpm 프로젝트 지원 추가 (PATCH — bug fix).

### Behavior Changes

- **pnpm 프로젝트**: 이전에 `sh: 1: pnpm: not found` 로 실패하던 `detect-and-test` 가 정상 동작. `pnpm/action-setup@v4` + `setup-node cache='pnpm'` + `pnpm install --frozen-lockfile` + `pnpm test --if-present` 경로 신규
- **npm 프로젝트**: 영향 없음. 기존 npm 경로에 `hashFiles('pnpm-lock.yaml') == ''` 배타 조건만 추가 (lock 파일 우선순위 명시)
- **lock 없는 Node 프로젝트**: 영향 없음

### Fixed

- **CI `detect-and-test` pnpm 지원** — `.github/workflows/ci.yml` 에 pnpm-lock.yaml 감지 분기 추가. 패키지 매니저 우선순위 명시: `pnpm-lock.yaml > package-lock.json > (lock 없음, npm fallback)`. pnpm 과 npm step 은 `hashFiles` 조건으로 **배타 실행** (lock 충돌 시 pnpm 우선)
- v2.15.0 (#153) 에서 `detect-and-test` 가 "감지만" 에서 "실제 실행" 으로 확장됐을 때 누락된 pnpm 경로 복구. 다운스트림 관찰: astro-simulator#270 에서 v2.15.0 → v2.28.1 업데이트 시 CI red

### Notes

- pnpm 버전은 `package.json::packageManager` 필드에서 자동 감지 (pnpm/action-setup@v4 기본 동작). `packageManager` 필드 부재 시 action 이 명시 에러 → 다운스트림에 명확한 시그널
- PATCH 분류 근거: 기존 npm 프로젝트 행동 불변 + pnpm 프로젝트는 "실패 → 복구" 범주 (다른 결과가 아닌 원래 의도대로 동작). `### Behavior Changes` 는 frozen 파일 변경 원칙(CLAUDE.md `### 릴리스`) 에 따라 명시

## [2.28.1] — 2026-04-20

v2.26.0 ~ v2.28.0 의 `package.json` `version` bump 누락 복구 + 회귀 가드 도입 (PATCH).

### Behavior Changes

None — metadata 전용 복구. `.claude/` / `CLAUDE.md` / 스킬·에이전트 **콘텐츠 변경 없음**. 에이전트 행동 불변.

### Fixed

- **`package.json::version` 을 `2.25.0` → `2.28.1`** — v2.26.0 / v2.27.0 / v2.28.0 의 chore release 3 PR 이 CHANGELOG 만 업데이트하고 `package.json::version` 을 bump 하지 않은 누락 복구. 다운스트림이 `harness update` 실행 시 `package.json::version` 기준으로 upstream 버전을 판정하는 경우 v2.25.0 에 고정돼 v2.26.0~v2.28.0 의 Behavior Changes 가 metadata 상으로는 "2.25.0" 으로 인식되던 불일치 해소. 실제 파일 해시는 최신이었으므로 다운스트림 콘텐츠 drift 는 없었음

### Added

- **`scripts/verify-release-version-bump.sh`** — CHANGELOG `## [X.Y.Z]` 최신 엔트리와 `package.json::version` 일치 여부 검증. 불일치 시 stderr 에 상세 불일치 보고 + exit 1. `.github/workflows/ci.yml` `detect-and-test` 에 통합되어 PR 머지 전 자동 차단. 본 릴리스 누락 사례 같은 drift 를 구조적으로 방지
- CI `detect-and-test` 에 "release version bump 가드" step 신규 추가 (기존 agent SSoT drift 가드와 동일 패턴)

### Notes

- 이번 누락의 직접 원인은 세션 3연속 릴리스 (v2.26.0/v2.27.0/v2.28.0) 에서 chore release PR 워크플로 체크리스트에 `package.json::version` bump 가 명시되지 않은 암묵적 관례. 과거 릴리스 (v2.22.1~v2.25.0) 에서는 실제로 bump 되었으나 절차 문서화 부재. 본 PATCH 의 `verify-release-version-bump.sh` 가드가 암묵 관례를 **구조적 검증** 으로 승격
- 본 PATCH 는 `### Behavior Changes: None` 이지만 `.claude/` frozen 파일은 **건드리지 않음** (`package.json` + `CHANGELOG.md` + `scripts/` + `.github/` 만 변경). 다운스트림 `harness update` 는 `package.json::version` 필드만 갱신 받고 에이전트·스킬 콘텐츠는 이미 v2.28.0 수준으로 최신 상태
- volt [#13](https://github.com/coseo12/couple-of-dots/issues/13) "커밋 성공 ≠ 의도한 변경 커밋됨" 의 릴리스 파이프라인 버전 — metadata 누락도 "조용한 실패" 의 한 형태. 향후 동일 패턴 방지 위해 CI 가드 도입

## [2.28.0] — 2026-04-20

[#170](https://github.com/coseo12/harness-setting/pull/170) — volt [#55](https://github.com/coseo12/volt/issues/55) "원칙 선언 직후 cross-validate — Claude 편향 4종 + ADR 재도입 트리거" 반영. 단일 이슈 4 서브항목 (MINOR).

### Behavior Changes

- **Claude 자체 편향 4종 셀프 체크리스트** — CLAUDE.md `## 교차검증` 에 추가. cross-validate 호출 **전** Claude 자신의 산출물을 ① 낙관적 일정 산정 ② 결합 관계 간과 ③ 폐기 프레이밍 선호 ④ 순수주의 원칙 적용 4축에 대조하는 루틴 추가. 각 편향의 징후·사전 감지 질문·보정 방향 매트릭스로 구조화. 미통과 축은 cross-validate 호출 프롬프트에 **명시 질문으로 삽입** 하여 Gemini 가 그 축에 집중하도록 유도
- **ADR `## 재도입 트리거` 섹션 신설 + 필수화** — record-adr 스킬 본문 템플릿에 신규 섹션. 상태별 3분기 운영: (1) Deprecated / Superseded / 폐기·보류 결정 → **필수** (2) 외부 조건부 경계 있는 Accepted (tier-A/B, 베타 범위 등) → **선택** (3) 외부 조건 없는 일반 Accepted → **작성 금지** (불필요 섹션 혼란 방지). 필수 내용: 재도입 검토 조건 (시간 함수 — 기술 성숙도 / 사용자 전환 / 외부 표준) + Graceful Degradation 경로 + 재도입 시 선행 작업. 금지 항목에 "폐기·보류 결정의 재도입 트리거 누락 금지" 추가
- **cross-validate reminder 이슈 앵커 3 → 4 확장** — 기존 3개 (CRITICAL 개정 / ADR 신규·개정·폐기 / MINOR 이상 Behavior Changes) 에 **"프로젝트 원칙·철학 선언"** 추가. scope creep 차단을 위해 3개 식별 질문 (모두 yes 여야 해당): (a) 프로젝트 전반 의사결정의 tie-breaker 역할 (b) "~First / ~Second" 우선순위 슬로건 형태 (c) 기존 ADR 재평가/소급 적용 필요. ADR 보다 추상도 높은 상위 원칙에서도 단일 모델 편향 고위험 노출
- **architect step 7 cross-validate 결과 편입 규약 4분류** — 기존 "박제" 만 요구하던 막연함을 4분류 (합의 / 이견 수용 / Claude 재분석 기각 / 고유 발견 후속 분리) + **Claude 편향 셀프 체크 통과 여부 1줄** 기록 의무로 고정. `### 교차검증 반영 사항` 서브섹션 이름 통일 (파일 내 3곳 drift 해소). CLAUDE.md `## 교차검증` 3단 프로토콜 ↔ architect step 7 4분류 양방향 참조 확보

### Notes

- **셀프 dogfooding 3중 중첩** — 본 PR 이 박제한 체계 3개 (편향 체크리스트 / 앵커 확장 / 결과 편입 4분류) 가 **모두 자기 자신에게 소급 적용**됨. cross-validate 호출 프롬프트에 `CROSS_VALIDATE_ANCHOR="MINOR-behavior-change+principle-declaration"` 로 신설 앵커 첫 시험. architect step 7 4분류를 PR 코멘트에 실시간 소급 기록. 편향 셀프 체크 소급 실행 (② 결합 관계 감지 → A/C 동일 섹션 2변경의 의미 독립성을 cross-validate 프롬프트에 명시 질문 삽입 → Gemini 합의 판정). volt [#42](https://github.com/coseo12/volt/issues/42) "박제 직후 cross-validate 셀프 적용" **8번째 연속 관찰** 갱신.
- **Gemini cross-validate 고유 발견 1건 수용** — record-adr SKILL.md 금지 조항의 "CLAUDE.md 참조 없이 의도 파악 불가" 문맥 의존성 지적을 합의 수용. 스킬 문서는 자기 완결적이어야 한다는 원칙에 부합. 커밋 `97230d8f` 로 "기술 성숙도 / 사용자 전환 / 외부 표준은 모두 시간 함수" / "LLM/인간 공통 폐기 프레이밍 선호 편향에 대한 구조적 가드" 문장 내 요약 추가. Gemini 오탐 0건 (PR [#167](https://github.com/coseo12/harness-setting/pull/167) JUnit 환각과 다른 정상 경로).
- **Reviewer 6 권고 대응**: 4건 반영 (#1 architect 섹션명 drift / #2 CLAUDE.md ↔ architect step 7 양방향 참조 / #3 앵커 4 식별 질문 3개 / #5 Accepted 분기 3분기) + 1건 기각 (#4 편향 표 확장 운영 규칙 — 명시 안 해도 기본값) + 1건 본 Notes 로 수용 (#6 셀프 dogfooding 박제).
- **Reviewer SSoT 값 타입 관찰** — Reviewer 가 `spawned_bg_pids: null` + `bg_process_handoff: null` 반환. CLAUDE.md 규약 "누락 field 는 `null` 또는 빈 배열/객체로 명시" 에 합치 (스키마 위반 아님). 다만 `.claude/agents/reviewer.md` 설명 불릿 기본값은 `[]` + `"none"`. PR [#167](https://github.com/coseo12/harness-setting/pull/167) 에서 관찰한 "필드 자체 누락" 과 다른 형태 — **같은 sub-agent 가 같은 체크리스트 필드를 매번 다른 방식으로 반환하는 variance** 관찰. 3회 이상 관찰되면 SSoT 강제 방법 (예: type-level JSON schema validation) 연구 후속 이슈 분리 검토.
- v2.26.0 → v2.27.0 → v2.28.0 **1시간 내 3연속 릴리스** — Phase 분리 리듬 (volt [#30](https://github.com/coseo12/volt/issues/30)) 유지. 각 릴리스는 독립 관찰 가능 (SSoT 2필드 / 측정법 4단계 / 편향 체크리스트+앵커 확장).

## [2.27.0] — 2026-04-20

[#167](https://github.com/coseo12/harness-setting/pull/167) — volt 이슈 2건 (#53 #54) 반영. 스프린트 계약 측정법 4단계 확장 + 장기 테스트 이원화 규범 (MINOR).

### Behavior Changes

- **측정법 검증 우선 원칙 4단계 확장** — 기존 3단계 ((0) 측정 방법 검증 → (1) 식/구현 수정 → (2) 알고리즘 교체) 에 **(3) 데이터 신뢰성 재확인** 추가. (0)~(2) "도구 측" (식·샘플링·적분기·알고리즘) 전수 수행 + 측정 도구가 synthetic/이상 fixture 에서 예상 동작 확인된 후에만 발동. fixture 출처 재확인 (발행 주체·epoch·좌표계·단위) → 이론 평형/경계값 독립 계산 → 데이터 이슈 판정 시 현 스프린트 범위 밖 후속 이슈로 분리 + 세 위치 박제. 의사결정 질문 2개 (도구 정상 확인 / fixture 신뢰성 확인). 범용 적용 대상: 물리 시뮬 / ML 평가 / 성능 벤치 / API 계약 테스트. 근거: volt [#53](https://github.com/coseo12/volt/issues/53) — astro-simulator P9 D5-b Laplace resonance 측정에서 `solar-system.json` Galilean 4체 `meanLongitudeDeg` JPL epoch 불일치가 초기 Laplace 인자 φ₀=218° (이론 평형 180° 대비 38° 벗어남 → circulation 영역) 원인이던 사례
- **장기 테스트 이원화 규범 추가** — `.claude/skills/run-tests/SKILL.md` 에 "장기 테스트 이원화 (volt #54)" 섹션 신규. 장기 적분 / E2E / 외부 리소스 / stress 테스트를 `#[ignore]` 류 어트리뷰트로 분리 + CI `test-fast` / `test-long-integration` 독립 job (`continue-on-error: true`) 구성. 언어별 마킹 매핑 (Rust `#[ignore = "..."]` / Jest·Vitest `*.slow.test.ts` suffix + config 분리 또는 `describe.skip` + `RUN_SLOW` env / pytest `@pytest.mark.slow` / Go `//go:build slow` / JUnit `@Tag("slow")`). GitHub Actions `actions/cache@v4` 는 동일 key 시 job 간 공유가 기본이므로 **명시적 접두사 분리 필수** (`cargo-fast-*` / `cargo-long-*`). 재발 감지 신호 4개 + 남용 경계 포함. 근거: volt [#54](https://github.com/coseo12/volt/issues/54) — astro-simulator P9 M4 에서 30분+ 교착 → 9.27s (200× 단축, 5분 목표 32× 여유)

### Notes

- **cross-validate dogfooding 실증** — PR [#167](https://github.com/coseo12/harness-setting/pull/167) 에서 Gemini 가 `.claude/skills/run-tests/SKILL.md` 의 JUnit 행이 `@scripts/setup-stage-labels.sh("slow")` 로 "잘못 기재됨" 이라고 주장. 실측 확인 결과 실제 파일은 `@Tag("slow")` 로 올바름 — **Gemini 환각 오탐**. v2.26.0 에서 박제한 [volt #51](https://github.com/coseo12/volt/issues/51) "외부 툴 동작 주장은 실측 필수" + "diff-only 리뷰 한계" 가드의 **첫 실측 성공 사례**. 맹목 수용 회피 + 실측 기각 근거 PR 코멘트 박제. 정상 경로 + 오탐 기각 사례 모두 포함.
- **Reviewer SSoT 2필드 누락 관찰** — Reviewer sub-agent 가 반환한 마무리 체크리스트 JSON 에 `spawned_bg_pids` / `bg_process_handoff` 2필드 생략. `.claude/agents/reviewer.md` 파일 자체에는 9필드 전부 기재되어 있고 SSoT 검증 스크립트 45/45 통과. sub-agent 가 system prompt 의 최신 업데이트를 안정적으로 반영하지 못한 구조적 한계 — v2.26.0 CLAUDE.md `### sub-agent 검증 완료 ≠ GitHub 박제 완료` 에서 "메인 오케스트레이터가 감점 처리" 로 규약한 패턴의 첫 실측 재현. 동일 패턴 3회 이상 관찰되면 SSoT 강제 방법 연구 후속 이슈로 분리 검토 (compile 규약 기준).
- **Reviewer 권고 3건 전부 반영** — (#1) Jest/Vitest `test.todo` 가 "구현 대기" 표식이라 "장기 테스트 분리" 의미와 부정합 → `*.slow.test.ts` suffix + config 분리 / `RUN_SLOW` env 분기로 수정 / (#2) GitHub Actions 캐시 동일 key 공유가 기본이라 "독립 캐시 키" 가 암묵적 주장 — yaml 예시에 `cargo-fast-*` / `cargo-long-*` 접두사 명시 + "기본 동작 아님 — 명시적 설정 필수" 문구 보강 / (#3) CLAUDE.md 항목 10 의 volt #32 + #53 근거를 한 줄 250+ 자 → 중첩 불릿 2개로 분리하여 가독성 개선.
- v2.26.0 이후 **1시간 내 연속 릴리스** — Phase 분리 릴리스 리듬 (volt [#30](https://github.com/coseo12/volt/issues/30)) 조건 (backward-compat + 완결 Behavior Change 집합 + 사용자 동의) 부합. v2.26.0 과 v2.27.0 은 서로 독립 관찰 가능 (측정법 확장은 스프린트 계약 독립 / 장기 테스트 분리는 run-tests 스킬 독립).

## [2.26.0] — 2026-04-20

[#164](https://github.com/coseo12/harness-setting/pull/164) — volt 이슈 8건 (#43 #45 #46 #47 #48 #49 #50 #51 #52) 반영. cross-validate 외부 툴 가드 + sub-agent SSoT 2필드 확장 + record-adr Concrete Prediction + run-tests Flaky 진단 루트 (MINOR).

### Behavior Changes

- **cross-validate 루틴에 외부 툴 동작 주장 실측 가드 추가** — Gemini 의 개선 제안이 외부 툴 / CI / 프레임워크 기본값의 세부 동작에 관한 주장일 때는 실측 없이 수용 금지. 4단계 검증 의무: (1) 공식 문서 확인 (2) CI / 샌드박스 실측 (3) revert 가능한 단위 커밋 (4) 오탐 근거 3곳(커밋 메시지 / 파일 주석 / CHANGELOG Notes) 박제. 검증 필수도 매트릭스 + diff-only 리뷰 한계 명시. CLAUDE.md `## 교차검증` 섹션에 반영. 근거: volt [#51](https://github.com/coseo12/volt/issues/51) — setup-node cache 자동 skip 주장 실측 반증 + 이미 존재하는 `body || ''` guard "추가하라" 오탐 2건 실증
- **sub-agent 공통 JSON 스키마 2필드 확장 (7 → 9)** — `spawned_bg_pids` (배열) + `bg_process_handoff` (`"main-cleanup"` / `"sub-agent-confirmed-done"` / `"none"`) 추가. sub-agent 가 `run_in_background=true` 로 띄운 dev 서버 / cargo test / 장시간 빌드 등의 정리 책임 인계를 구조화. 5개 에이전트 파일 (architect / developer / pm / qa / reviewer) 전부 동기화 + `scripts/verify-agent-ssot.sh` CORE_FIELDS 9필드 검증 (drift 시 exit 1). 근거: volt [#46](https://github.com/coseo12/volt/issues/46) / [#52](https://github.com/coseo12/volt/issues/52) — stale dev 서버 포트 점유 오진 + `cargo test` 좀비 4개 누적 관찰
- **record-adr 스킬에 Concrete Prediction 절차 추가** — ADR 결정을 구현할 때 "코드 변경 0 예측" 을 박제하면 기존 추상화의 건강성을 실증할 수 있다. ADR `## 결과·재검토 조건` 섹션에 `### Concrete Prediction` 서브섹션 박제 포맷 + 검증 방법(`git diff --stat`) + 실패 대응 분기 규약. NO-OP ADR 변형과 구분(산출물 유/무). 근거: volt [#47](https://github.com/coseo12/volt/issues/47) — astro-simulator P8 ADR "포보스/데이모스 JSON 추가 → sim-canvas 코드 변경 0 줄" 예측 박제 → PR-3 실측 재현 성공
- **run-tests 스킬에 Flaky 진단 루트 6단계 추가** — flaky 3회 재시도 후에도 실패 시 `concurrency=1` / CI retry / skip / low 방치 안티패턴으로 직행 금지. 6단계 진단 루트 (병렬 반복 + stderr 수집 → 영향받은 객체 특정 → 이름 패턴 분석 → 분기 결과 확인 → 주석 계약 대조 → 수정 + 회귀 가드) 실행. 수용 기준: 8회 이상 연속 병렬 0 실패 + 임시 조치 제거 상태 통과 + 실행 시간 회복. 근거: volt [#50](https://github.com/coseo12/volt/issues/50) — v2.24.0 → v2.25.0 에서 `--test-concurrency=1` 임시 조치로 6s → 18s 역행 후 stderr 의 `.claude/logs/` 단서로 categorize 주석-구현 drift 식별 → 1 라인 수정으로 7.5s 회복

### Added

- **CLAUDE.md 실전 교훈 3개 추가**:
  1. **"CI 통과 ≠ 테스트 실행"** — "언어 자동 감지" 범용 CI 템플릿이 `echo` 만 수행하는 no-op 함정. 진단 신호 3개 (실행 시간 / Actions 로그 / CI 구조) + 고의적 실패 PR 실측 루틴. 근거: volt [#48](https://github.com/coseo12/volt/issues/48)
  2. **"workflow_dispatch 2단계 함정"** — default branch 종속 + `can_approve_pull_request_reviews` 기본 OFF. 조치 명령 + workflow 파일 상단 주석 템플릿. 근거: volt [#45](https://github.com/coseo12/volt/issues/45) — astro-simulator bench workflow 2단계 실패 실증
  3. **"주석 계약 vs 구현 drift — 버그 생성원"** — 파일 상단 주석이 선언한 계약이 구현에 반영되지 않으면 default fallback 이 누락을 조용히 흡수. 카테고리/enum 류 분기 함수 특히 주의. 근거: volt [#49](https://github.com/coseo12/volt/issues/49)
- **CLAUDE.md "신규 데이터 ≠ 신규 코드" 블록** — "신규 함수 ≠ 신규 구현"의 데이터 버전. 레이어/플러그인/스키마 구조에서 확장이 코드 변경 0 으로 가능한지 예측 + `git diff --stat` 실측. 스킬 절차는 record-adr SKILL.md 로 포인터 분리
- **`docs/architecture/state-atomicity-3-layer-defense.md` §6** — "해석자가 자동화 주체일 때 — 4번째 자동 매핑 층" 추가. cross-validate 폴백 프로토콜 완성 여정 (v2.18.0 선언 → v2.19.0 자동 매핑) 을 일반 설계 지식으로 승격. "해석자가 누구인가" 설계 체크리스트. 근거: volt [#43](https://github.com/coseo12/volt/issues/43)

### Notes

- cross-validate 셀프 적용 **6번째 연속 정상 경로 성공** (volt [#42](https://github.com/coseo12/volt/issues/42) 패턴 확장) — PR #164 박제 직후 Gemini Approve / 이견 0 / 고유 발견 0. outcome=`applied` (exit 0), reminder 이슈 발동 조건 소멸, 폴백 프로토콜 기록 의무 해당 없음.
- Reviewer 7 non-blocking 권고 중 **2건 반영** (#2 포인터 포맷 분리 / #4 NO-OP 차이 섹션 위치 통합) + **2건 기각** (#1 bg_process_handoff 예시 비대칭은 의도적 차별화 / #3 gh api 명령 2회는 역할이 달라 SSoT 불필요). 기각 근거는 PR 코멘트에 박제.
- 스킵한 volt 이슈: [#42](https://github.com/coseo12/volt/issues/42) (정상 경로 관찰 — 기존 루틴 validation 이지 새 규칙 아님) / [#44](https://github.com/coseo12/volt/issues/44) (5단계 루프 — 각 단계가 이미 조각으로 박제됨).
- `.gitignore` 에 `.claude/scheduled_tasks.lock` + `.claude/scheduled_tasks/` 추가 — ScheduleWakeup 상태 파일이 실수로 tracked 되는 경로 회귀 가드.

## [2.25.0] — 2026-04-20

[#157](https://github.com/coseo12/harness-setting/issues/157) — `.claude/logs/` 가 `atomic` 으로 오분류되던 버그 수정 + 테스트 병렬 실행 복구 (MINOR).

### Behavior Changes

- **`.claude/logs/` 경로는 이제 `user-only` 카테고리** — 기존에는 `categorize()` 의 기본 fallback 에 걸려 `atomic` 으로 분류되었고, `walkTracked(PKG_ROOT)` 가 모든 로그 파일을 tracked 집합에 포함시켜 `harness update --apply-all-safe` 가 이들을 복사 대상으로 삼았다. 이번 릴리스부터 `.claude/logs/**` 는 tracked 에서 제외되어 사용자 cwd 에 영향 없음. `lib/categorize.js` 상단 주석의 "user-only: state, **logs**, 사용자 추가 파일" 계약이 코드에 반영됨.
- **다운스트림 매니페스트 영향**: 기존에 `.harness/manifest.json` 에 `.claude/logs/*` 엔트리가 기록돼 있었다면, `harness update` 재실행 시 해당 엔트리가 `removed-upstream` 으로 분류되어 정리됨. 로그 파일 자체는 `user-only` 이므로 사용자 cwd 에서 삭제되지 않고 그대로 보존.
- **`package.json::scripts.test` 가 병렬 실행으로 복구** — v2.24.0 에서 임시로 `--test-concurrency=1` 로 변경했던 조치를 되돌림. 근본 원인이 해소되어 병렬 실행이 안정적으로 동작. CI 실행 시간 18s → ~7.5s (약 60% 단축).

### Fixed

- **테스트 병렬 실행 flaky 완전 해소** — `test/previous-sha256.test.js` / `test/update-verification.test.js` 의 `post-apply 검증: 정상 apply 시 ok=true` 가 병렬 실행 시 약 75% 빈도로 실패하던 증상. 원인은 `.claude/logs/cross-validate-*.log` 338개 파일 (실측 당시 누적분) 이 매 `update()` 호출마다 copy 대상으로 포함되어 I/O 경쟁 + 해시 재계산 timing 불일치로 `rolledBack` 배열에 들어간 것. 실패 시 stderr 로그에서 rolledBack 대상이 `.claude/logs/cross-validate-structure-20260420-141012.log` 같은 로그 파일로 특정되어 진단 가능했음.
- 8회 연속 병렬 실행 실패 0건 실측 확인.

### Notes

- `lib/categorize.js` 의 머리 주석이 이미 "user-only: init 후엔 harness가 손대지 않음 (state, logs, 사용자 추가 파일)" 계약을 선언하고 있었으나, 구현에 `.claude/logs/` 규칙이 **누락**되어 주석과 코드가 어긋나 있던 것. 이 차이가 `#157` flaky 의 직접 원인이었고, `#153` 이 임시 조치한 `--test-concurrency=1` 이 `#157` 을 우회한 형태.
- 진단 루트: `node --test` 기본 병렬로 반복 실행 → stderr 의 `harness update: post-apply 검증 실패 N건 — <파일 목록>` 출력에서 `.claude/logs/cross-validate-*.log` 식별 → `categorize('.claude/logs/...')` 가 `atomic` 반환 확인 → 주석 대조 후 누락 규칙 추가.

## [2.24.0] — 2026-04-20

[#153](https://github.com/coseo12/harness-setting/issues/153) — CI `detect-and-test` 의 Node.js `npm test` 실 실행 복구 (MINOR).

### Behavior Changes

- **CI `detect-and-test` 의 Node.js 브랜치가 실제 테스트를 실행** — 기존에는 `echo` 로 감지만 수행하여 모든 PR 이 CI 에서 테스트되지 않은 상태로 머지됐다. 이제 `actions/setup-node@v4` (node-version-file: `package.json` 의 `engines.node` 참조) + `npm ci` (lockfile 있을 때) 또는 `npm install --no-audit --no-fund --ignore-scripts` (없을 때 fallback) + `npm test --if-present` 실행. 로컬 통과와 CI 통과가 일치해야 PR 머지 가능 — 새 회귀 차단 게이트.
- **harness 템플릿 호환성 유지**: `hashFiles('package.json')` / `hashFiles('package-lock.json')` 조건 게이트로 Node 프로젝트가 아닌 다운스트림은 step 전체 skip. `npm test --if-present` 는 `scripts.test` 미정의 프로젝트도 조용히 skip.

### Fixed

- 세션 전체 PR (`#144` / `#147` / `#150` / `#154`) 이 CI 에서 `npm test` 가 돌지 않은 채 머지됐던 구조적 결함 해소. 이번 PR 이후 머지되는 PR 부터 실 테스트가 회귀 게이트로 동작.

### Notes

- 이 저장소 자체는 의존성 0개 (`dependencies` / `devDependencies` 섹션 없음) + `package-lock.json` 부재. `npm install fallback` 분기를 통해 lock 없이도 테스트 실행.
- Node version 은 `package.json::engines.node` (`>=16.7.0`) 의 semver range 를 `setup-node@v4` 가 해석.
- **`scripts.test` 를 `--test-concurrency=1` 로 변경** — 착수 중 `test/previous-sha256.test.js:140` / `test/update-verification.test.js:172` 의 `post-apply 검증: 정상 apply 시 ok=true` 테스트가 병렬 실행 시 간헐 실패하는 flaky 확인. CI 안정성을 위해 순차 실행으로 임시 조치. 실행 시간 6s → 18s. 근본 원인 분석 + 병렬 복구는 후속 이슈 [#157](https://github.com/coseo12/harness-setting/issues/157) (low).

## [2.23.0] — 2026-04-20

[#145](https://github.com/coseo12/harness-setting/issues/145) — 공통 JSON 스키마 (SSoT) drift 자동 가드 도입 (MINOR).

### Behavior Changes

- **`scripts/verify-agent-ssot.sh` 신규 검증 스크립트** — CLAUDE.md `### sub-agent 검증 완료 ≠ GitHub 박제 완료` 의 공통 코어 필드 7개 (`commit_sha` / `pr_url` / `pr_comment_url` / `labels_applied_or_transitioned` / `auto_close_issue_states` / `blocking_issues` / `non_blocking_suggestions`) 가 5개 에이전트 파일 (architect / developer / pm / qa / reviewer) 의 `## 마무리 체크리스트 JSON 반환` 섹션에 모두 존재하고 선언 순서를 유지하는지 검증. drift 시 누락 파일/필드/순서 이탈 지점을 stderr 에 보고하고 exit 1.
- **CI `detect-and-test` 에 drift 가드 step 추가** — `.github/workflows/ci.yml` 이 `hashFiles('scripts/verify-agent-ssot.sh')` 조건으로 본 스크립트를 실행. PR 머지 전 자동 차단 게이트.
- **PR 템플릿 체크박스 추가** — SSoT 코어 필드 수정 PR 시 5개 에이전트 파일 동기화 + 로컬 `verify-agent-ssot.sh` pass 확인 명시.
- **CLAUDE.md SSoT 블록에 자동 가드 안내 1줄 박제** — 이 블록 수정 시 5개 에이전트 파일 동기화 의무 + 스크립트 경로 참조.

### Added

- **`test/agent-ssot-drift.test.js`** (node:test, 4 케이스, 총 52 → 56 tests):
  1. 정상 상태 5 files × 7 fields = 35 checks pass
  2. 필드 제거 → exit 1 + 누락 필드 이름 보고
  3. 필드 순서 이탈 → exit 1 + 순서 키워드 보고
  4. 에이전트 파일 누락 → exit 1 + 파일 없음 메시지

### Notes

- 착수 중 **CI `detect-and-test` 잡의 Node.js 브랜치가 실측 no-op** (범용 언어 detect 템플릿으로 `echo` 만 수행, `npm test` 미실행) 임을 발견. 본 릴리스에서 `scripts/verify-agent-ssot.sh` 전용 step 은 추가했으나 `npm test` 자체 복구는 **후속 이슈 [#153](https://github.com/coseo12/harness-setting/issues/153) 으로 분리** (medium 우선순위).

## [2.22.1] — 2026-04-20

[#146](https://github.com/coseo12/harness-setting/issues/146) — 죽은 workflow `.github/workflows/agent-dispatch.yml` 제거 (PATCH).

### Behavior Changes

None — 실행 no-op 상태의 죽은 코드 삭제. 에이전트 행동 불변.

### Removed

- **`.github/workflows/agent-dispatch.yml`** — 실측 결과 완전한 죽은 코드로 판정하여 삭제:
  - 매핑된 7개 `status:*` 라벨 (`status:todo` / `status:audit-passed` / `status:qa` / `status:qa-passed` / `status:stalled` / `status:agent-failed` + 이전에 있던 `status:review`) 전부 저장소에 부재. v2.22.0 에서 `status:review` 라벨 삭제로 마지막 연결도 끊김.
  - 참조 스크립트 `dispatch-agent.sh` / `orchestrator.sh` 미존재. self-hosted runner 도 없음.
  - 매핑된 에이전트 이름 (`auditor`, `integrator`) 은 현행 페르소나 세트 (architect/developer/pm/qa/reviewer) 와 불일치 — 구버전 잔재.
  - 실행 로그 실측: 라벨 트리거 시 `DISPATCH_MAP[label] = undefined` → 코멘트 없음 → 실질 무동작.
  - git history 에 보존되므로 향후 이벤트 기반 자동 dispatch 재도입 시 복구 가능.

### Notes

- 구 참조 문서 (`docs/OPS-REVIEW-REPORT.md` / `docs/report-final-audit.md` / `docs/report-renewal-retrospective.md`) 는 이력 기록용이므로 수정하지 않음.
- 현 아키텍처는 `/next`, `/architect`, `/qa` 등 수동 슬래시 커맨드로 에이전트를 호출. 이벤트 기반 자동 dispatch 는 현재 운영 모델과 맞지 않음.

## [2.22.0] — 2026-04-20

[#127](https://github.com/coseo12/harness-setting/issues/127) Plan 1 — 라벨 네이밍 `stage:*` / `status:*` 혼재 정리 (MINOR). 추가로 [#141](https://github.com/coseo12/harness-setting/issues/141) cross-validate 파싱 jq 전환 NO-OP ADR 박제.

### Behavior Changes

- **`.github/workflows/pr-review.yml` 라벨 체계 일원화** — PR 이 열리면 기존 `status:review` 대신 **`stage:review`** 부착. 연관 이슈에 대해서도 `status:in-progress` 제거 → `stage:dev` 제거 + `stage:review` 부착으로 전환. 에이전트 파일 (architect/developer/pm/qa/reviewer) + `scripts/setup-stage-labels.sh` 가 이미 `stage:*` 일관 사용 중이었고, workflow 만 구 체계에 머물러 있던 혼재를 해소.
- 저장소 라벨 `status:review` 는 release 머지 후 삭제 예정 (구 workflow 가 main 에 반영되기 전까지 `status:review` 자동 부착 지속). 에이전트 실 사용 라벨 세트 = `stage:*` 6개 (planning / design / dev / review / qa / done) 로 일원화.

### Added

- **ADR `20260420-jq-based-parsing-no-op.md`** ([#141](https://github.com/coseo12/harness-setting/issues/141)) — `parse-cross-validate-outcome.sh` 의 jq 기반 전환을 **기각** 한 NO-OP 결정 박제. 후보 비교 (jq+fallback / jq 필수 / NO-OP) + 알려진 한계 (parse 정규식의 `\"` 해석 실패, 실 사용 필드 값이 enum/경로/번호라 raw `"` 구조적 제외) + 재검토 트리거 6개.
- **경계 가드 테스트** (`test/parse-cross-validate-outcome-boundary.test.js`) — write/parse round-trip 을 `\` / tab / newline / CR 4종 + 혼합 `JSON.parse` 검증으로 지속 관측 (테스트 47 → 52).

### Notes

- #127 A (SSoT 중복 해소) 와 B-extended (`agent-dispatch.yml` 의 `status:*` 7개 라벨 분석) 는 본 PR 범위 밖 — 후속 이슈로 분리.

## [2.21.0] — 2026-04-19

[#131](https://github.com/coseo12/harness-setting/issues/131) Phase B — 잔존 권고 2건 (4, 7) + reviewer/qa non-blocking 2건. `cross_validate.sh` probe 옵트아웃 / sleep cap 상한 / 공통 파싱 헬퍼 + fatal stdout 헤더 규약 박제.

### Added

- **`SKIP_CAPACITY_PROBE` 환경변수** (권고 4) — 활성 시 capacity probe (`gemini -p "hello"`) 호출 생략, sleep 후 바로 재시도. probe 자체 free-tier quota 소모 회피. 기본값 `0` (현행 동작 유지).
- **`GEMINI_RETRY_SLEEP_CAP` 환경변수** (reviewer non-blocking) — sleep 상한 (기본 300s). 공식 `MIN(cap, 2^attempt × BASE)` — `MAX_GEMINI_RETRIES` 증설 시 sleep 폭증 방지.
- **`scripts/parse-cross-validate-outcome.sh` 공통 헬퍼** (권고 7) — outcome JSON 파싱 SSoT. 사용 경로:
  - 직접 지정: `eval "$(./scripts/parse-cross-validate-outcome.sh /path/to/outcome.json)"`
  - stdout 자동 추출: `eval "$(... | ./scripts/parse-cross-validate-outcome.sh --from-stdout)"`
  - 출력 변수: `CROSS_VALIDATE_OUTCOME` / `CROSS_VALIDATE_EXIT_CODE` / `CROSS_VALIDATE_REMINDER` / `CROSS_VALIDATE_LOG_FILE` / `CROSS_VALIDATE_ANCHOR`
  - 예외 분기: 파일 없음 → `"missing"`, 필수 필드 부재 → `"parse-error"`
- **fatal 경로 stdout 헤더 규약 명시** (qa non-blocking) — `cross_validate.sh` 코드 주석 + `CLAUDE.md ## 교차검증` 에 박제: fatal (exit 1) 도 `[claude-only-fallback]` 헤더를 공유하므로 **fatal vs 429 정확 구분은 outcome JSON 의 `outcome` 필드** (또는 헬퍼) 참조 필수.
- **스모크 테스트 +9** (`test/cross-validate-fallback.test.js`, 총 47 tests — 기존 38 + 신규 9):
  1. `SKIP_CAPACITY_PROBE=1` 시 mock 호출 횟수 2회 (기본 3회) — `429-counted` stateful mock
  2. `SKIP_CAPACITY_PROBE=0` 기본값 — probe 활성 시 mock 호출 3회
  3. `GEMINI_RETRY_SLEEP_CAP` 로그 검증 (raw=200s → cap=1s)
  4-8. 헬퍼 단위 테스트: 직접 경로 / 429 outcome / 파일 없음 / `--from-stdout` 추출 / 프리픽스 부재
  9. 헬퍼 + `cross_validate.sh` 실제 파이프 통합 테스트 (정상 경로)

### Behavior Changes

- **`architect.md` step 8 — outcome 파싱을 공통 헬퍼 호출로 단순화** — 기존 인라인 `grep`/`sed` bash 스니펫이 `eval "$(... | parse-cross-validate-outcome.sh --from-stdout)"` 한 줄로 축약. 에이전트가 설정하는 변수명도 `OUTCOME` / `REMINDER` 등 충돌 위험 있는 짧은 이름 → `CROSS_VALIDATE_OUTCOME` 등 네임스페이스화
- **`cross_validate.sh` sleep 공식에 상한 cap 추가** — 기존 `sleep $(( (1 << attempt) * BASE ))` → `sleep $(( MIN(GEMINI_RETRY_SLEEP_CAP, (1 << attempt) * BASE) ))`. 기본값 `CAP=300s` 이므로 `MAX_GEMINI_RETRIES=2` 현행에선 동작 변화 없음. 미래 `MAX_RETRIES` 증설 시 자동 보호
- **`cross_validate.sh` capacity probe 경로 분기 추가** — `SKIP_CAPACITY_PROBE=1` 설정 시 probe 블록 자체를 스킵하고 재시도 직행. 기본 동작은 변화 없음

### Notes

- **`Builds on:` [#137](https://github.com/coseo12/harness-setting/pull/137)** (v2.20.0 Phase A)
- **#131 완전 해소 후보**: Phase A + Phase B 로 모든 reviewer 권고 5건 + non-blocking 2건 반영. 이슈 close 여부는 릴리스 시점에 판단
- **cross-validate 수행 예정**: Behavior Changes 3개 = MINOR 노출 효율 최대 앵커. 박제 직후 1회 호출 루틴

## [2.20.0] — 2026-04-19

[#131](https://github.com/coseo12/harness-setting/issues/131) Phase A — reviewer 권고 5건 중 4건 반영 (1, 2, 3, 6). `cross_validate.sh` stdout 대칭성 / capacity 반환 코드 분리 / exponential backoff / 복구 분기 stateful 테스트.

### Added

- **stdout `[claude-only-fallback]` 헤더** (권고 1) — fallback 경로에서도 stdout 에 한 줄 헤더 출력. 호출 측이 stderr 추적 없이 stdout 만으로도 fallback 모드 감지 가능.
- **`check_gemini_capacity` exit code 3값 분리** (권고 2) — `CAPACITY_OK=0` / `CAPACITY_EXHAUSTED=2` / `CAPACITY_OTHER_ERROR=1`. 호출 측은 429 지속과 비-capacity probe 실패를 구분해 로그와 재시도 판단 가능.
- **지수 backoff 공식** (권고 3) — `sleep $(( (1 << attempt) * GEMINI_RETRY_SLEEP_SECONDS ))`. `MAX_GEMINI_RETRIES` 가 늘어나도 지수 증가 유지 (attempt=1 → 2×BASE, attempt=2 → 4×BASE). 이전 공식: `attempt × BASE` (linear).
- **스모크 테스트 +2** (`test/cross-validate-fallback.test.js`, 총 38 tests — 기존 36 + 신규 2) — 권고 6 대응:
  1. `recover-after-1` stateful mock — 1차 429 → 2차 정상 복구 분기 (counter 파일 기반)
  2. stdout `[claude-only-fallback]` 헤더 검증 (권고 1 대응 테스트)

### Behavior Changes

- **fallback 경로 stdout 출력 형식 변경** — 기존 stderr 만 있던 fallback signal 이 stdout 에도 `[claude-only-fallback]` 헤더로 복제됨. 호출 측이 stdout 파싱으로 fallback 모드 판정 가능. 정상 경로 stdout (Gemini 응답 본문) 과는 프리픽스로 구분.
- **재시도 전 sleep 시간이 2배 증가** (MAX_RETRIES=2 기준) — 1차 재시도 이전 sleep 이 `5초` (linear) 에서 `10초` (exponential, BASE=5) 로 변경. 429 조기 재시도 완화 + 향후 `MAX_GEMINI_RETRIES` 증설 시 지수 백오프 자연 작동.
- **`check_gemini_capacity` 반환 코드 분리** — 이전 단일 `return 1` → `0 / 1 / 2` 로 3값 분기. 호출 측 (현재는 `run_gemini` 의 capacity 복구 감지 로직) 이 case 문으로 상태별 로그 기록.

### Notes

- **`Builds on:` [#134](https://github.com/coseo12/harness-setting/pull/134)** (v2.19.0 Phase 3).
- **#131 잔존 권고 2건**: 4 (capacity probe 의 quota 소모 위험, medium) + 7 (Phase 4 outcome 파싱 공통 스니펫화, medium) 는 Phase B 로 분리 — 실사용 패턴 축적 후 재검토.
- **cross-validate 수행 예정**: Behavior Changes 3개 = MINOR 노출 효율 최대 앵커. 박제 직후 1회 호출 루틴.

## [2.19.0] — 2026-04-19

[#131](https://github.com/coseo12/harness-setting/issues/131) Phase 3 — v2.18.0 Phase 2 의 **수동 연결점 해소**. `cross_validate.sh` 가 outcome JSON 파일을 생성하고 architect 가 이를 bash 스니펫으로 자동 파싱. 3층 방어 (선언 + 프롬프트 + 스크립트) 간 연결이 구조적으로 강제됨.

### Added

- **`cross_validate.sh` outcome JSON 파일 출력** — 종료 시 `${LOG_DIR}/cross-validate-<type>-<timestamp>-outcome.json` 생성. 필드:
  - `outcome`: `"applied"` (exit 0) / `"429-fallback-claude-only"` (exit 77) / `"fatal-error"` (exit 1)
  - `exit_code`, `anchor`, `pr_ref`, `context`, `log_file`, `reminder_issue`, `timestamp`
  - `json_escape()` 헬퍼 함수 — 환경변수 인젝션 방지 (`\`, `"`, 제어문자 이스케이프)
- **`.claude/agents/architect.md` step 8 자동 매핑 규약** — 기존 "429 fallback 분기" 수동 규칙을 **bash 스니펫 기반 자동 매핑** 으로 재작성. `OUTCOME=$(grep -o '"outcome": *"[^"]*"' ...)` 예시 명시. outcome 3값 각각에 대한 후속 박제 규칙 (`applied` / `429-fallback-claude-only` / `fatal-error` / `skipped`).
- **스모크 테스트 +3** (`test/cross-validate-fallback.test.js`):
  1. 429 → outcome JSON 에 `"429-fallback-claude-only"` + `reminder_issue: "dryrun"` 기록
  2. 정상 → outcome JSON 에 `"applied"` + `reminder_issue: "none"`
  3. fatal → outcome JSON 에 `"fatal-error"` + `reminder_issue: "none"`
- **CLAUDE.md `## 교차검증` 섹션에 outcome JSON 자동 매핑 1줄** — Phase 3 의 SSoT 박제 (outcome 값 / 파일 경로 / architect 연동 명시).

### Behavior Changes

- **cross_validate.sh 종료 시 outcome JSON 파일 자동 생성** (이전: 로그 파일만). 호출 측(architect / 기타 에이전트 / CI 파이프라인)이 exit code 확인 + 구조화된 메타데이터 읽기 가능
- **architect 에이전트 step 8 이 outcome JSON 을 읽어 `extends.cross_validate_outcome` 자동 매핑** (이전: 에이전트가 자체 판단으로 outcome 값 생성). 수동 판단 → 구조적 강제로 전환, Phase 2 의 "마지막 수동 연결점" 제거
- **outcome JSON 의 `reminder_issue` 필드로 dry-run/created 상태 관측 가능** (이전: stderr 로그만). CI 레벨 파이프라인이 JSON 파싱만으로 reminder 이슈 박제 상태 감지 가능

### Notes

- **`Builds on:` [#130](https://github.com/coseo12/harness-setting/pull/130)** (v2.18.0 Phase 2) — 스크립트 레벨 강제를 outcome JSON 으로 마감.
- **#131 에서 Phase 3 (5번 항목) 만 해소**: 나머지 5개 권고 (stdout contract / capacity 로그 / exponential / probe quota / Stateful mock) 는 이슈 OPEN 유지, 별도 PR 로 순차 진행.
- **Phase 3 완료로 3층 방어 수동 연결점 제거**: v2.16.0 (CLAUDE.md 선언) → v2.17.0 (5개 에이전트 프롬프트) → v2.18.0 (cross_validate.sh 구현) → **v2.19.0 (architect 자동 매핑)**. 이제 정상 실행 경로에서 architect 가 outcome 을 수동 판정할 필요 없이 파일 읽기만으로 완결.
- **cross-validate 수행 예정**: MINOR Behavior Changes 3개 = 노출 효율 최대 앵커. 박제 직후 1회 호출. Phase 3 자체가 outcome JSON 을 생성하므로 이 호출이 **Phase 3 의 실 자기 적용** (더 깊은 셀프 적용 — 스크립트가 자신의 outcome 을 스스로 JSON 으로 기록).

## [2.18.0] — 2026-04-19

[#119](https://github.com/coseo12/harness-setting/issues/119) Phase 2 — v2.17.0 Phase 1 (에이전트 프롬프트 하드코딩) 에 이어 **스크립트 레벨 강제** 완성. `cross_validate.sh` 에 CLAUDE.md `## 교차검증` API capacity 폴백 프로토콜 3단계 하드코딩 + reminder 이슈 dry-run + 스모크 테스트.

### Added

- **`.claude/skills/cross-validate/scripts/cross_validate.sh` 폴백 프로토콜 하드코딩**:
  - `check_gemini_capacity()` 함수 — `gemini -p "hello"` 로 capacity 응답성 확인 (폴백 프로토콜 단계 1)
  - `run_gemini()` 재시도 루프에 capacity 체크 통합 — 1차 429 후 sleep + capacity 체크 + 2차 재시도
  - 최종 실패 시 **stderr 에 `claude-only analysis completed — 단일 모델 편향 노출 미확보` 프리픽스** 출력 + **exit code 77 (EXIT_CLAUDE_ONLY_FALLBACK)** 반환 (폴백 단계 2)
  - `create_reminder_issue()` 함수 — `CROSS_VALIDATE_ANCHOR` 환경변수 설정 시 reminder 이슈 생성 (기본 dry-run, `REMINDER_ISSUE_DRYRUN=0` 으로 실제 생성) (폴백 단계 3)
  - Exit code 규약 섹션 추가 — 0 (정상) / 77 (claude-only fallback) / 1 (fatal 오류)
- **`test/cross-validate-fallback.test.js` 스모크 테스트 신규** — mock gemini 바이너리 (`429` / `ok` / `fatal` 모드) 로 5개 분기 검증:
  1. 429 응답 → exit 77 + claude-only 프리픽스
  2. `CROSS_VALIDATE_ANCHOR` 설정 시 reminder dry-run 출력
  3. 앵커 미설정 시 dry-run 생략
  4. 정상 응답 → exit 0 + 프리픽스 없음
  5. 비-capacity fatal 오류 → exit 1
- **CLAUDE.md `## 교차검증` 에 스크립트 레벨 강제 1줄 추가** — cross_validate.sh 하드코딩 박제 + 스모크 테스트 경로 명시 + `CROSS_VALIDATE_ANCHOR` / `REMINDER_ISSUE_DRYRUN` 환경변수 규약.

### Behavior Changes

- **cross_validate.sh 종료 코드 차별화** (이전: 실패 시 전부 일반 종료) — 정상 0 / claude-only fallback 77 / fatal 1. 호출 측(에이전트/hooks)이 77 을 감지해 "선언만 상태" 를 프로그램적으로 분기 가능
- **429 최종 실패 시 stderr 에 `claude-only analysis completed` 프리픽스 출력** (이전: "교차검증 스킵. Claude 단독 분석으로 전환" 메시지만). 메인 오케스트레이터가 stderr grep 으로 폴백 감지 가능
- **`CROSS_VALIDATE_ANCHOR` 환경변수 설정 시 fallback 경로에서 reminder 이슈 박제 (기본 dry-run)** (이전: reminder 이슈 로직 없음). 노출 효율 최대 앵커에서 cross-validate 포기 시 자동 재시도 큐잉 가능
- **스모크 테스트가 프롬프트 레벨 규약 회귀 방지 가드** — `npm test` 에 `test/cross-validate-fallback.test.js` 포함되어 향후 스크립트 수정 시 폴백 프로토콜 준수 자동 검증 (총 테스트 28 → 33)

### Notes

- **`Builds on:` [#126](https://github.com/coseo12/harness-setting/pull/126)** (v2.17.0 Phase 1) — 프롬프트 레벨 + 스크립트 레벨 양쪽 강제로 "wishful documentation" 완전 해소.
- **#119 이슈 close 예정** — Phase 1 (#126) + Phase 2 (이 PR) 로 완료 기준 1/2/3/4/5/6/7 모두 충족. release PR 머지 시 `Closes #119` 트리거.
- **Gemini cross-validate 수행 예정**: 본 릴리스도 MINOR Behavior Changes 4개 + 스크립트 레벨 강제 = 노출 효율 최대 앵커. 박제 직후 1회 호출. 429 발생 시 방금 박제된 폴백 프로토콜의 **본격 자기 적용** (v2.17.0 PR #126 보다 한 단계 더 깊은 셀프 적용).
- **자동 파서 회귀 가드**: v2.17.0 Notes 에서 "향후 CI 레벨 파이프라인 자동화 도입 시 `extends` 중첩 파싱 고려" 를 명시했으나, Phase 2 에서 스모크 테스트가 JSON 구조 자체는 검증하지 않고 exit code / stderr 규약만 검증. `extends` 구조 회귀 가드는 별도 이슈 후보.

## [2.17.0] — 2026-04-19

[#119](https://github.com/coseo12/harness-setting/issues/119) Phase 1 — sub-agent 공통 JSON 스키마 SSoT 박제 + 5개 페르소나 (developer / qa / reviewer / architect / pm) 마무리 체크리스트 하드코딩. v2.16.0 에서 박제된 CLAUDE.md 선언적 규칙을 프롬프트 레벨로 강제. Phase 2 (cross_validate.sh 폴백 보강 + 스모크 테스트) 는 별도 릴리스.

### Added

- **CLAUDE.md `### sub-agent 검증 완료 ≠ GitHub 박제 완료` 에 공통 JSON 스키마 SSoT 섹션** — 모든 외부 가시성 박제 에이전트가 반환할 **코어 필드** 정의 (commit_sha / pr_url / pr_comment_url / labels_applied_or_transitioned / auto_close_issue_states / blocking_issues / non_blocking_suggestions). 에이전트별 특수 필드는 `extends` 로 덧붙이는 구조.
- **`.claude/agents/developer.md` 마무리 JSON 재구조화** — 기존 JSON (`commit_sha` / `pr_url` / `branch` / `files_changed` / `tests` / `browser_verified_levels` / `remaining_todos`) 을 **공통 코어 + developer extends** 로 분리. 공통 필드 7개 추가 (`pr_comment_url` / `labels_applied_or_transitioned` / `auto_close_issue_states` / `blocking_issues` / `non_blocking_suggestions`).
- **`.claude/agents/qa.md` 마무리 JSON 재구조화** — 기존 JSON (`pr_url` / `pr_comment_url` / `label_transition` / `build_ok` / `tests` / `browser_levels_passed` / `contract_unmet` / `verdict`) 을 **공통 코어 + qa extends** 로 분리. `verdict: block` 시 `blocking_issues` 공통 필드 축약 전사 규칙 추가.
- **`.claude/agents/reviewer.md` 마무리 JSON 섹션 신규** — 이전엔 없던 JSON 반환 요구를 추가. extends: `review_outcome` / `minor_classification_verdict` / `axes_5_findings`. `blocking_issues` 와 라벨 전이의 결정 규칙 명시.
- **`.claude/agents/architect.md` 마무리 JSON 섹션 신규** — extends: `issue_url` / `adr_path` / `cross_validate_outcome` (`applied` / `skipped` / `429-fallback-claude-only` / `n/a`) / `design_comment_url`. `429-fallback-claude-only` 시 CLAUDE.md 폴백 프로토콜 기록 의무 인라인.
- **`.claude/agents/pm.md` 마무리 JSON 섹션 신규** — extends: `issue_url` / `clarity_score` / `mode_used` (one-way/qa-light/deep-qa) / `completion_criteria_count` / `non_goals_declared`. 비-범위 누락 자동 경고.

### Behavior Changes

- **모든 sub-agent (5개 페르소나) 가 공통 코어 7개 필드 + extends 구조의 JSON 을 반환** (이전: developer / qa 만 서로 다른 포맷으로 반환, reviewer / architect / pm 은 JSON 반환 요구 없음). 메인 오케스트레이터가 에이전트 종류 구분 없이 공통 필드로 외부 가시성 검증 가능.
- **sub-agent JSON 에 `auto_close_issue_states` 필드가 필수** (이전: v2.16.0 선언만, 프롬프트에 강제 없음). 각 에이전트가 머지/박제 대상 이슈 state 를 개별 확인해 필드 채움.
- **sub-agent JSON 에 `blocking_issues` / `non_blocking_suggestions` 공통 필드 추가** (이전: reviewer 에만 비정형으로 존재). qa 는 `verdict: block` 시 공통 `blocking_issues` 에도 축약 전사.
- **architect 가 cross-validate 수행 시 `extends.cross_validate_outcome` 을 JSON 으로 반환** (이전: 이슈 코멘트 `### 교차검증 반영` 서브섹션에만). `429-fallback-claude-only` outcome 은 CLAUDE.md 폴백 프로토콜 연동 강제.
- **pm 이 스프린트 계약에 `## 비-범위` 섹션을 누락하면 `extends.non_goals_declared: false` + `non_blocking_suggestions` 경고 자동 추가** (이전: 자가 점검 체크 항목에만 존재).

### Notes

- **`Builds on:` [#117](https://github.com/coseo12/harness-setting/pull/117)** (v2.16.0) — 선언적 규칙을 구조적으로 강제.
- **Phase 분리 근거**: Phase 1 (에이전트 템플릿) 만 배포돼도 정상 동작 (선언적 규칙 + 5개 페르소나 하드코딩). Phase 2 (cross_validate.sh 스크립트 폴백 + 스모크 테스트) 는 독립 릴리스 가능. CLAUDE.md `### 릴리스` 의 Phase 분리 3조건 충족.
- **reviewer 정적 리뷰 결과**: 차단 2건 해소 (BC#4 architect 429 fallback 실행 단계 + BC#5 pm 비-범위 누락 경고 자동 append) + 권고 3건 범위 내 반영 (SSoT 키 순서 고정 / developer 시점 명확화 / qa auto_close_issue_states 재정의). 권고 1 (SSoT 중복 리팩토링) + 라벨 네이밍 혼재 → [#127](https://github.com/coseo12/harness-setting/issues/127) 분리.
- **박제 직후 cross-validate (Gemini) 정상 수신**: 고유 발견 2건 중 (다) 파서 회귀 우려는 저장소에 CI/자동 JSON 파서 부재(`jq` 사용 1건만 — `package.json engines.node`) 를 실측으로 기각. (가) "JSON 블록 내 텍스트 금지 명시" 는 [#127](https://github.com/coseo12/harness-setting/issues/127) 에 C 항목으로 추가. Gemini 가 BC#4 BC#5 프롬프트 레벨 강제력을 "명시적·결정론적, wishful 성공적 제거" 로 평가.
- **현재 자동 파서 없음 / 미래 주의**: 본 릴리스에서 developer / qa JSON 이 flat → nested(`extends`) 구조로 변경됨. 향후 CI 레벨 파이프라인 자동화 도입 시 `extends` 중첩 파싱을 고려. Phase 2 스모크 테스트에서 JSON 구조 회귀 가드 추가 예정.
- **Phase 2 예정**: [#119](https://github.com/coseo12/harness-setting/issues/119) 완료 기준 2, 3, 5 (cross_validate.sh 429 폴백 하드코딩 + dry-run reminder + 스모크 테스트) 는 별도 MINOR 릴리스로 이어짐.

## [2.16.1] — 2026-04-19

v2.16.0 reviewer non-blocking 권고에서 분리된 두 PATCH 이슈(#118 sub-agent 블록 불릿 분리 / #114 실전 교훈 포인터 포맷 컨벤션) 을 묶어 정리. 구조 리팩토링 + 컨벤션 명시만.

### Added

- **CLAUDE.md `### sub-agent 검증 완료 ≠ GitHub 박제 완료` 블록 불릿 분리** — "한 불릿 = 한 규칙" 컨벤션 수렴. 기존 3개 논리 혼합 불릿(메인 확인 명령 / GitHub 명령 세트 / keyword 문법 연결)을 3개 독립 불릿으로 분리. 향후 수정 시 개별 규칙 참조 용이.
- **CLAUDE.md `## 실전 교훈` 도입부에 "블록 내 포인터 포맷 컨벤션" 명시** — 각 블록 말미의 `- 일반화된 설계 지식: [경로](링크) — 한 줄 요약` 포인터 포맷과 위치를 통일. 승격된 지식이 있을 때만 추가하고 빈 placeholder 는 금지 (없으면 생략). 기존 포인터 1건(매니페스트 블록)이 이미 컨벤션과 일치함을 확인.

### Behavior Changes: None — 문서만

구조 리팩토링 + 컨벤션 명시. 에이전트·스킬 행동 변화 없음. 기존 규칙 3개가 독립 불릿으로 표기 방식만 변경되고, 실전 교훈 섹션에 포맷 가이드만 추가.

### Notes

- **이슈 해결**: [#118](https://github.com/coseo12/harness-setting/issues/118) (sub-agent 블록 불릿 분리) + [#114](https://github.com/coseo12/harness-setting/issues/114) (실전 교훈 블록 링크 일관성) 본 릴리스로 close. 둘 다 v2.16.0 PR #117 / v2.15.1 PR #113 reviewer non-blocking 권고의 분리 이슈.
- PATCH — `Builds on: #117 #113`.

## [2.16.0] — 2026-04-19

volt [#40](https://github.com/coseo12/volt/issues/40) + [#41](https://github.com/coseo12/volt/issues/41) 반영. GitHub auto-close keyword 문법 가드 + Gemini cross-validate 429 폴백 프로토콜. 조용한 누락(**이슈 OPEN 잔존** = 커밋 메시지 keyword 오문법으로 auto-close 실패 / **박제 직후 cross-validate 루틴을 단일 모델 편향 노출 기회가 가장 큰 시점에 포기** = Gemini 429 로 즉시 Claude 단독 폴백 후 흔적 없이 사라짐) 을 구조적으로 방어. 박제 직후 cross-validate (Gemini) 정상 수신 후 앵커 2 확장 + 박제 위치 우선순위 반영. follow-up 이슈 [#118](https://github.com/coseo12/harness-setting/issues/118) (CLAUDE.md 불릿 분리) / [#119](https://github.com/coseo12/harness-setting/issues/119) (sub-agent 프롬프트 하드코딩) 분리.

### Added

- **CLAUDE.md `## PR 규칙` 확장** — GitHub closing keyword 올바른/잘못된 문법 예시 표. 머지 직후 `gh issue view <n> --json state` 로 auto-close 검증 루틴 명시. default branch 아닌 머지(feature → develop) 는 릴리스까지 OPEN 유지가 정상이라는 예외 조건 포함.
- **CLAUDE.md `## 교차검증` 에 API capacity 소진 폴백 프로토콜 3단 추가** — (1) `gemini -p "hello"` capacity 체크 + 1회 지연 재시도 (2) 2차 실패 시 "claude-only analysis completed — 단일 모델 편향 노출 미확보" 박제 기록 의무 (3) 박제 직후 루틴처럼 노출 효율 최대 시점이었다면 reminder 이슈로 박제 (harness #107 선례).
- **sub-agent 마무리 체크리스트에 auto-close 검증 통합** — sub-agent 보고 수신 직후 메인이 `gh issue view <대상> --json state` 로 실제 close 확인. 체크리스트 JSON 필드에 "auto-close 대상 이슈의 실제 state" 추가.

### Behavior Changes

- 에이전트가 여러 이슈 close 시 `Closes: #A, #B` 콜론 문법을 **사용하지 않고** `Closes #A, closes #B` 또는 줄 분리로 작성 (이전: 콜론 문법 사용 시 #B 조용히 미인식)
- 릴리스 PR / feature PR 머지 직후 sub-agent 가 보고하든 메인이 직접 작업하든 **auto-close 대상 이슈 state 를 개별 확인** (이전: PR merged=true 만 확인)
- Gemini 429 수신 시 즉시 Claude 단독 폴백하지 않고 **지연 재시도 후 최종 실패 시 폴백 + 결과 박제에 "단독 분석" 명시** (이전: 즉시 스킵하고 흔적 남기지 않음)
- 박제 직후 루틴처럼 노출 효율 최대 시점에 cross-validate 를 포기했다면 **reminder 이슈를 생성**해 API 복구 후 재시도 (이전: 재시도 기회가 사장됨)

### Notes

- **근거**: volt [#40](https://github.com/coseo12/volt/issues/40) (Gemini capacity 소진 폴백 프로토콜, v2.13.0 / v2.15.0 박제 직후 2회 관찰), volt [#41](https://github.com/coseo12/volt/issues/41) (GitHub auto-close `Closes:` 콜론 문법 미인식, harness PR [#108](https://github.com/coseo12/harness-setting/pull/108) 실측).
- **스킵**: volt [#40](https://github.com/coseo12/volt/issues/40) 교훈 5 (Gemini 2.5 Pro preview free tier retry 30분) 은 모델/시점 종속 정보라 CLAUDE.md 본문 부적합 — 반영 제외.
- **분류 근거**: 에이전트가 같은 입력에 다르게 동작 (커밋 메시지 문법 교체 / 재시도 루틴 / reminder 이슈 박제) → **MINOR**. `### Behavior Changes` 필수 섹션 포함.
- **박제 직후 cross-validate (Gemini) 성공**: 본 릴리스의 MINOR Behavior Changes 가 앵커 조건 (노출 효율 최대 시점) 에 해당하여 Gemini cross-validate 를 1회 호출. 응답 정상 수신 → 폴백 미적용 → reminder 이슈 발동 조건 소멸. Gemini 고유 발견 6건 중 **수용 2 (앵커 2 확장 / 박제 위치 우선순위)**, **후속 분리 1 (#119 sub-agent 프롬프트 하드코딩, medium)**, **반려 1 (reminder 이슈 과설계 주장 — harness #107 실증 선례로 기각)**, **합의 2**.
- **reviewer 권고 반영**: non-blocking 5건 중 4건 반영 (실패 예시 통합 / 앵커 3개 명시 / 박제 위치 매핑 / CHANGELOG 명확화), 1건 분리 ([#118](https://github.com/coseo12/harness-setting/issues/118)).

## [2.15.1] — 2026-04-19

상태 기록 원자성 3계층 직교 방어 패턴을 일반화된 설계 문서로 승격. harness v2.8.0 → v2.9.0 → v2.10.0 의 자기 실증 연대기를 CLAUDE.md 의 구체 사례로만 두지 않고, 다른 시스템(파일 시스템 / DB 마이그레이션 / 빌드 캐시 / git 서브모듈) 에 재사용 가능한 설계 지식으로 박제. [#100](https://github.com/coseo12/harness-setting/issues/100) 해결.

### Added

- **`docs/architecture/state-atomicity-3-layer-defense.md` 신규** — 상태 기록 원자성 3계층 직교 방어 패턴 일반화 문서. 배경(blind spot 연쇄) / 3계층 설계 목표·커버 범위·blind spot 표 / 다른 시스템 적용 예시 4종 (파일 시스템 / DB 마이그레이션 / 빌드 캐시 / git 서브모듈) / 계층 1만·1+2·1+2+3 적용 조건 분기 / harness 자기 실증 매핑 (v2.8.0 / v2.9.0 / v2.10.0). git 서브모듈 계층 1 은 "pre-commit 훅 기반" 임을 명시 (git 자체 자동 차단 없음). 계층 1 타이밍 서술은 원자 트랜잭션 전제를 피해 "연산 scope 내 부분 실패" 로 중립화.
- **CLAUDE.md "매니페스트 최신 ≠ 파일 적용 완료" 섹션에 신규 문서 링크 1줄 추가** — 다른 프로젝트에서 동일 패턴을 재사용할 때 CLAUDE.md 를 역-디코딩할 필요 없이 아키텍처 문서를 직접 참조하도록.

### Behavior Changes: None — 문서만

에이전트·스킬 행동 변화 없음. harness 코드 변경 없음. [#100](https://github.com/coseo12/harness-setting/issues/100) 원문에서 PATCH 로 분류된 대로 `Builds on: #99` (v2.12.0) 의 후속 분리 이슈 해결.

### Notes

- **이슈 해결**: [#100](https://github.com/coseo12/harness-setting/issues/100) 본 릴리스로 close.
- **후속 이슈 분리**: PR [#113](https://github.com/coseo12/harness-setting/pull/113) reviewer non-blocking 제안 3 (CLAUDE.md 실전 교훈 블록 링크 위치 일관성 리팩토링) 은 [#114](https://github.com/coseo12/harness-setting/issues/114) 로 분리. 향후 일반화 문서 추가 시 누적 효과 있는 별도 작업.
- 근거: volt [#28](https://github.com/coseo12/volt/issues/28) (일반화된 3계층 방어 패턴 지식) + harness [#89](https://github.com/coseo12/harness-setting/issues/89) / [#92](https://github.com/coseo12/harness-setting/issues/92) (실증).

## [2.15.0] — 2026-04-19

gitflow 정책 보강 릴리스 — v2.14.0 관찰로 드러난 fast-forward 단계 누락 + Gemini 2차 cross-validate 고유 발견 (doctor 거짓 양성 제거) + 후속 이슈 #105 (drift 로직 unrelated histories 방어 + hotfix 문맥 인식) 통합. ADR 2개 근거 보강 + 배포 패턴 가이드 신설. 후속 이슈 [#105](https://github.com/coseo12/assetsrc-setting/issues/105) [#110](https://github.com/coseo12/harness-setting/issues/110) 해결.

### Added

- **`lib/doctor.js` `classifyGitflowDrift` 확장** — 3번째 인자 `opts = { developIsAncestorOfMain, hasHotfixBranch }` 추가. 분류 우선순위: null 입력 (unrelated histories) → mainAhead===0 pass → developIsAncestorOfMain pass (fast-forward 대기) → hasHotfixBranch warn (hotfix 진행 중) → 기타 warn (hotfix 누락/release squash 실수)
- **doctor 호출부에 `git merge-base --is-ancestor` + `git branch -r --list origin/hotfix/*` 체크 추가** — merge commit 직후 fast-forward 전 상태를 pass 로 정확히 분류
- **테스트 +6 건** (`test/doctor-gitflow-drift.test.js`): fast-forward 대기 pass / 동기+ancestor / null 입력 warn (unrelated histories) / hotfix 진행 중 warn + 브랜치명 / ancestor+hotfix 모순 안전망
- **CLAUDE.md 브랜치 전략 앞머리에 develop 의 두 역할 명시** — (1) 통합 스테이징 (여러 feature 상호작용 검증, tag trigger 로 대체 불가), (2) PaaS staging environment 매핑 + "하네스 자체 vs 사용자 프로젝트 릴리스 구분" 문단
- **CLAUDE.md 릴리스 워크플로 4단계로 확장** — `gh pr merge --merge` → `git push origin main:develop` fast-forward → `git tag` → `gh release create`. drift 감지 섹션에 fast-forward 대기 pass 조건 명시
- **ADR [20260419-gitflow-main-develop](docs/decisions/20260419-gitflow-main-develop.md) 결정 근거 +2 항목** — 통합 스테이징 수요 (tag trigger 대체 불가) + 하네스 사용자 프로젝트 PaaS 현실 (브랜치 기반 배포 강제). 재검토 조건 강화 (두 조건 동시 만족 시에만 main-only 전환 재고)
- **ADR [20260419-release-merge-strategy](docs/decisions/20260419-release-merge-strategy.md) fast-forward 단계 명시** — v2.14.0 운영에서 누락됐던 `git push origin main:develop` 단계 박제
- **`docs/deployment-patterns.md` 신규** — 원칙 + Vercel 최소 예시 + 6개 PaaS 일반화 표 + tag 기반 예외 + 하네스 자체 vs 사용자 프로젝트 비교
- **`docs/decisions/README.md` ADR 인덱스 갱신** — 같은 날짜 ADR 파일명 접미사 규칙 + 현재 ADR 상하 관계 표
- **PR 템플릿 Release PR 섹션 확장** — 4단계 워크플로 체크박스 (merge commit / fast-forward push / tag / gh release) + 사후 `harness doctor` 확인

### Behavior Changes

- `harness doctor` 가 release PR merge commit 직후 fast-forward 전 상태를 **pass (fast-forward 동기화 대기 중)** 로 분류 (이전: warn 거짓 양성)
- `harness doctor` 가 `hotfix/*` 브랜치 존재 시 "hotfix 진행 중 — merge-back PR 필요" 로 문맥 인식 (이전: 일반 drift warn)
- `harness doctor` 가 unrelated histories / ref 부재 시 명시적 warn + 공통 조상 확인 안내 (이전: 거짓 음성 — parseInt("0")=0 으로 수렴)
- 릴리스 워크플로에 **`git push origin main:develop` fast-forward 단계 추가** — v2.14.0 에서 실수로 누락됐던 규칙 박제. 에이전트가 release PR 머지 후 이 단계를 자동 실행하도록 안내
- CLAUDE.md / ADR / 템플릿에 "develop = 통합 스테이징 + PaaS staging env 매핑" 근거 박제 — 재검토 시점에 이 수요 소멸 확인 필요

### Notes

- **후속 이슈 해결**: [#105](https://github.com/coseo12/harness-setting/issues/105), [#110](https://github.com/coseo12/harness-setting/issues/110) 본 릴리스로 close.
- 본 릴리스는 Gemini 2차 cross-validate 결과 (`classifyGitflowDrift` 에 `--is-ancestor` 체크 추가 제안) + 사용자 토론 결과 (통합 스테이징 근거 + PaaS 현실 반영) 의 통합 결과. Gemini 이견 "1회 실수 시 즉시 Action 자동화" 는 반려 유지 (차후 실운영 재논의).
- 테스트 22 → 28 (+6 drift 세분화 분류 테스트).
- 근거: ADR [20260419-release-merge-strategy.md](docs/decisions/20260419-release-merge-strategy.md) 보강, 상위 ADR [20260419-gitflow-main-develop.md](docs/decisions/20260419-gitflow-main-develop.md) 근거 +2, 신규 [docs/deployment-patterns.md](docs/deployment-patterns.md)

## [2.14.0] — 2026-04-19

Release PR merge 전략 전환 — `--merge` (merge commit) 로 고정하여 매 릴리스마다 강제되던 merge-back PR 을 원천 제거. v2.13.0 (#102) 에서 관찰한 "release 1회 = 3 PR + doctor drift 경고" 구조의 근본 해결. 후속 이슈 [#104](https://github.com/coseo12/harness-setting/issues/104) 해결.

### Added

- **`docs/decisions/20260419-release-merge-strategy.md` ADR** — 옵션 A (merge commit) / B (Action 자동화) / C (현재 유지) 비교 + merge commit 선택 근거 + 재검토 조건 (squash 실수 머지 3회 누적, 또는 대형 stabilization window 필요 시 옵션 재고).
- **CLAUDE.md 릴리스 워크플로 업데이트** — release PR 에 `gh pr merge <PR> --merge` 사용 명시. `--squash` 금지 + 원리 설명 (main tip 이 develop tip 을 직계 조상으로 포함 → drift 원천 제거). drift 감지 섹션에 "squash 실수 머지" 힌트 추가 (`git show main --format=%P | wc -w` 로 부모 커밋 수 확인).
- **PR 템플릿 Release PR 섹션 업데이트** — "`gh pr merge <PR> --merge` 로 머지, `--squash` 절대 사용 금지" 체크박스 추가 (ADR 근거 인라인).
- **`.claude/skills/create-pr/SKILL.md` Base 선택 표 확장** — 머지 방식 컬럼 추가 (일반 feature/fix=squash, Release=merge commit, Hotfix=squash 또는 merge commit, Hotfix merge-back=merge commit). 금지 규칙에 "Release PR 의 squash 머지 금지" 명시.
- **`harness doctor` drift 경고 문구 세분화** — "hotfix merge-back 누락" + "release PR 직후라면 `--squash` 로 실수 머지한 가능성" + 복구 방법 (merge-back PR 또는 release revert+재머지) 안내.

### Behavior Changes

- Release PR 은 **반드시 `--merge` (merge commit) 방식으로 머지**된다 (이전: `--squash` 사용으로 매 릴리스 drift 발생)
- Release 후 merge-back PR 이 **불필요**해진다 — main tip 이 develop tip 을 직계 조상으로 포함 (이전: 매 릴리스 1회 sync-only PR 강제)
- `harness doctor` 의 gitflow drift 경고 문구가 hotfix 누락과 release squash 실수를 구분 안내 (이전: 두 원인이 동일 메시지)
- `create-pr` 스킬이 PR 타입별 머지 방식을 명시적으로 안내 (이전: 일반 feature/fix 기준 squash 만 안내)

### Notes

- **후속 이슈 해결**: [#104](https://github.com/coseo12/harness-setting/issues/104) 본 PR 로 close. [#106](https://github.com/coseo12/harness-setting/issues/106) 은 release merge-back 이 사라지므로 용어 일반화 불필요 — close 예정.
- **후속 이슈 유지**: [#105](https://github.com/coseo12/harness-setting/issues/105) (drift 로직 unrelated histories 방어) 는 merge commit 전환과 독립 — 별도 처리. [#107](https://github.com/coseo12/harness-setting/issues/107) 은 Gemini API 복구 후 재시도.
- **본 릴리스 자체가 새 전략의 첫 적용 사례** — release PR 을 `gh pr merge --merge` 로 머지. 기존 v2.13.0 squash merge 기전의 정반대로 첫 실 운영.
- 재검토 조건: 6개월 후 (2026-10-19) 1인 + AI 운영에서 실수로 squash 머지한 사례가 3회 이상이면 옵션 B (Action 자동화) 재고.
- 근거: ADR [20260419-release-merge-strategy.md](docs/decisions/20260419-release-merge-strategy.md), 상위 gitflow 결정 [20260419-gitflow-main-develop.md](docs/decisions/20260419-gitflow-main-develop.md)

## [2.13.0] — 2026-04-19

gitflow 복원 — `main=배포 / develop=개발` 정석 워크플로로 전환. v2.12.0 이전 dual PR 변형 + 고빈도 작업 압박으로 develop 이 56 커밋 뒤처지는 drift 를 놓친 사례([ADR 20260419](docs/decisions/20260419-gitflow-main-develop.md))의 재발 방지. `harness doctor` 가 main vs develop 격차를 자동 점검한다.

### Added

- **CLAUDE.md 브랜치 전략 섹션 재작성** — 4개 브랜치 역할 표(`main` / `develop` / `feature/*` / `fix/*` / `hotfix/*`) + 워크플로 3단계(일상 개발 / 릴리스 / 핫픽스) + drift 감지 규칙 명시.
- **CLAUDE.md 금지 사항 2줄 추가** — (a) feature/fix PR 의 `base=main` 금지 (release/hotfix 만 허용), (b) hotfix 머지 후 `main → develop` merge-back 누락 금지.
- **`docs/decisions/20260419-gitflow-main-develop.md` ADR** — 과거 dual PR drift 타임라인 분석(PR #37~#99), 후보 A/B/C 비교, 결정 근거, 재검토 조건 박제.
- **`.github/PULL_REQUEST_TEMPLATE.md` Base 확인 가드** — 4종 PR 타입 체크박스(일반 / release / hotfix / merge-back) + release/hotfix 전용 섹션(CHANGELOG / 태그 계획 / merge-back PR 링크).
- **`harness doctor` — "gitflow 브랜치 정합성" 항목** — `origin/main` vs `origin/develop` 커밋 격차로 drift 조기 탐지. main 이 develop 보다 앞서면 warn (hotfix merge-back 누락 또는 release squash 미동기화 의심). pure function `classifyGitflowDrift(mainAhead, devAhead)` 로 분리해 단위 테스트 6건 커버.
- **`.claude/skills/create-pr/SKILL.md` Base 선택 표** — 4종 PR 타입별 base/head 조합 명시 + `base=main` 사용 시 release/hotfix PR 인지 재확인 규칙.

### Behavior Changes

- 모든 신규 feature/fix PR 은 `base=develop` 을 사용한다 (이전: dual PR 또는 `base=main` 혼재)
- 릴리스는 `develop → main` 단일 release PR 로 수행 (이전: feature 별 `base=main` 직접 PR)
- hotfix 는 `main` 에서 분기 → `base=main` PR → 머지 직후 `main → develop` merge-back PR 생성이 의무 (이전: 핫픽스 프로세스 미정의)
- `harness doctor` 가 매 실행마다 `main` vs `develop` 격차를 점검하여 drift 조기 경보 (이전: 점검 없음 — 6일 drift 를 브랜치 정리 중 수동 발견)
- `create-pr` 스킬이 base 선택 시 일반/release/hotfix 를 구분 안내하며, `base=main` 시도 시 release/hotfix 확인을 명시적으로 수행 (이전: `--base develop` 하드코딩)
- PR 템플릿이 체크박스 형태로 PR 타입을 선언하도록 요구하여 dual PR 재발 시 구조적 감지 가능 (이전: 체크 부재)

### Notes

- 본 PR 이 새 워크플로의 첫 적용 사례 — `base=develop` 으로 머지 후 즉시 `develop → main` release PR 로 v2.13.0 태그 발행.
- 재검토 조건: develop 이 6개월 이상 main 과 동일 해시를 유지하면 main-only (trunk-based) 전환을 재고 (2026-10-19 1차 리뷰).
- 과거 drift 타임라인: PR #37~#58 dual PR 시기 → PR #59~#99 develop 방치 → v2.12.0 (#99) 릴리스 후 발견 → 본 PR 복원.
- 테스트 22 → 28 (+6 drift 분류 테스트).
- 근거: ADR [20260419-gitflow-main-develop.md](docs/decisions/20260419-gitflow-main-develop.md), 타임라인 분석은 ADR 본문 참조.

## [2.12.0] — 2026-04-18

volt [#30](https://github.com/coseo12/volt/issues/30) / [#32](https://github.com/coseo12/volt/issues/32) / [#33](https://github.com/coseo12/volt/issues/33) / [#35](https://github.com/coseo12/volt/issues/35) 반영 — Phase 분리 릴리스 리듬 + 수치 DoD 미달 시 측정법 우선 + headless 3D/WebGPU 부분 freeze 대응 + 다운스트림 prettier drift 경계를 에이전트 행동 규칙·교훈으로 박제.

### Added

- **CLAUDE.md 스프린트 계약 항목 10: 수치 DoD 미달 시 측정 방법 검증 우선** — DoD 수치 미달 시 (0) 측정 방법 검증 → (1) 식/구현 수정 → (2) 알고리즘 교체 순. 약한 신호에서 noise 가 이론값 방향으로 우연히 pull 되는 "우연 성공" 트랩 경계 (volt #32).
- **CLAUDE.md 릴리스: Phase 분리 릴리스 리듬** — 적용 조건 3가지(backward-compat / 완결 Behavior Change / 사용자 동의) + 적용 불가 조건 + CHANGELOG Phase 별 entry 박제 규칙 (volt #30).
- **CLAUDE.md 매니페스트 섹션: 다운스트림 formatter 재포맷 경계 drift** — lint-staged `prettier --write` 가 파일 적용 직후 upstream 스타일을 로컬 컨벤션으로 되돌리는 drift 패턴. `.prettierignore` 에 harness-managed 경로 추가 + `git show --stat HEAD` 로 커밋 후 검증 (volt #35).
- **CLAUDE.md 실전 교훈: headless 브라우저 검증 ≠ 실 브라우저 동작** — swiftshader WebGPU adapter 부분 freeze + 부분 성공 pipeline false positive 경계. 실 Chrome GUI 수동 검증 최소 1회 + partial 자산 보존 + PM 계약 M1 백업 경로 패턴 (volt #33).
- **`.claude/skills/browser-test/SKILL.md` §7 "3D / WebGPU / shader-bound 렌더 검증 (headless 한계 대응)"** — `status:review` 전이 전 필수 5단계 체크리스트: headless 기본 검증 / 도메인 특화 pixel 검증 / 카메라 회전 응답 diff / **실 Chrome GUI 수동 검증 최소 1회** / 부분 성공 보존. 규칙 섹션에 "headless 단독을 채택 근거로 사용 금지" 규칙 추가.

### Behavior Changes

- `browser-test` 스킬이 3D/WebGPU/camera/shader-bound 렌더 포함 작업에 대해 실 Chrome GUI 수동 검증을 최소 1회 요구하며, 누락 시 `status:review` 전이를 차단한다 (이전: headless 자동 검증만으로 "채택" 판정 허용)
- `browser-test` 스킬의 워크플로 §7 체크리스트(5단계) 가 신규 추가되어 시각 효과 포함 작업의 검증 하한선이 상향된다 (이전: 워크플로 6개까지만 정의)
- PM/Architect 에이전트가 완료 기준이 많은 이슈를 설계할 때 Phase 분리 릴리스 리듬을 명시적으로 검토한다 (이전: 단일 스프린트로 일괄 처리 편향)
- 스프린트 계약 수치 DoD 미달 시 측정 방법 검증을 0번 단계로 명시적으로 수행한다 (이전: 식 수정 → 알고리즘 교체 순 자동 반사)

### Notes

- volt #33 은 CLAUDE.md 교훈(PATCH 성격) + browser-test SKILL 체크리스트(MINOR 성격) 를 동시 반영. SKILL 체크리스트가 행동 변화를 만들기 때문에 전체 릴리스는 MINOR.
- volt #28 (상태 기록 원자성 3계층 방어 패턴 일반화) 는 현재 PR 범위 밖으로 판단하여 후속 `docs/architecture/` 문서화 이슈로 분리.
- 스킵한 volt 이슈 (7건, 주로 WebGPU/Babylon 특화 도메인 지식) 는 astro-simulator CLAUDE.md 범위로 귀속. 기 반영 케이스는 #22 / #27.
- 근거: volt [#30](https://github.com/coseo12/volt/issues/30) / [#32](https://github.com/coseo12/volt/issues/32) / [#33](https://github.com/coseo12/volt/issues/33) / [#35](https://github.com/coseo12/volt/issues/35)

## [2.11.0] — 2026-04-18

volt [#29](https://github.com/coseo12/volt/issues/29) / [#31](https://github.com/coseo12/volt/issues/31) / [#34](https://github.com/coseo12/volt/issues/34) 반영 — 교차검증 수용/분리 3단 프로토콜 + 스프린트 계약 재조정 시 테스트 ROI 체크 + PM sub-agent multi-turn 라운드 이탈 검증을 에이전트 행동 규칙으로 박제.

### Added

- **CLAUDE.md 실전 교훈 블록: "sub-agent multi-turn 라운드 이탈 — 매트릭스 일관성 검증"** — 라운드 N 출력에서 핵심 키워드 목록(매트릭스 행 제목 / DoD 수치 / Q&A)을 추출해 라운드 N+1 과 대조하는 책임, SendMessage 시 이전 매트릭스 원문 인라인 재첨부, 이탈 산출물의 후속 확장 후보 자산화 규칙 박제 (volt #34).
- **CLAUDE.md 스프린트 계약: 재조정 ROI 5문 체크 + 3위치 박제 (항목 6~9)** — 테스트 환경 구축 비용 / 보호 대상 라인 수 / 회귀 가시성 / 간접 보증 가능성 / 미래 인프라 이전 가능성의 5문 체크, 그리고 재조정 시 코드 주석 / PR 본문 / CHANGELOG Notes 3위치 동시 박제 의무화 (volt #31).
- **CLAUDE.md 교차검증: 고유 발견의 수용 vs 후속 분리 3단 프로토콜** — 합의 선별 / 고유 발견의 범위 체크(스프린트 비목표 대조) / 분리 시 즉시 이슈 생성 + `Builds on: #원PR` 박제 규칙. 스프린트 비목표를 Gemini 제안 타당성만으로 무시하는 CRITICAL #6 침범 금지 명시 (volt #29).
- **`.claude/agents/pm.md`: Multi-turn 라운드 이어받기 규칙 + 자가 점검 체크** — 이전 라운드 매트릭스의 본문 인라인 여부 사전 확인, 참조 레이블만 있으면 원문 재첨부 요구, 이탈 산출물 보너스 자산화 지시.
- **`.claude/skills/cross-validate/SKILL.md`: 수용 vs 후속 분리 3단 프로토콜 본문** — "결과 분석" 섹션 뒤에 프로토콜 전문 + 참고 사례(#89→#92 분리) 박제.

### Behavior Changes

- PM 에이전트가 multi-turn 세션 이어받기 시 이전 라운드 매트릭스 원문의 본문 인라인 여부를 먼저 확인하고, 참조 레이블만 있으면 원문 재첨부 요구 후 진행한다 (이전: 참조 레이블만으로 재구성 시도)
- 메인 오케스트레이터가 sub-agent multi-turn 라운드 N/N+1 키워드 대조로 이탈을 즉시 감지하는 책임을 명시적으로 진다 (이전: 루틴 없음)
- 스프린트 완료 기준을 실측 후 재조정할 때 테스트 ROI 5문 체크를 거치고, 재조정 사실을 코드 주석 / PR 본문 / CHANGELOG 3위치에 동시 박제한다 (이전: "재조정 가능" 원칙만 있고 절차 부재)
- 교차검증 고유 발견을 처리할 때 스프린트 비목표와 대조하여 현재 PR 반영 vs 후속 이슈 분리를 판정하며, 분리 시 즉시 이슈 생성 + `Builds on: #원PR` 링크를 박제한다 (이전: 반려 기준만 있고 수용/분리 기준 공백)

### Notes

- volt #23 CRITICAL DIRECTIVE 박제 직후 교차검증 루틴을 PR [#97](https://github.com/coseo12/harness-setting/pull/97) 에서 수행. Gemini 2.5 Pro 가 전 항목 "양호" + Merge 추천, 고유 발견 없이 통과.
- 스킵한 volt 이슈 (10건) 와 사유는 PR [#97](https://github.com/coseo12/harness-setting/pull/97) 본문 참조. 주로 도메인 특화(WebGPU / Babylon / Chromium 진단) 또는 1회 관찰(컴파일 규약의 "3회 이상" 미달) 또는 기 반영 케이스.
- 근거: volt [#29](https://github.com/coseo12/volt/issues/29) / [#31](https://github.com/coseo12/volt/issues/31) / [#34](https://github.com/coseo12/volt/issues/34), harness [PR #97](https://github.com/coseo12/harness-setting/pull/97)

## [2.10.0] — 2026-04-18

harness [#92](https://github.com/coseo12/harness-setting/issues/92) Phase 2 — `harness doctor` 해시 정합성 리포트가 **`previousSha256` 매치 건을 "외부 롤백 의심"** 으로 별도 분류. managed-block 센티널 외부 편집 오탐 방지 계약을 회귀 가드 테스트로 박제.

### Added

- **doctor 해시 정합성 분류 세분화** — 기존 단일 warn 항목을 다음과 같이 3분기:
  - **"매니페스트 해시 정합성 — 외부 롤백 의심"** — `actual === previousSha256` 매치. `--apply-all-safe` 로 자가 복구 가능함을 안내
  - **"매니페스트 해시 정합성 — 기타"** — 분류 불가능한 불일치(사용자 수정 또는 근원 불명). `update --check` 안내
  - 단일 카테고리만 있는 경우 subtitle 생략하여 가독성 유지
- **sentinels.managedSha256 불변성 테스트** (`test/sentinels-invariance.test.js`) — 센티널 외부 편집이 해시에 영향을 주지 않음을 3케이스로 가드. managed-block 카테고리 파일의 외부 편집이 post-apply 검증/doctor 정합성에서 오탐을 일으키지 않는 계약을 박제.
- **`lib/update.js` post-apply 검증 계약 주석 보강** — merge/delete 스킵 조건과 managed-block 오탐 방지 원리를 코드 옆에 박제.

### Behavior Changes

- `harness doctor` 가 매니페스트 해시 정합성 결과를 외부 롤백 의심 / 기타 / 파일 누락으로 분리 리포트
- 외부 롤백 의심 항목은 "`harness update --apply-all-safe` 로 자가 복구 가능" 안내 문구 포함
- 기타 분기는 기존과 동일 동작 (사용자 수정 케이스)

### Notes

- **merge type 스킵 경로 테스트**는 `applyMerge` 의 `git show v<version>:<rel>` 의존성으로 단위 테스트 구축 비용이 높아 이번 릴리스에서 제외. 대신 `lib/update.js:400` 에 계약을 주석으로 박제하여 회귀 가드 역할을 분담. 필요 시 후속 이슈로 fixture git repo 기반 통합 테스트를 다룰 수 있음.
- 이슈 [#92](https://github.com/coseo12/harness-setting/issues/92) Phase 2 완료 기준 3개 중 2개 충족 + 1개는 주석 계약으로 대체.
- 근거: harness [#92](https://github.com/coseo12/harness-setting/issues/92) (#89 교차검증 지적 반영)

## [2.9.0] — 2026-04-18

harness [#92](https://github.com/coseo12/harness-setting/issues/92) Phase 1 — 매니페스트 `previousSha256` 필드 도입으로 **커밋 시점 외부 롤백의 자가 복구**. v2.8.0 의 post-apply 게이트가 잡지 못하던 timing (lint-staged pre-commit 훅 롤백) 을 `harness update --check` 가 스스로 분류한다.

### Added

- **매니페스트 엔트리에 `previousSha256` optional 필드** — `harness update` 완료 시 각 파일의 이전 `sha256` 값을 자동 기록. backward-compatible (필드 부재 매니페스트도 정상 동작, 다음 update 시 자연 채워짐).
- **`diffAgainstPackage` 자가 복구 분기** — `userSha === previousSha256` 인 파일은 `modified-pristine` 으로 재분류하여 재-apply 허용. 기존 로직에서는 `divergent` (사용자 임의 수정) 로 오분류되어 교착 상태가 되던 케이스를 해소.
- **테스트 5케이스 추가** — previousSha256 자동 기록 / userSha 매칭 재분류 / 자가 복구 통합 시나리오 / legacy 매니페스트 호환 / sha256 무변화 시 필드 비기록.

### Behavior Changes

- `harness update` 가 완료 시 sha256 이 변경된 파일의 매니페스트 엔트리에 `previousSha256` 필드를 기록한다
- `harness update --check` 가 `userSha === previousSha256` 인 파일을 **`modified-pristine`** 으로 재분류 (기존: `divergent`)
- `--apply-all-safe` 가 외부 롤백된 파일을 자동 감지하여 재적용 — **교착 상태가 코드 레벨에서 원천 해소**
- legacy 매니페스트(필드 부재) 는 별도 migration 스텝 없이 다음 update 에서 자연 채워짐

### Notes

- Phase 2 (후속): `harness doctor` 가 previousSha256 매칭 건을 "외부 롤백 의심" 으로 별도 분류. merge type 스킵 / managed-block 외부 편집 오탐 방지 테스트 보강.
- 이슈 [#89](https://github.com/coseo12/harness-setting/issues/89) (v2.8.0 post-apply 게이트) 과 상호보완 — v2.8.0 은 update 도중 개입 방어, v2.9.0 은 update 이후 롤백 자가 복구.
- Gemini 교차검증에서 제안된 근본 해결책을 이슈 [#92](https://github.com/coseo12/harness-setting/issues/92) 로 분리 후 Phase 1 구현.
- 근거: harness [#92](https://github.com/coseo12/harness-setting/issues/92), volt [#27](https://github.com/coseo12/volt/issues/27)

## [2.8.0] — 2026-04-18

harness [#89](https://github.com/coseo12/harness-setting/issues/89) 반영 — `harness update --apply-all-safe` post-apply 검증 게이트 + `harness doctor` 매니페스트 해시 정합성 검증. v2.7.2 에서 박제한 "매니페스트 최신 ≠ 파일 적용 완료" 교착 상태를 코드 레벨에서 방어.

### Added

- **`lib/update.js` post-apply 검증 게이트** — 파일 적용 직후 upstream 패키지 해시와 디스크 실측 해시를 비교하여 외부 프로세스(lint-staged 등) 에 의한 롤백을 감지. 불일치 파일의 매니페스트 해시는 이전 값으로 유지되어 재-apply 시 `modified-pristine` 으로 재감지됨. merge/delete type 은 검증 제외.
- **`lib/doctor.js` "매니페스트 해시 정합성" 항목** — 매니페스트 기록 해시 vs 파일 실측 해시를 비교하여 해시 위조 또는 파일 누락을 warn 으로 리포트. managed-block 파일은 센티널 내부만 해시하므로 외부 편집 오탐 없음.
- **`test/` 디렉토리 신설** — Node 내장 `node --test` 기반 6케이스 (update 검증 3 + doctor 정합성 3). `package.json scripts.test` 추가.

### Behavior Changes

- `harness update --apply-all-safe` 가 적용 직후 upstream/디스크 해시 비교를 수행한다
- 불일치 파일은 매니페스트 해시를 갱신하지 않고 이전 값 유지 (재-apply 시 pristine 재감지)
- 부분 실패 감지 시 exit code 1 + stderr `harness update: post-apply 검증 실패 N건 — <파일 목록>` 출력
- `harness doctor` 가 "매니페스트 해시 정합성" 항목을 pass/warn 으로 리포트 (매니페스트 없으면 항목 스킵)
- 정상 경로(검증 성공) 에서는 기존 동작과 완전 동일 (backward-compatible)

### Notes

- 한계: post-apply 검증은 `harness update` 종료 직전까지만 유효. 사용자 `git commit` 시점에 동작하는 lint-staged pre-commit 훅 롤백은 `harness doctor` 실행 시점에만 감지됨. 커밋 시점 롤백의 자가 복구는 후속 이슈 [#92](https://github.com/coseo12/harness-setting/issues/92) 에서 `previousSha256` 필드 도입으로 다룸.
- Gemini 교차검증 수행 — 설계 방향 / edge case / 한계 인식 모두 합의. Gemini 고유 발견(previousSha256 제안, merge/managed-block 스킵 경로 테스트 보강)은 이슈 #92 에 박제.
- 근거: harness [#89](https://github.com/coseo12/harness-setting/issues/89), volt [#27](https://github.com/coseo12/volt/issues/27)

## [2.7.2] — 2026-04-18

volt [#27](https://github.com/coseo12/volt/issues/27) 반영 — 매니페스트 기반 패키지 관리자 부분 실패 교착 복구 교훈 박제.

### Added

- **CLAUDE.md 실전 교훈** "매니페스트 최신 ≠ 파일 적용 완료" 섹션 — `harness update --apply-all-safe` 가 lint-staged 부분 실패와 연쇄될 때 `.harness/manifest.json` 은 최신 해시로 기록되지만 파일은 롤백되어 재시도가 스킵되는 **복구 불가능한 교착 상태** 와 즉시 복구 스니펫을 박제. 선행 원인 volt [#13](https://github.com/coseo12/volt/issues/13) 과 연결.
- Gemini cross-validate 피드백 반영 — 복구 스니펫에 `git log --oneline --merges -n 5` 로 이전 머지 커밋 해시를 찾는 법 주석 추가.

### Behavior Changes

- None — 문서/교훈만. 에이전트 자동 행동 변화 없음. 사용자 복구 루틴 가이드 문서화.
- harness 코드 레벨 원자성 개선(manifest 갱신 시점 재설계)은 별개 설계 이슈 [#89](https://github.com/coseo12/harness-setting/issues/89) 로 분리.

### Notes

- 스킵한 volt 이슈: #8 (harness 가 원본), #9 #10 #16 #19 #20 #25 (Babylon/WGSL/WebGPU 도메인), #18 (앱 bench 도메인), #22 (이미 v2.6.2/v2.6.3 에 반영)
- 근거: volt [#27](https://github.com/coseo12/volt/issues/27) (PR [#90](https://github.com/coseo12/harness-setting/pull/90))

## [2.7.1] — 2026-04-18

`cross_validate.sh` 한국어 로그 메시지 U+FFFD 복구 ([#87](https://github.com/coseo12/harness-setting/issues/87)).

### Fixed

- **`.claude/skills/cross-validate/scripts/cross_validate.sh:65`** — `시` + `U+FFFD × 3` → `시도` 복구. RESOURCE_EXHAUSTED 재시도 로그 메시지의 의미 깨짐을 해소.

### Behavior Changes

- None — 문구/인코딩만. 로그 출력 문자열만 교체되며 에이전트/스킬 동작 로직 변화 없음. `atomic` 카테고리 파일이라 다음 `harness update` 때 다운스트림에 자동 반영된다.

## [2.7.0] — 2026-04-18

volt #23 #24 #26 반영 — cross-validate 박제 후 루틴 + sub-agent 마무리 체크리스트 + ADR 변형 박제.

### Added

- **CLAUDE.md 실전 교훈** — "sub-agent 검증 완료 ≠ GitHub 박제 완료" 섹션 (volt [#24](https://github.com/coseo12/volt/issues/24), 4회 관찰)
- **CLAUDE.md `## 교차검증`** — 정책·설계·ADR 박제 직후 1회 루틴 + Claude 재분석 규칙 추가 (volt [#23](https://github.com/coseo12/volt/issues/23))
- **developer 에이전트** 워크플로 12단계로 확장 — **마무리 체크리스트 JSON 반환 강제** (commit SHA / PR URL / files / tests / browser levels / remaining TODOs)
- **qa 에이전트** 마무리 체크리스트 JSON 섹션 — `pr_comment_url` 이 `null` 이면 종료 금지
- **architect 에이전트** 절차 7단계로 확장 — 라벨 전이 직전 cross-validate 1회 호출 의무 (정책·ADR 포함 시)
- **cross-validate 스킬** description `ALSO TRIGGER (루틴)` 조건 — 박제 직후 자동 노출 효율 극대화
- **record-adr 스킬** "변형 박제 — D' (prime) 패턴" 섹션 (volt [#26](https://github.com/coseo12/volt/issues/26)) — 원안 편집 금지 + 변형 서브섹션 4필드 + 분류 표(변형/Superseded/Deprecated)

### Behavior Changes

- **sub-agent(dev/qa) 출력 계약 변경** — 평문 보고 → **구조화 JSON 반환** 으로 계약 강화. 메인 오케스트레이터는 JSON field 로 누락을 감지한다. 커스텀 wrapper 가 평문 파싱에 의존하는 다운스트림은 JSON 파서로 전환 필요.
- **architect 에이전트 실행 단계 +1** — `stage:design → stage:dev` 전이 직전 `cross-validate` 스킬 호출이 기본 단계로 추가. gemini CLI 미설치 환경에서는 자동 스킵되며 "Claude 단독 분석" 로 기록됨.
- **record-adr 스킬 가이드 확장** — 기술 장벽으로 원안 변경 시 **원안 편집 금지** 원칙이 문서화됨. 기존 ADR 을 편집해 반영하던 경우 변형 서브섹션 추가 방식으로 바꿔야 한다.
- **cross-validate 스킬 트리거 범위 확장** — 정책·ADR·CRITICAL DIRECTIVE 를 박제한 직후 컨텍스트에서 자동 호출 대상이 됨. 박제 직후 호출 비용(Gemini 1회)이 회귀 비용보다 낮다는 volt #23 실측 사례 근거.

### Notes

- Backward compatible (평문 보고를 JSON 반환으로 승격하는 변경은 sub-agent 호출 방식이 아닌 **반환 계약**만 바꾸므로 CLI/스킬 호출 인터페이스 파괴 없음)
- 근거: volt [#23](https://github.com/coseo12/volt/issues/23) [#24](https://github.com/coseo12/volt/issues/24) [#26](https://github.com/coseo12/volt/issues/26) (PR [#85](https://github.com/coseo12/harness-setting/pull/85))

## [2.6.3] — 2026-04-17

Gemini 교차검증 리포트 반영 — SemVer 정책 세분화.

### Changed

- **CLAUDE.md `### 릴리스` 세분화**
  - 에이전트 지시어·스킬 절차·체크리스트의 행동 변화는 **MINOR** 로 승격 (기존 일괄 PATCH 에서 분리)
  - PATCH 는 "행동 변화 없는 문서/문구/오타/버그 수정" 으로 한정
  - 판정 질문 추가: "이 변경으로 에이전트가 같은 입력에 다르게 동작하는가?"
- **CHANGELOG 작성 규칙**
  - MINOR/MAJOR 는 `### Behavior Changes` 섹션 필수
  - PATCH 도 frozen 파일(`.claude/`) 변경 시 `Behavior Changes: None — 문서/문구만` 명시 → 자동 업데이트 신뢰 모델 보호
- **README/CHANGELOG 상단 NOTICE** 블록 추가 — v2.6.2 정책 전환 소급 공지

### Behavior Changes

- **None — 문서/정책만**. 본 릴리스는 정책 문서만 갱신하며 에이전트·스킬의 실행 절차 자체는 변경 없음.
- 다음 릴리스부터 버전 분류가 새 기준으로 적용된다. 에이전트 지시어 변경이 포함된 커밋은 MINOR 로 올라가므로 체감상 마이너 버전 주기가 짧아질 수 있다.

### Notes

- Backward compatible
- 근거: Gemini 교차검증 피드백 (harness-setting PR #83)

## [2.6.2] — 2026-04-17

SemVer 분류 기준 명시 — 문서/규약 추가는 PATCH 로 확정.

### Changed

- **SemVer 분류 기준 명시** (CLAUDE.md 릴리스 섹션)
  - MAJOR/MINOR/PATCH 각 범주의 구체적 예시 명시
  - 볼트 반영/규약 추가는 기본 **PATCH** 로 확정
  - "규약 추가 = MINOR" 선례(v2.5.0~v2.6.0) 공식 폐기 — 패치성 변경 누적 시 과도한 버전 상승 유발

### Notes

- Backward compatible — 문서/규약만, 코드 동작 변화 없음
- 새 기준의 첫 적용 릴리스 (정책 변경 자체도 PATCH)

## [2.6.1] — 2026-04-17

volt #21 반영 — 신규 함수 작성 전 기존 유사 함수 탐색 규칙 추가.

### Added

- **신규 함수 ≠ 신규 구현** (volt [#21](https://github.com/coseo12/volt/issues/21))
  - CLAUDE.md 실전 교훈 섹션에 편향 경고 + 대응 절차 (Grep / `index.ts` export 훑기 / sunk cost 경계)
  - developer 에이전트 워크플로에 "기존 유사 함수 사전 탐색" 단계 주입 (번호 재정렬)

### Notes

- Backward compatible — 문서/규약 추가만, 코드 동작 변화 없음
- 스킵: volt #4 #5 #6 #8 #9 #10 #16 #18 #19 #20 — 프로젝트별 도메인 지식 또는 harness 기보유 콘텐츠

## [2.6.0] — 2026-04-16

volt #14 #15 #17 반영 — 에이전트 편향/벤치 함정/Stack PR 함정 가드 추가.

### Added

- **NO-OP ADR 패턴** (volt [#14](https://github.com/coseo12/volt/issues/14))
  - CLAUDE.md 실전 교훈(센티널): 인계 항목 실측 재검증 단락
  - architect 에이전트 절차에 "인계 항목 실측 재검증" 2단계 삽입
  - record-adr 스킬에 NO-OP ADR 변형 섹션 (`<YYYYMMDD>-<topic>-no-op.md`)
- **GPU ms 해석 주의** (volt [#15](https://github.com/coseo12/volt/issues/15))
  - run-tests 스킬 fps 벤치 섹션에 "GPU ms ≠ 시뮬 시간" 스니펫
  - fps / performance.now 기반 frame time을 주 기준으로 권장
- **Stack PR rebase + force-push 규약** (volt [#17](https://github.com/coseo12/volt/issues/17))
  - create-pr 스킬에 "Stack PR 주의" 섹션 (base 변경 후 rebase + `--force-with-lease` 절차)
  - append-heavy 파일(package.json, CHANGELOG.md) 충돌 다발 경고
  - `--force-with-lease` 를 `--force` 대신 사용 규칙 (CRITICAL #5 연계)

### Notes

- Backward compatible — 문서/규약 추가만, 코드 동작 변화 없음
- 스킵: volt #16 (WebGPU timestamp-query flag, 도메인 toolchain), #18 (URL 쿼리 옵트인, 웹 앱 특화)

## [2.5.0] — 2026-04-15

frozen/atomic 파일 update 충돌 회피용 선언적 오버라이드.

### Added

- **`.harnessignore`** — gitignore 스타일 glob 패턴으로 manifest 추적 제외 (volt #12)
  - `walkTracked` 단계에서 매칭 파일 제외 → `update --check` 출력에 노이즈 없음
  - 지원 문법: `*` `**` `?` 디렉토리 접미사 `/` `#` 주석. 미지원: `!` 네거티브
  - doctor 점검 항목 추가 (존재 시 패턴 수 표시)
- **docs/frozen-file-split.md** 갱신 — `.harnessignore` 사용법 우선 안내

### Notes

- Backward compatible: `.harnessignore` 파일 부재 시 동작 변화 없음
- 기존 manifest에 포함된 파일이 새로 ignore 되면 `harness update --bootstrap` 으로 재정렬

## [2.4.0] — 2026-04-15

1 사용자 + AI팀 모델 완성 + 지식 루프 실체화.

### Added

- **5 페르소나 + thin orchestrator** — `/pm` `/architect` `/dev` `/review` `/qa` `/next` (#66 #67 #68)
  - sub-agent 격리 호출, GitHub 이슈/PR 라벨이 SSoT
  - `.harness/policy.json` 정책 (auto/manual + force_review_on)
  - stage:* 라벨 6종 + `scripts/setup-stage-labels.sh`
- **페르소나 대시보드** — `/team-status` (#70)
- **PR 머지 → volt 자동 초안** — `/capture-merge` (#71) · Gemini 회고의 "마찰 없는 자동화" 1단계
- **지식 컴파일 규약 문서** — `docs/knowledge-compilation.md` (#72) · volt ↔ CLAUDE.md 양방향 컴파일 + 승격/강등 기준
- **슬래시 커맨드 인덱스** — `docs/commands-index.md` (#72) · 9개 명령 한눈에
- **fps 벤치 vsync 해제 flag 규약** — run-tests 스킬 (#73) · volt #11 반영

### Documentation

- README에 슬래시 커맨드 / 지식 컴파일 / 페르소나 가이드 링크 섹션
- `docs/agents-guide.md` Phase 1/2/3 완료 표시

## [2.3.0] — 2026-04-15

좀비 인프라 제거, 단일 npx 구조 정착.

### Removed

- `harness orchestrator`, `harness dispatch` 명령 — deprecation 메시지 + exit 1 (#69)
- `init` 시 `.harness/state.json` 생성 (11에이전트 슬롯) — 이슈/PR 라벨이 SSoT이므로 불필요
- 플러그인 모드 전체 (`plugins/`, `.claude-plugin/`, `docs/report-npx-vs-plugin.md`) (#65)

### Migration

- v2.2.0 → v2.3.0: 기존 사용자의 `state.json` → `state.json.deprecated` rename (안전)

## [2.2.0] — 2026-04-15

harness update 명령의 최종 조각 — 센티널 + 3-way merge + 마이그레이션.

### Added

- **update 명령** — `harness update` + `/harness-update` 슬래시 (#61 #62 #63 #64)
  - `--check` 비파괴 요약
  - `--apply-all-safe` / `--apply-frozen` / `--apply-pristine` / `--apply-added` 카테고리별 자동 적용
  - `--interactive` divergent/removed 파일별 [k/n/d/s] 프롬프트
  - `--dry-run` 시뮬레이션
  - `--apply-merge` atomic divergent 3-way merge (`git merge-file`)
  - 적용 후 매니페스트 자동 갱신
- **managed-block 센티널** — `<!-- harness:managed:<id>:start/end -->` 로 CLAUDE.md 소유 영역 분리. 외부 사용자 편집 보존.
- **마이그레이션 인프라** — `lib/migrations/<from>-to-<to>.js`. update 시 버전 불일치 자동 실행.
  - 2.1.0 → 2.2.0: CRITICAL DIRECTIVES + 실전 교훈 섹션 자동 wrap
- **record-adr 스킬** — ADR 표준 포맷 생성 (#60)
- **docs/decisions/, docs/retrospectives/** 시드 규약 (#60)
- **volt 지식 루프** — `/volt-review` 스킬 (#59)
- **에이전트 컴파일 지식** — CLAUDE.md 스프린트 계약 보강 / 모노레포 가드 / ADR 규약 / PR 템플릿 3단계 증거 (#59)

## [2.1.0] — 2026-04-12

초기 셋업 규칙 bypass 방지 가드.

## [2.0.0] — 2026-03-28

워크플로우 템플릿 전환.

[2.6.0]: https://github.com/coseo12/harness-setting/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/coseo12/harness-setting/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/coseo12/harness-setting/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/coseo12/harness-setting/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/coseo12/harness-setting/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/coseo12/harness-setting/compare/v2.0.0...v2.1.0
