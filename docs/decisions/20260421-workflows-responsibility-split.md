# ADR: `.github/workflows/` 책임 분리 — harness-* vs user-only

- 날짜: 2026-04-21
- 상태: Accepted
- 관련 이슈/PR: [#196](https://github.com/coseo12/harness-setting/issues/196) — v3.0.0 MAJOR
- 선행 근거: volt [#62](https://github.com/coseo12/volt/issues/62) (astro-simulator PR #270 6단계 push-fail-fix 루프 실측)
- 관련 ADR: [ADR 20260419-gitflow-main-develop](20260419-gitflow-main-develop.md) (브랜치 전략 독립 운영)

## 배경

v2.31.0 까지 `.github/workflows/` 전체 디렉토리는 `lib/categorize.js:19` 에서 **`frozen`** 으로 분류됐다. 즉 `harness update --apply-all-safe` 가 해당 디렉토리 모든 yml 파일을 **upstream 으로 자동 덮어쓰기** 했다.

문제는 `ci.yml` 의 내용이 두 부류로 혼재돼 있었던 것이다:

1. **harness 고유 가드** (upstream 소유로 자동 전파돼야 정상):
   - `agent SSoT drift 가드` (#145)
   - `release version bump 가드` (v2.28.1~)
   - `CLAUDE.md 각인 예산 가드` / `상대 링크 무결성 가드` (#197 Phase 2)
2. **다운스트림 프로젝트의 빌드/테스트** (다운스트림이 자유롭게 수정해야 정상):
   - `detect-and-test` 잡: Node/Python/Go/Rust 자동 감지 + 실행

**결과: `ci.yml` 한 줄 upstream 개선만 있어도 파일 전체가 덮어쓰기 대상이 되어, 다운스트림의 `detect-and-test` 커스터마이즈가 매번 충돌.** astro-simulator PR #270 에서 v2.15.0 → v2.29.1 적용 과정 중 **6단계 push-fail-fix 루프** 로 실측 (volt #62):

1. `npm test` → `sh: pnpm: not found` (v2.28.2)
2. `pnpm test --if-present` → vitest "Unknown option" (v2.29.1)
3. `pnpm -r test` → `wasm-pack not found`
4. physics-wasm 제외 → shared dist 없음 → build 선행 필요
5. `pnpm -r build` 필터 → root.build 재귀로 physics-wasm 재포함
6. core build → `@astro-simulator/physics-wasm` 타입 의존 해결 불가

3 ~ 6 단계는 다운스트림 특수성 (WASM / 모노레포 빌드 순서) 에서 발생한 건데, ci.yml 이 frozen 이라 다운스트림이 CI 를 자유롭게 수정할 수 없었던 게 구조적 원인이었다.

### Concrete Prediction (구현 후 실증 목표)

1. 다운스트림 ci.yml 커스터마이즈 후 `harness update --check` 의 diff listing 에 ci.yml 이 등장하지 않는다 (0 라인)
2. upstream `harness-guards.yml` 에 신규 step 추가 → 다운스트림 `harness update --apply-all-safe` 로 자동 적용
3. 마이그레이션 반복 호출 → 2회차부터 파일 시스템 변경 0 (멱등성)

## 후보 비교

| 축 | **A. 파일 분리 (harness-*.yml vs ci.yml)** | B. 전체 user-only | C. Reusable workflow | D. 센티널 / AST 기반 부분 수정 |
|---|---|---|---|---|
| 구조적 명확성 | **최고** — 파일명 prefix 로 책임 경계 시각화 | 낮음 — 가드가 upstream 에서 소실됨 | 중 — 레포 간 참조 관계 복잡 | 낮음 — YAML 파서 필요, 규칙 애매 |
| 구현 비용 | 중 — categorize 수정 + 마이그레이션 1 개 | **최저** — categorize 1 라인 | 높음 — actions/workflow-dispatch 설계 + 권한 문제 | **최고** — YAML AST 파싱 로직 + 센티널 관리 |
| upstream 3중 방어 (가드 자동 전파) | **유지됨** | **파괴됨** — 각 다운스트림이 수동 복붙 | 유지되나 GitHub 인프라 의존 | 유지되나 복잡도 폭증 |
| GitHub Actions 런타임 동작 | 각 yml 독립 실행 (자연) | 동일 | 호출 체인 발생 (오버헤드) | 파일 하나지만 step 관리 복잡 |
| 다운스트림 학습 곡선 | 낮음 — 파일 분리 관습 | **낮음** | 중 — reusable workflow 개념 | 높음 — 센티널 개념 |
| 기존 다운스트림 호환 | 마이그레이션 1회 필요 | **심각** — 기존 가드 모두 소실 | 전면 재작성 | 센티널 도입에 사용자 수동 개입 필요 |
| 재검토 비용 | 낮음 — 되돌리기 쉬움 | 중 — 가드 복원 번거로움 | 높음 — 인프라 결합 | 높음 — 센티널 스펙 고정 |
| MAJOR 정당화 | **적절** — breaking 은 categorize 만 | 과소 — user-only 로 degrade | 과대 — 인프라 전면 변경 | 과대 — 복잡도 불균형 |

## 결정

**A. 파일 분리 — `harness-*.yml` (frozen) + 나머지 (user-only)** 를 채택한다.

### 실행 계획 (v3.0.0)

1. **`lib/categorize.js`** 규칙 수정: `.github/workflows/harness-` prefix → `frozen`, 나머지 → `user-only`
2. **`.github/workflows/harness-guards.yml`** 신규 생성 — 기존 ci.yml 말미 가드 블록 이동
3. **`.github/workflows/pr-review.yml`** → **`harness-pr-review.yml`** rename + 내부 `name:` 갱신
4. **`.github/workflows/ci.yml`** 말미 가드 블록 제거 (대체 안내 주석 삽입)
5. **`lib/migrations/2.31.0-to-3.0.0.js`** 신규 작성 — 기존 migrations 패턴에 자연 합류 (3단 매칭: 6a / 6b / 6c)
6. **`docs/harness-ci-migration.md`** — 6c 경로 수동 가이드
7. **`docs/frozen-file-split.md`** / **`docs/harness-update-compat-checklist.md`** 갱신

### 핵심 결정 (요약)

1. **파일 경계 = 책임 경계** — GitHub Actions 가 `.github/workflows/` 내 모든 yml 을 독립 workflow 로 실행하므로 파일 분리가 GitHub 인프라와 정합적
2. **마이그레이션 hook 은 `lib/migrations/` 편입** — 별도 `scripts/migrate-ci-split.js` 가 아닌 기존 migration 체인. dry-run 지원 + manifest 기반 조건 분기 재사용
3. **보수적 3단 매칭**:
   - 6a: 사용자 미수정 → 완전 덮어쓰기
   - 6b: `detect-and-test` 수정 + 가드 블록 byte-exact 원형 유지 → 블록만 제거
   - 6c: 가드 블록 자체 수정 → 스킵 + stderr 수동 가이드
4. **실패는 `exit 1` 금지** — notes 반환 + 원본 유지. `harness update` 전체 실패보다 부분 성공 + 명확 안내 우선 ([CLAUDE.md "매니페스트 최신 ≠ 파일 적용 완료"](../../CLAUDE.md) 교훈)
5. **백업** — `.harness/backup/ci-split-<ISO-timestamp>/` 에 원본 ci.yml + pr-review.yml 자동 보존

### 기각한 후보 상세

- **B. 전체 user-only** — upstream 가드의 3중 방어 (agent SSoT / release version bump / CLAUDE.md 가드) 자동 전파 포기. 각 다운스트림이 수동으로 복붙해야 하고 drift 위험. upstream 정당성 상실
- **C. Reusable workflow** — GitHub Actions `workflow_call` 은 레포 간 호출 가능하나 권한 경계 / 인프라 의존성이 커짐. 다운스트림이 harness-setting 레포에 대해 `actions: read` 권한을 가져야 하고, 레지스트리/버전 관리 별도 필요. MAJOR 비용 대비 이득 낮음
- **D. 센티널 / AST 기반 부분 수정** — YAML AST 파싱 의존성 + 센티널 관리 규약 / 정규식 한계 / 사용자 편집 허용 경계 모호. 복잡도 폭증 대비 파일 분리 대비 이득 없음

## 결과·재검토 조건

### 즉시 효과 (v3.0.0)

- **다운스트림 ci.yml 자유 수정** — WASM / 모노레포 빌드 순서 / 특수 도구 세팅 충돌 없이 가능
- **upstream 가드 자동 전파 유지** — harness-guards.yml 이 frozen 이므로 기존 3중 방어 정책 보존
- **기존 다운스트림 자동 마이그레이션** — `harness update` 1회 실행으로 3단 매칭 (6a/6b/6c) + 백업 + 수동 가이드
- **테스트 카운트**: +7 (fixture 기반 통합 테스트 7건)

### Concrete Prediction 재검증 (구현 PR 에서)

1. 다운스트림 ci.yml 커스터마이즈 → `harness update --check` 의 diff listing 0 라인
   → **검증 방법**: `test/ci-split-migration.test.js` 의 `customized-detect` fixture 에서 커스텀 라인 보존 확인 (통과)
2. upstream `harness-guards.yml` 신규 step 추가 → 다운스트림 `--apply-all-safe` 자동 적용
   → **검증 방법**: harness-guards.yml 이 frozen 카테고리임을 단위 확인 (`categorize` 테스트, 통과)
3. 마이그레이션 반복 호출 → 2회차부터 파일 시스템 변경 0
   → **검증 방법**: 멱등성 테스트 (snapshot diff 0, 통과)

### 재검토 트리거 (하나라도 해당 시 ADR 폐기 + 신규 결정 필요)

1. **6c 경로 발동 빈도 폭증** — 6개월 내 3+ 다운스트림에서 6c 경로가 발동되면 byte-exact 문자열 매칭이 실용적이지 않다는 증거. YAML AST 기반 부분 수정 (후보 D) 재평가 필요
2. **GitHub Actions reusable workflow 성숙** — `workflow_call` + `secrets: inherit` + 권한 모델이 단순해지면 파일 분리보다 상속 모델이 유리해질 가능성. 후보 C 재평가
3. **upstream 가드 자체가 파일 수준을 넘는 모듈화 요구** — 여러 guards 파일 (`harness-guards-ssot.yml`, `harness-guards-release.yml` 등) 로 분할하고 싶은 수요 발생. 현재는 단일 `harness-guards.yml` 로 충분하나 가드 수가 10+ 로 늘면 분할 검토
4. **사용자 요청으로 harness-* 충돌 허용 모드 필요** — 예: 특정 다운스트림이 `harness-guards.yml` 을 확장하고 싶을 때. `.harnessignore` 현행 메커니즘으로 충분한지 실측 후 결정

### 관측 지표

- **다운스트림 volt 이슈** 에 "harness update ci.yml 충돌" 관찰이 v3.0.0 이후 사라지는가
- **upstream `harness-guards.yml`** 변경 PR 이 다운스트림 CI 를 깨지 않고 자연 전파되는가
- 6c 경로 발동 수 (자동 통계 없음 — 다운스트림 수동 보고에 의존)

## 교차검증 메모

- **cross-validate outcome**: `applied` (Gemini 2.5 Pro, 정상 응답)
- **합의**: 후보 B/C/D 기각 논리 / 마이그레이션 실패 시 `exit 1` 대신 수동 가이드 / SHA 해시 보수적 매칭 + 백업
- **이견 수용**: `harness init` 의 `lib/copy-template.js` 재귀 복사 영향 명시 (코드 수정 없지만 영향 모듈 투명성)
- **기각**: 문서 업데이트 범위 확장 (skills-guide.md / agents-guide.md) — 실측 결과 해당 파일에 ci.yml 참조 없음
- **고유 발견 후속 분리**: 없음 — Gemini 가 범주 오류 / 암묵 전제 (reusable workflow, 리소스 비용 등) 를 지적하지 않음
- **Claude 편향 4종 셀프 체크**: 낙관일정 / 결합간과 / 폐기프레이밍 3축은 cross-validate 프롬프트에 명시 질문으로 삽입 후 통과. 순수주의 축은 fallback 경로 (6c 수동 가이드) 존재로 사전 통과
