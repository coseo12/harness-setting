# ADR: sub-agent 반환 JSON 런타임 variance 방어 — 메인 오케스트레이터 post-parse 가드 채택

- 날짜: 2026-04-22
- 상태: Accepted
- 관련 이슈/PR: [#184](https://github.com/coseo12/harness-setting/issues/184), v3.1.x PR (본 ADR)
- 선행 가드: `scripts/verify-agent-ssot.sh` (v2.23.0 #145 / v2.26.0 9필드 확장) — 정적 파일 drift 가드

## 배경

`scripts/verify-agent-ssot.sh` 는 `.claude/agents/*.md` 의 `## 마무리 체크리스트 JSON 반환` 섹션이 9개 코어 필드를 선언 순서대로 포함하는지 **정적 검증**한다. 그러나 **sub-agent 가 런타임에 실제로 반환하는 JSON** 이 9필드를 준수한다는 보장은 없다. 2026-04-20 한 세션에서만 3회 관찰된 실측:

| PR | 릴리스 | variance 패턴 |
|---|---|---|
| [#167](https://github.com/coseo12/harness-setting/pull/167) | v2.27.0 | 신규 2필드 (`spawned_bg_pids` / `bg_process_handoff`) 자체 누락 |
| [#170](https://github.com/coseo12/harness-setting/pull/170) | v2.28.0 | `null` / `null` — 규약 합치지만 파일 기본값 (`[]` / `"none"`) 과 이탈 |
| [#178](https://github.com/coseo12/harness-setting/pull/178) | v2.29.0 | 신규 2필드 자체 누락 (#167 패턴 재현) |

정적 가드 45/45 통과 + 런타임 variance — **정적 검증의 blindspot**. volt #57 "3회 이상 관찰 시 박제" 발동.

## 후보 비교

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| **A** — 메인 post-parse 헬퍼 | Agent tool 반환 직후 메인이 JSON 파싱 후 9필드 존재/타입/enum 검증 | 즉시 구현, 메인이 어차피 JSON 을 커밋 SHA / PR URL 추출 위해 파싱함 | sub-agent 프로세스 수정 아닌 사후 점검 | **Accepted** |
| B — jq schema + 헬퍼 스크립트 | `.claude/agents/schema/*.json` + `scripts/verify-agent-return-schema.sh` | 엄격한 타입·enum·required 검증 | **[ADR 20260420-jq-based-parsing-no-op](20260420-jq-based-parsing-no-op.md) 와 상충** — jq 의존성 재도입 | 기각 |
| C — 에이전트 프롬프트 자가 체크 | 각 에이전트 파일에 "JSON 반환 전 9필드 자가 체크" 단계 추가 | 인프라 불필요, 자연어로 해결 | **variance 의 원인이 LLM → self-check 도 같은 variance 에 노출**. 논리적 약점 | 기각 |
| D — A+B+C 3층 방어 | 3층 직교 방어 | 최고 robustness | 구현 비용 3배, jq NO-OP 상충 잔존 | 본 스프린트 범위 외 (필요 시 후속 이슈) |

## 결정

**후보 A 채택**. 근거:

1. **메인이 이미 JSON 파싱** — 커밋 SHA / PR URL / auto-close 상태 추출을 위해. 9필드 검증 추가 비용 미미
2. **ADR 20260420 정합성 유지** — jq 도입 회피, grep/sed/Node 파이프라인 연속성
3. **후보 C 의 논리적 약점 배제** — variance 원인 (LLM) 이 self-check 검증 주체와 동일하면 방어 효율 불확실
4. **즉시 가치 전달** — 실측 3회 variance 가 PATCH 수준 도구 1개로 재발 차단

## 구현 개요

### 도구
- `lib/verify-agent-return.js` — JSON 문자열 또는 파일 입력 받아 9필드 + 타입 + enum 검증. 결과 stderr 리포팅 + exit code
- `scripts/verify-agent-return.sh` — Node 호출 thin wrapper (shell 호출 호환)

### 9 코어 필드 검증 규약 (SSoT: CLAUDE.md `### sub-agent 검증 완료 ≠ GitHub 박제 완료` → Phase 3-A 에서 `docs/lessons/` 로 이동 가능성 있음. 현 유효 선언 위치는 CLAUDE.md 동일 블록)

| # | 필드 | 타입 | 허용 값 / 검증 |
|---|---|---|---|
| 1 | `commit_sha` | string\|null | SHA-ish (7+ hex) 또는 null |
| 2 | `pr_url` | string\|null | GitHub PR URL 또는 null |
| 3 | `pr_comment_url` | string\|null | URL 형식 또는 null |
| 4 | `labels_applied_or_transitioned` | array | stage:* 등 label 문자열 배열 (빈 배열 허용) |
| 5 | `auto_close_issue_states` | object | `{#N: "CLOSED"\|"OPEN"}` 맵 (빈 객체 허용) |
| 6 | `blocking_issues` | array | 문자열 배열 |
| 7 | `non_blocking_suggestions` | array | 문자열 배열 |
| 8 | `spawned_bg_pids` | array | 정수 배열 (빈 배열 허용) |
| 9 | `bg_process_handoff` | string | enum: `"main-cleanup"` / `"sub-agent-confirmed-done"` / `"none"` |

### variance 패턴 3가지 모두 커버
1. **필드 누락** → 해당 필드 stderr 에 명시 + exit 1
2. **`null` 과 기본값 이탈** (array 에 `null` 등) → 타입 검증 실패 + exit 1
3. **값 타입 불일치** (string 에 number 등) → exit 1

### 에이전트 프로세스 vs 메인 책임
- **에이전트 (sub-agent)**: 기존 `## 마무리 체크리스트 JSON 반환` 섹션 유지. 자가 체크 추가하지 않음 (후보 C 기각 이유)
- **메인 오케스트레이터**: sub-agent 반환 직후 본 도구 호출 → variance 감지 시 경고 출력 + 누락 필드 **수동 보완 박제** (자동 재호출 금지 — reviewer/qa 는 커밋/코멘트 idempotent 하지 않음)

### auto-recall 비목표 명시
variance 감지 시 sub-agent 자동 재호출 **금지**. 이유:
- reviewer 가 PR 코멘트를 생성하고 반환값에서 2필드 누락 시 재호출하면 코멘트 중복 박제
- qa 도 동일 (QA 증거 코멘트 중복)
- 메인이 **경고만 받고 수동 보완** (커밋 추가 / 코멘트 추가) 이 현실적 운영

## 결과·재검토 조건

### 즉시 기대
- 3 variance 패턴 중 1건이라도 재관찰 시 본 도구로 탐지 + stderr 리포트
- 기존 정적 가드 (`verify-agent-ssot.sh`) 역할 분리 — 파일 drift vs 런타임 반환

### 재검토 조건
다음 중 1건 이상 충족 시 본 ADR 재평가 + Amendment 박제:
- A 가 variance 탐지를 3회 이상 놓침 (B 또는 D 필요성)
- 메인 오케스트레이터가 도구 호출을 일관되게 수행하지 못함 (hook 자동화 필요 → 별도 infra 이슈)
- extends 필드의 복잡도가 커져 엄격 schema 필요 (B)
- jq 의 성능·생태계 여건 변화로 ADR 20260420 재평가

### 미래 확장 여지 (비-범위)
- **hook 기반 자동 트리거** — Claude Code PostToolUse hook 에 엮어 메인 수동 호출 부담 제거
- **extends 필드 에이전트별 schema** — architect 의 `cross_validate_outcome`, qa 의 `test_results` 등
- **감사 모드** — 과거 PR 의 merged sub-agent 반환값 소급 검증 + variance 통계

## 관련

- 원 이슈: [#184](https://github.com/coseo12/harness-setting/issues/184)
- 정적 가드: [scripts/verify-agent-ssot.sh](../../scripts/verify-agent-ssot.sh), 이슈 [#145](https://github.com/coseo12/harness-setting/issues/145)
- 선행 ADR: [20260420-jq-based-parsing-no-op.md](20260420-jq-based-parsing-no-op.md) (B 기각 근거)
- 관련 아키텍처: [docs/architecture/state-atomicity-3-layer-defense.md](../architecture/state-atomicity-3-layer-defense.md) §6 "해석자가 자동화 주체일 때 4번째 자동 매핑 층"
- 관찰 PR: [#167](https://github.com/coseo12/harness-setting/pull/167), [#170](https://github.com/coseo12/harness-setting/pull/170), [#178](https://github.com/coseo12/harness-setting/pull/178)
- 선행 volt: [#24](https://github.com/coseo12/volt/issues/24) (sub-agent 신뢰 한계) / [#55](https://github.com/coseo12/volt/issues/55) (Claude 편향) / [#57](https://github.com/coseo12/volt/issues/57) (3회 박제 규약)
