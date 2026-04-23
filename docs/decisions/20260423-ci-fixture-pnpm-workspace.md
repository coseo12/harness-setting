# ADR: CI fixture `pnpm-monorepo` — 별도 job β + 의도적 regression + 최소 fixture 채택

- 날짜: 2026-04-23
- 상태: Accepted
- 관련 이슈/PR: [#190](https://github.com/coseo12/harness-setting/issues/190), 본 PR (설계 단계)
- 선행 ADR: [20260421-workflows-responsibility-split](20260421-workflows-responsibility-split.md) (`ci.yml` user-only 분류 / `harness-guards.yml` 분리)
- 스프린트 범위 제외: **WASM 확장 fixture** (이슈 본문 완료 기준 4번) — 후속 이슈로 분리

## 배경

harness-setting 자체는 **npm 단일 프로젝트**. CI `.github/workflows/ci.yml::detect-and-test` 가 pnpm / yarn / Python / Rust 경로를 **선언적으로 포함** 하지만, upstream 저장소의 구조상 해당 경로는 **평상시 실행되지 않음** (lock 파일 부재). 2026-04-20 세션에서 **upstream 에서는 초록, 다운스트림 astro-simulator#270 에서만 실패** 하는 연쇄 버그 3건이 관찰됨:

| 버전 | 버그 | upstream 감지 실패 원인 |
|---|---|---|
| v2.28.2 도입 시점 | `sh: 1: pnpm: not found` — pnpm 경로 부재 | upstream 에 `pnpm-lock.yaml` 없음 → pnpm step 건너뜀 |
| v2.28.2 직후 | `pnpm test --if-present` forwarding → vitest `Unknown option: --if-present` | 동일 — pnpm step 자체가 실행 안 됨 |
| v2.29.1 이후 | 범용 CI 가 WASM 모노레포 (core → physics-wasm 타입 의존) 처리 불가 | fixture 0건 |

공통 원인: **선언적 CI 경로가 fixture 없이 존재** — 3중 방어 (단위 테스트 / reviewer / cross-validate) 를 모두 통과해도 실측 환경이 없어 blindspot. `docs/lessons/ci-and-downstream-verification.md` 에서 "다운스트림 실측이 최종 가드" 로 일반화된 패턴의 직접 치료 대상.

### 문제 선언

**upstream CI 에 pnpm 경로를 실제로 실행하는 fixture 가 필요** — 최소 구조 (`@fixture/lib` dist-based exports + `@fixture/app` 소비) 로 v2.28.2 / v2.29.1 부류 regression 을 upstream PR 단계에서 차단.

## 후보 비교

축 3개 (CI job 구조 / fixture 유지 전략 / regression 실증 방식) 를 독립적으로 평가. 각 축 채택안 조합이 최종 결정.

### 축 (a) — CI job 구조

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| α — 단일 job 내 통합 | 기존 `detect-and-test` 에 fixture step 추가 | 구현 최소, 단일 job | (1) fixture 실패가 upstream 자체 테스트와 뒤섞여 원인 분리 어려움 (2) fixture 가 lock 파일 없는 repo 에서 pnpm 호출 → 기존 분기 조건 (`hashFiles('pnpm-lock.yaml') != ''`) 와 충돌 | 기각 |
| **β — 별도 `fixture-smoke-test` job** | 독립 job 으로 fixture 디렉토리 진입 후 pnpm install + test | (1) 격리 — 실패 로그가 "fixture regression" 으로 즉시 분류 (2) 향후 yarn / bun fixture 추가 시 같은 패턴 확장 (3) 실행 시간 병렬화 | job 하나 추가 (Actions 분 과금 소폭 증가) | **Accepted** |
| γ — matrix 전략 (pnpm × Node 버전) | `strategy.matrix` 로 다중 실행 | 매트릭스 확장성 | 현 시점 요구 (pnpm 단일 경로) 대비 overkill + 분 과금 N배 증가 | 기각 (후속 확장 여지로만) |

**결정 (a): β — 별도 job.** 이슈 본문 권장안과 일치. 기각된 α 의 근본 문제는 **실패 원인 분류 신호 소실** — fixture 가 upstream repo 테스트와 섞이면 다운스트림 관점 regression 을 "harness 자체 버그" 로 오진할 위험. β 는 job 이름 자체가 진단 신호 (`fixture-smoke-test (pnpm-monorepo)` 실패 = 다운스트림 경로 regression).

### 축 (b) — fixture 유지 전략

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| **최소 fixture (1개)** | `test/fixtures/pnpm-monorepo/` 만. lib (dist exports) + app 2 패키지 | (1) 유지 비용 최소 (2) 핵심 regression 3건 (`pnpm not found` / `--if-present` forwarding / dist-based exports 의존) 전부 커버 | 넓은 매트릭스 부재 (Node 버전별 / pnpm 버전별) | **Accepted** |
| 포괄 matrix (N개) | pnpm / yarn berry / yarn classic / npm workspaces × Node LTS 2~3개 | 광범위 coverage | (1) 유지 비용 N배 (pnpm/vitest 업그레이드 시 N개 동기화) (2) fixture 자체 버그 표면적 증가 (3) CI 분 과금 | 기각 |

**결정 (b): 최소 fixture.** 근거:
- **실측 3건 regression 전부 최소 구조에서 재현** — pnpm workspace + dist-based exports + vitest 가 공통분모. 매트릭스는 추가 커버리지 ≈ 0 대비 비용 N배
- 이슈 본문 비-범위 선언 ("Node.js pnpm 만 우선, 모든 매니저 매트릭스 금지") 과 일치
- 매트릭스 확장은 후속 이슈로 분리 (재검토 조건 참조)

### 축 (c) — regression 실증 방식

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| 의도적 red 커밋만 | 개발 PR 중 의도적 `pnpm test --if-present` 도입 → fixture job red 확인 → revert | 실제 CI 가 실패하는 live 증거 | red 증거가 PR 본문 링크에만 남음 → 미래 회귀 시 재실행 불가 | 기각 (단독으로는) |
| 유닛 테스트 가드만 | `test/ci-split-migration` 류로 ci.yml 의 fixture-smoke-test job 정의 존재 / script 명령 정규식 가드 | 영속적 / 빠름 | fixture **구조** 만 검증, **실행 자체 정상성** 은 미검증 | 기각 (단독으로는) |
| **의도적 red 커밋 + 유닛 테스트 가드 (둘 다)** | 개발 시 red 1회 실증 + 유닛 테스트로 fixture 파일 구조 / CI job 선언 영속 가드 | (1) 실행 정상성: red 커밋으로 증명 (2) 구조 영속성: 유닛 테스트로 ci.yml / fixture 디렉토리 drift 차단 (3) 서로의 blindspot 을 커버 | 구현 비용 소폭 증가 (유닛 테스트 1개 추가) | **Accepted** |

**결정 (c): 둘 다.** 이유: 두 방식은 **서로 다른 실패 모드** 를 방어. red 커밋은 "파이프라인 자체가 regression 감지 가능한가" (dynamic), 유닛 테스트는 "ci.yml / fixture 파일이 미래에 조용히 사라지지 않는가" (static). volt [#57](https://github.com/coseo12/volt/issues/57) "3회 이상 관찰 패턴 박제" + volt [#34](https://github.com/coseo12/volt/issues/34) "정적 가드의 blindspot" 의 결합 대응.

## 결정 (종합)

| 축 | 채택 |
|---|---|
| (a) CI job 구조 | **옵션 β** — 별도 `fixture-smoke-test` job |
| (b) fixture 유지 전략 | **최소 fixture** — `test/fixtures/pnpm-monorepo/` 1개 |
| (c) regression 실증 | **의도적 red 커밋 + 유닛 테스트 가드** 둘 다 |

### 최종 fixture 구조 (developer 인계)

```
test/fixtures/pnpm-monorepo/
├── .gitignore                # node_modules / dist (구조도 명시 — Gemini 교차검증 반영)
├── package.json              # packageManager: "pnpm@X", scripts.test: "pnpm -r build && pnpm -r test"
├── pnpm-workspace.yaml       # packages: ["packages/*"]
├── pnpm-lock.yaml            # fixture 전용 lockfile (frozen-lockfile 실행용)
└── packages/
    ├── lib/
    │   ├── package.json      # name: "@fixture/lib", main: "./dist/index.js", exports: { ".": "./dist/index.js" }
    │   ├── src/index.ts
    │   ├── tsconfig.json     # outDir: "./dist"
    │   └── vitest.config.ts  # 간단한 합산 함수 1개 테스트
    └── app/
        ├── package.json      # dependencies: { "@fixture/lib": "workspace:*" }, scripts.test: "vitest run"
        ├── src/index.ts
        ├── src/index.test.ts # import { fn } from "@fixture/lib" — dist 기반
        └── vitest.config.ts
```

### 최종 CI job 구조

```yaml
# .github/workflows/ci.yml 에 추가 (detect-and-test job 과 별도)
fixture-smoke-test:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      fixture: [pnpm-monorepo]  # 향후 확장 지점 (yarn-monorepo 등)
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
        cache-dependency-path: test/fixtures/${{ matrix.fixture }}/pnpm-lock.yaml
    - name: fixture install + test
      working-directory: test/fixtures/${{ matrix.fixture }}
      run: |
        pnpm install --frozen-lockfile
        pnpm run --if-present test
```

### 스프린트 완료 기준 (측정 가능)

- [ ] `test/fixtures/pnpm-monorepo/` 디렉토리 존재 + 최소 7 파일 (`package.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml` / `packages/lib/{package.json,src/index.ts}` / `packages/app/{package.json,src/index.test.ts}`)
- [ ] `@fixture/lib` dist-based exports 로 `@fixture/app` 에서 import 가능 — fixture 디렉토리에서 로컬 `pnpm install && pnpm run test` 통과 (developer 검증)
- [ ] `.github/workflows/ci.yml` 에 신규 `fixture-smoke-test` job 추가 — `pnpm install` + `pnpm run --if-present test` 실행
- [ ] 의도적 regression 커밋으로 job red 증명 (예: fixture root `scripts.test` 를 `pnpm -r test --if-present` 로 변경 → vitest `Unknown option` 실패 → revert). PR 본문에 실패 Actions 링크 박제
- [ ] 유닛 테스트 1개 추가 — `test/ci-split-migration/fixture-smoke-test.test.js` (이름 예시). ci.yml 에 `fixture-smoke-test` job 선언 + 최소 fixture 파일 존재 정규식 가드
- [ ] `docs/harness-update-compat-checklist.md` 체크리스트 1~2 항목 (모노레포 재귀 호출 / dist-based exports) 이 fixture 로 실측 검증됨을 상호 참조 추가 (양방향 링크)
- [ ] **(필수 보안 가드)** `package.json::files` 에 `test/` 가 포함되지 않음을 실측 확인 + **유닛 테스트 1개 추가** (`package.json::files` 배열에 `test` / `test/` 접두어 문자열 부재 검증). 현재 `bin/`, `lib/`, `.claude/`, `.github/`, `docs/`, `scripts/`, `CLAUDE.md`, `README.md` 만 — fixture 유출 없음. 재발 방지를 위해 자동 테스트로 영속 가드 (Gemini 교차검증 권고 격상)
- [ ] (DX) 루트 `package.json::scripts` 에 `test:fixture` 추가 (`cd test/fixtures/pnpm-monorepo && pnpm install && pnpm test` 류) — 로컬 개발자가 fixture 단독 실행 가능 (Gemini 교차검증 반영)
- [ ] CHANGELOG `v3.2.0` 엔트리 추가 — `### Behavior Changes` 섹션 포함 (MINOR 분류 근거 박제)

### 테스트 ROI 5문 체크 (CLAUDE.md 스프린트 계약 §6)

| 질문 | 답변 |
|---|---|
| fixture 구축 비용이 검증 대상 코드 라인의 5배 이상? | fixture ~50 라인 / ci.yml ~15 라인 = 보호 대상 **ci.yml 분기 4~5개 (pnpm 경로 전체) + downstream 부합 보장** → ROI 충분 |
| 몇 줄을 보호하는가? | pnpm step 4개 (setup / install / test 분기) + 하위 7개 축의 부합성 (lock fingerprint 경로 / frozen-lockfile / dist exports 의존). 조용한 퇴행 시 **다운스트림 전체 부서짐** (v2.28.2 사례) |
| 회귀 시 조용히 퇴행 vs 빌드 실패? | **조용한 퇴행** — fixture 없으면 upstream 은 초록이고 다운스트림만 빨강. 전형적 감지 지연 패턴 → fixture 필수 |
| 인접 유닛 테스트 / 타입 가드로 간접 보증 가능? | 부분적만 — `test/ci-split-migration/` 류 유닛 테스트는 **파일 존재 / 명령 정규식** 만 가드. **실제 pnpm 실행 여부** 는 실행 환경 없이 검증 불가. 결정 (c) 에서 **둘 다 채택** 으로 해소 |
| 미래 인프라 구축 후 저렴해지는가? | 반대 — **지금 박제가 최저 비용**. 다운스트림 버그가 1건 더 발생할 때마다 fixture 없이 디버깅하는 비용이 fixture 유지 비용을 수 배 상회 |

결론: **fixture + 의도적 regression + 유닛 가드 3중 박제가 ROI 정당화**. 단, matrix 확장은 ROI 미달 (현 시점).

## 결과·재검토 조건

### 즉시 기대

- v2.28.2 / v2.29.1 부류 regression 이 upstream PR 단계에서 차단 (fixture job red = 머지 차단)
- `docs/harness-update-compat-checklist.md` 체크 항목 1~2 가 fixture 로 **실측 연결** — 문서와 실행 간 drift 차단
- 다운스트림 (astro-simulator / 추후 Node.js 모노레포 프로젝트) 에서 upstream 의 pnpm 경로에 대한 신뢰도 증가

### 재검토 조건 (다음 중 1건 이상 충족 시 본 ADR Amendment 또는 후속 ADR)

1. **fixture 유지 비용 정량화 실패** — pnpm / vitest / TypeScript 업그레이드마다 fixture 동기화 비용이 월 3시간 이상 (= 유지 실패 신호. matrix 축소 또는 fixture 자동 생성 도구 검토)
2. **fixture 자체 버그로 false negative** — regression 발생했는데 fixture 가 초록이었던 사례 관찰 시 즉시 재평가 (축 c 의 유닛 가드 실패 모드)
3. **다운스트림에 yarn / bun / npm workspaces 프로젝트 출현** — 당시 해당 fixture 추가를 후속 이슈로 분리 (축 b 매트릭스 확장 트리거). 단, **동일 구조 3회 이상 관찰** 기준 적용 (volt #57)
4. **WASM 후속 이슈 완결** — 이슈 본문 완료 기준 4번 (WASM fixture) 이 별도 이슈로 처리됐는지 확인 후 본 ADR 과 상호 링크
5. **`ci.yml` 의 pnpm 경로 분기 로직 대규모 변경** — 본 fixture 가 가드하는 대상 코드 자체가 구조 변경되면 fixture 도 동기 재설계 필요
6. **Actions 분 과금 증가가 허용 기준 초과** — 현재 예상 job 실행 시간 ~2분 (install 90s + test 30s). 5분 초과 지속 시 matrix 축소 / cache 전략 강화 검토

### 비-범위 (후속 이슈 여지)

- **WASM 확장 fixture** — 이슈 본문 완료 기준 4번. 본 ADR 에서 분리. draft 이슈로 분리 검토 (위험 섹션 참조)
- **matrix 확장 (yarn / bun / npm workspaces)** — 재검토 조건 #3 트리거 시
- **hook 자동화** — 다운스트림 clone 직후 fixture 동작 검증 스크립트
- **fixture 자체의 유닛 테스트** — fixture 안의 lib 함수 자체 회귀 테스트 (fixture 안정성 ≠ fixture 검증 대상)

## 위험 / 미해결 항목

### 1. fixture 유지 비용 (정량화 시도)

- pnpm major 업그레이드: 6~12개월에 1회 (최근 pnpm 9 → 10 전환 주기)
- vitest major: 12~24개월에 1회
- TypeScript major: 12~24개월에 1회
- **예상 유지 비용**: 연 1~2회 fixture 업그레이드 (각 30분 ~ 2시간). 허용 범위 내로 판단하나 **재검토 조건 #1** 로 정량 모니터링

### 2. `package.json::files` 누수 가드 (중요)

- 현재 `package.json::files` = `["bin/", "lib/", ".claude/", ".github/", "docs/", "scripts/", "CLAUDE.md", "README.md"]` — `test/` **미포함**. 다운스트림 `harness update` 에 fixture 유출 없음 (확인 완료)
- developer 구현 시 이 필드를 **절대 수정 금지** (스프린트 비-범위). 유닛 테스트 가드에 `test/` 가 `files` 에 **포함되지 않음** 을 검증하는 항목 추가 권장

### 3. harness 저장소 크기 증가

- 예상 증가: fixture 디렉토리 ~50 KB (소스) + `pnpm-lock.yaml` ~200~500 KB = **최대 550 KB**
- `node_modules` 는 `.gitignore` 로 제외 (fixture 디렉토리의 `.gitignore` 필요 — developer 단계 체크)
- 허용 기준: **저장소 tarball 크기 10 MB 미만 유지** (현재 ~2 MB → 2.5 MB 예상). 수용 가능

### 4. WASM fixture 분리 이슈 드래프트

- 제목: "CI fixture: WASM 모노레포 opt-out 검증 fixture 추가"
- 본문 요약: `test/fixtures/pnpm-wasm-monorepo/` 추가 — `wasm-pack` 미지원을 명시적 skip 경로로 검증 (`docs/harness-update-compat-checklist.md` 옵션 A). WASM 빌드 도구가 CI 에 없을 때 **조용히 skip** 이 정상 동작임을 fixture 로 실측
- 드래프트 생성 여부: **본 sub-agent 에서 생성 보류** (메인 오케스트레이터 판단 대기). 이슈 #190 comment 에 draft 템플릿 포함 (사용자가 별도 sprint 로 분리할 때 즉시 사용)

### 5. fixture 내 lockfile frozen 운영

- `pnpm install --frozen-lockfile` 이 실패하면 CI red. fixture 의 `package.json` 의존성을 바꾸면 lockfile 도 동기 업데이트 필수
- developer 체크리스트에 "fixture 의존성 변경 시 lockfile 재생성 + 커밋" 명시

### 교차검증 반영 사항

박제 직후 Gemini 1회 교차검증 수행 (`cross_validate.sh architecture <본 ADR>`). outcome=applied, exit 0. Claude 편향 4종 셀프 체크 통과 (낙관적 일정: 재검토 #1 정량 모니터링 / 결합 간과: 5개 위험 명시 / 폐기 프레이밍: 없음 / 순수주의: 의도적 red + 유닛 가드 실용 결합).

- **합의 (즉시 반영)**:
  - `.gitignore` 를 최종 fixture 구조도에 명시 (기존 위험 #3 만 언급 → 구조도에도 박제해 구현 누락 차단)
  - 루트 `package.json::scripts` 에 `test:fixture` 추가 — 로컬 DX 개선 (완료 기준에 추가)
- **이견 수용 (권고 격상)**:
  - 원안: "유닛 테스트 가드에 `test/` 가 `files` 에 포함되지 않음 검증 항목 추가 **권장**"
  - 수정: "**필수 보안 가드**" 로 격상 + 자동 테스트 영속 가드 명시. 근거: 다운스트림 `harness update` 로 fixture 가 유출되면 다운스트림 저장소 크기 급증 + 선언되지 않은 경로 포함 리스크. Gemini "매우 중요한 가드, 실수로라도 발생해서는 안 될 문제" 지적 수용
- **Claude 재분석으로 기각한 Gemini 제안**:
  - `CONTRIBUTING.md` 에 lockfile 재생성 규칙 추가 — 현 저장소에 `CONTRIBUTING.md` 부재. 위험 #5 박제 위치 (ADR 본문) 로 충분 + ADR 이 곧 SSoT. 별도 기여 문서 신설은 범위 밖
- **고유 발견 (후속 분리)**:
  - 없음 (Gemini 제안 모두 본 ADR 스프린트 범위 내에서 처리 가능)

## 관련

- 원 이슈: [#190](https://github.com/coseo12/harness-setting/issues/190)
- 상위 원칙 교훈: [docs/lessons/ci-and-downstream-verification.md](../lessons/ci-and-downstream-verification.md) — "다운스트림 실측이 최종 가드"
- 다운스트림 사전 체크리스트: [docs/harness-update-compat-checklist.md](../harness-update-compat-checklist.md) — 본 fixture 의 쌍둥이 (사전 체크 ↔ 사후 실증)
- 선행 ADR: [20260421-workflows-responsibility-split](20260421-workflows-responsibility-split.md) — `ci.yml` user-only 분리로 본 fixture job 추가가 upstream 단독 결정 가능
- 관찰 release: [v2.28.2 ~ v2.29.1](https://github.com/coseo12/harness-setting/releases) — 본 fixture 가 사전 감지했어야 할 연쇄 버그
- 선행 volt: [#64](https://github.com/coseo12/volt/issues/64) (원안) / [#62](https://github.com/coseo12/volt/issues/62) (체크리스트 쌍둥이) / [#59](https://github.com/coseo12/volt/issues/59) (셀프 위반 실증) / [#60](https://github.com/coseo12/volt/issues/60) (상위 원칙)
