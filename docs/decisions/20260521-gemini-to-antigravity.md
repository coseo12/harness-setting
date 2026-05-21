# ADR: cross-validate 외부 검증 백엔드 `gemini-cli` → Antigravity (`agy`) 교체

- 날짜: 2026-05-21
- 상태: **Proposed** (사용자 검토 대기)
- 관련 이슈/PR: #267 (트래킹) / #268 (Phase 0) / #269 (Phase 1A) / #270 (Phase 2) / #271 (Phase 3) / #272 (Phase 4)
- 관련 기획서: [../plans/antigravity-migration.md](../plans/antigravity-migration.md)
- 선행 ADR/박제:
  - CLAUDE.md §교차검증 — 단일 모델 편향 노출의 의의
  - [docs/guides/cross-validate-protocol.md](../guides/cross-validate-protocol.md) — 호출 매트릭스 / 박제 위치 우선순위
  - 가드 #479 (plan-mode 우회 자동 감지 + 자동 롤백) — `.claude/skills/cross-validate/scripts/cross_validate.sh`
- 스프린트 범위 제외 (CRITICAL #6 비목표):
  - Gemini vs Antigravity 응답 품질 벤치마크 (별도 후속)
  - 다중 외부 검증 백엔드 동시 채택 (별도 ADR)
  - cross-validate 호출 정책 변경 (현 정책 유지)

## 배경

사용자 보고 (2026-05-21): "Gemini CLI 지원 종료는 **2026-06-18** (본 ADR 작성 기준 28일 / 4주 여유)". Google 의 후속 제품 **Antigravity** 가 동일 인프라 (`~/.gemini/config/`, OAuth Code Assist 백엔드) 를 재사용하면서 `agy` CLI 와 antigravity.google 워크스페이스를 통합 제공한다. 사용자 환경에는 이미 `agy@1.0.0` 이 설치·인증 완료 상태.

본 저장소의 Gemini 박제는 **43 파일 / 334 라인** 에 걸쳐 있으며, 단 한 곳 (`.claude/skills/cross-validate/scripts/cross_validate.sh`) 만 실제 명령을 호출한다. 나머지는 (a) 스킬·에이전트 행동 박제 (b) 테스트 mock (c) CLAUDE.md / 회고 / 가이드 / 과거 ADR 의 역사적 인용. 따라서 **단순 find-replace 가 아니라 (1) 코드 어댑터 교체 (2) 스킬·에이전트 동기화 (3) 문서 batch update (4) 가드 #479 재설계** 4 트랙으로 분해된다.

### 문제 선언

**cross-validate 스킬이 (a) 외부 검증 백엔드 유지 (b) 자동화 단절 없음 (c) plan-mode 우회 가드 등가 보호 유지** 라는 3 조건을 모두 충족하는 백엔드 전환 경로가 필요.

## 후보 비교

축 3개 (백엔드 선택 / 마이그레이션 속도 / 권한 가드 모델) 를 독립 평가.

### 축 (a) — 외부 검증 백엔드 선택

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| α — gemini-cli 유지 | 종료 시점까지 그대로 사용 | 변경 0 | (1) 사용자 보고 종료 임박 (2) 종료 시점 자동화 단절 (3) 박제 drift 시간 누적 | 기각 — 종료 트리거 |
| **β — Antigravity (`agy`) 단독 채택** | gemini-cli 호출부를 agy 로 교체 | (1) Google 공식 후속 (2) `-p` headless 호환 (실측) (3) 인증·토큰 자동 마이그레이션 (4) 사용자 이미 설치 완료 | (1) 모델 옵션 없음 — 백엔드 위임 (2) `--approval-mode plan` 등가 부재 (3) closed source (4) CI 비대화 인증 미확인 | **Accepted** |
| γ — Claude CLI 또는 OpenAI CLI 로 전환 | 다른 벤더 CLI 채택 | (1) 단일 모델 편향 노출 의의 유지 (2) 벤더 다양성 | (1) 신규 의존성 + 신규 인증 + 신규 API 정책 학습 비용 (2) 본 기획 §2.2 비목표 ("다른 외부 모델 동시 채택") 와 상충 — 단일 백엔드 1:1 교체로 한정한다는 합의 위배 (3) 사용자 트리거가 Antigravity 특정 | 기각 — 비목표 |
| δ — cross-validate 자체 폐지 + Claude self-critique 강화 | 외부 검증 제거 | (1) 단순화 (2) 비용 0 | (1) **단일 모델 편향 노출** 의의 포기 — CRITICAL DIRECTIVE 박제 직후 1회 루틴이 가드를 잃음 (2) volt #51 의 단일 모델 자기검증 한계 사례 무시 | 기각 — CRITICAL #6 와 상충 |

**결정 (a): β — Antigravity (`agy`)**. 사용자 트리거 + 인프라 호환 + headless 가능 (실측) 의 3박자.

### 축 (b) — 마이그레이션 속도 / 분할 전략

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| α — 단일 PR (43 파일 일괄) | 코드 + 스킬 + 에이전트 + 문서 동시 교체 | 1회 머지로 종료 | (1) PR 거대화 → reviewer 부담 (2) 역사적 인용 (volt 이슈 인용 등) 일괄 교체 시 출처 추적 단절 (3) 부분 실패 시 롤백 비용 큼 | 기각 |
| **β — 4 Phase 분할** | Phase 1A (코드 + 테스트 + SKILL.md 일부, MAJOR) → Phase 2 (5 agents 행동 박제, MINOR) → Phase 3 (문서 batch, PATCH) → Phase 4 (gemini-cli 제거, MINOR) | (1) 각 Phase backward-compat (Phase 1A 만 배포돼도 동작) (2) reviewer 분산 (3) 역사적 인용 보존·교체 판정을 Phase 3 에서 1 PR N 파일 묶음으로 신중 처리 (4) CHANGELOG `### Behavior Changes` 가 각 단계별로 명확 | Phase 분리 리듬 (CLAUDE.md §릴리스) 의 3 조건 (backward-compat / 완결 BC 집합 / 사용자 동의) 충족 시에만 유효 | **Accepted** (사용자 동의 전제) |
| γ — Phase 2 + Phase 3 통합 (MINOR 1회) | 행동 박제 + 문서 batch 를 한 PR 로 | PR 수 절약 | (1) 행동 변경과 문서 변경이 섞이면 `### Behavior Changes` 가시성 저하 (2) reviewer 부담 부분 회귀 | 기각 (PR 수 절약은 가치 작음) |

**결정 (b): β — 4 Phase 분할**. 사용자 동의는 본 ADR 검토 단계에서 확정.

### 축 (c) — 권한 가드 모델 (plan-mode 우회 가드 #479 재설계)

gemini 의 `--approval-mode plan` 은 도구 호출 자체를 차단했지만 agy 에는 등가 옵션이 없다.

| 후보 | 내용 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| α — `--sandbox` 단독 의존 | agy 의 `--sandbox` 옵션이 충분히 안전하다고 가정 | 가장 단순 | `--sandbox` 의 정확한 보호 범위 미확인 (Phase 0 Q-7 실측 필요). 터미널 제한 ≠ 파일 시스템 제한 | 후보 (Phase 0 결정 후 확정) |
| **β — `--sandbox` + 사후 snapshot diff 강화** | sandbox 채택 + 기존 #479 의 워킹트리 snapshot 비교 + 자동 롤백 메커니즘 강화 | (1) 사전 차단 + 사후 검증 이중화 (2) 기존 가드 자산 재활용 (3) sandbox 의 미확인 영역을 snapshot diff 가 보강 | snapshot diff 의 false negative 위험 (e.g. 가드 자체 우회 시도) — 기존 가드도 동일 한계 | **Accepted** (Phase 0 후 sandbox 동작 실측으로 정확한 옵션 조합 결정) |
| γ — agy 호출 시 별도 워크스페이스 디렉토리 분리 | `--add-dir` 으로 임시 디렉토리만 노출 | 가장 강력한 격리 | (1) 우리 호출은 프롬프트만 전달하고 파일 컨텍스트는 stdin 으로 주입하는 패턴이므로 워크스페이스 자체가 검증 대상이 아님 (2) 구현 복잡도 증가 | 기각 — 과잉 |

**결정 (c): β — `--sandbox` + 사후 snapshot diff 강화**. 정확한 sandbox 옵션 형태와 차단 범위는 Phase 0 Q-7 실측 후 확정.

## 결정

**β + β + β 조합**:

1. cross-validate 외부 검증 백엔드를 **Antigravity (`agy`)** 단독으로 교체한다 (Gemini 제거)
2. 마이그레이션은 **Phase 1A (MAJOR) → 2 (MINOR) → 3 (PATCH) → 4 (MINOR, 옵션)** 4 단계로 분할한다
3. plan-mode 우회 가드 (#479) 는 **`--sandbox` + 사후 snapshot diff 강화** 의 이중 가드로 재설계한다 — 정확한 옵션 조합은 Phase 0 Q-7 실측 후 결정

### 변경 요약 (Phase 1A 기준)

| 파일 | 변경 |
|---|---|
| `.claude/skills/cross-validate/scripts/cross_validate.sh` | `gemini` → `agy` 호출, `GEMINI_MODEL` 환경변수 제거, `--approval-mode plan` → `--sandbox` (Q-7 결정 반영), 함수 이름 도구 중립화 |
| `test/cross-validate-fallback.test.js` 등 7 파일 | mock 바이너리 이름 변경, sentinel 문자열 동기화 |
| `.claude/skills/cross-validate/SKILL.md` | description / 설치 확인 명령 / 호출 예제 4종 / 분석 §0 / 보안 노트 갱신 |
| CHANGELOG `### Behavior Changes` | MAJOR 호환성 노트 추가 (다운스트림 필수 조치 명시) |

Phase 2~4 의 상세는 기획서 §5 참조.

## CRITICAL 박제 (단일 모델 편향 가드 유지)

본 결정은 **백엔드만 교체** 하며 **단일 모델 편향 노출의 의의는 그대로 유지** 한다 (후보 δ 기각 근거). CLAUDE.md §교차검증 의 다음 원칙은 변하지 않는다:

- 박제 직후 1회 루틴 (CRITICAL DIRECTIVE 개정 / ADR 신규·중대 개정 / MINOR 이상 Behavior Changes / 프로젝트 원칙 선언 직후)
- API capacity 폴백 프로토콜 + `claude-only analysis completed` 박제
- Claude 자체 편향 4종 셀프 체크
- 수용 전 실측 sanity check (volt #66)
- 외부 툴 동작 주장은 실측 필수
- 고유 발견은 스프린트 비목표와 대조
- plan-mode 우회 자동 가드 (#479)

용어상 "Gemini" 가 "Antigravity (`agy`)" 로 바뀌어도 가드의 의미는 동일. 다만 본 결정으로 **단일 벤더 (Google) 의존** 이 더욱 강화된다는 점은 명시한다 (γ 기각 근거의 trade-off).

## 결과 / 재검토 조건

### 예상 결과
- cross-validate 자동화가 Antigravity 종료 시까지 지속
- `agy` 의 자동 마이그레이션 (gemini-cli 인프라 재사용) 으로 사용자 측 추가 설정 비용 최소
- 다운스트림은 `harness update` + `agy` 설치 + OAuth 로그인 의 3 단계로 호환

### 재검토 조건 (어느 하나 트리거 시 본 ADR 재검토)
1. **Phase 0 Q-7 실측에서 `--sandbox` 가 파일 시스템 수정 차단을 보장하지 못함** → 축 (c) 재선택 (γ 워크스페이스 분리 또는 별도 격리 메커니즘)
2. **Antigravity 응답 품질이 cross-validate 가치를 무력화할 정도로 저하** (예: 매번 동일 generic 응답, 코드 컨텍스트 무시) → 후보 γ (다른 CLI) 재고
3. **확인된 마감일 2026-06-18 기준 Phase 1A 가 6월 11일까지 미완료** → 응급 우회 (gemini-cli 명령을 stub `agy` 호출로 alias) 검토
4. **Antigravity 가 유료 전환 또는 GCP 결제 강제** → 비용 평가 + 후보 γ (다른 무료 CLI) 재고. 본 ADR 의 §2.2 비목표 (다중 백엔드) 와 trade-off 재검토
5. **다운스트림 1 곳 (예: astro-simulator) Phase 1A 머지 후 실측 실패** → 즉시 hotfix 또는 release revert
6. **Antigravity 가 closed source 인 점 + 단일 벤더 의존 심화가 정책상 허용되지 않는다는 사용자 결정** → 후보 γ (다른 CLI) 재평가

## 부록: 실측 로그 발췌 (2026-05-21)

```
$ agy --version
1.0.0

$ agy -p "hello"
Hello! I am Antigravity, your AI pair programming assistant.
How can I help you today? ...

$ echo $?
0
```

`agy --help` 전체는 기획서 §1.3 참조.

## 박제 위치

- 본 ADR — `docs/decisions/20260521-gemini-to-antigravity.md` (현 파일)
- 기획서 — `docs/plans/antigravity-migration.md` (Phase 카탈로그)
- 향후 PR 본문 — Phase 별 PR 의 `## 결정 근거` 에 본 ADR 링크 인용
- CHANGELOG `### Behavior Changes` — Phase 1A / 2 / 4 각각 별도 entry
- (검토 후 결정) CLAUDE.md §교차검증 — "Gemini" 명시 부분을 "외부 검증 모델 (현재 Antigravity `agy`)" 로 일반화 — Phase 2 또는 3 에서 처리
