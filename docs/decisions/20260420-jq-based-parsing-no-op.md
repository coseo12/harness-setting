# ADR: `parse-cross-validate-outcome.sh` jq 기반 전환 — NO-OP

- 날짜: 2026-04-20
- 상태: Accepted (NO-OP)
- 관련 이슈/PR: [#141](https://github.com/coseo12/harness-setting/issues/141) · 선행 PR [#140](https://github.com/coseo12/harness-setting/pull/140) (v2.21.0, Phase B)
- 선행 ADR: 없음 (cross-validate 파이프라인 관련 결정은 별도 ADR 없이 CLAUDE.md `## 교차검증` 섹션에 박제되어 있음)

## 배경

PR #140 Gemini 교차검증이 `scripts/parse-cross-validate-outcome.sh` 의 `grep`+`sed` 기반 JSON 파싱을 "장기 안정성" 관점에서 `jq` 로 전환할 것을 제안했다 (Gemini 고유 발견, **주의** 판정). CLAUDE.md `## 교차검증` 3단 프로토콜에 따라 현재 스프린트 비목표("의존성 추가 없음") 와 상충해 후속 이슈 #141 로 분리된 상태였다.

착수 시점에 실측으로 전제를 재검증한 결과 — **아직 jq 전환이 정당화되는 실측 근거가 없음** 을 확인. CLAUDE.md "인계 항목 실측 재검증 — NO-OP ADR 패턴" 적용 대상.

### 실측 상태

- write 측 `cross_validate.sh::json_escape()` 가 `\` / `"` / 개행 (`\n`) / 캐리지리턴 (`\r`) / 탭 (`\t`) 을 모두 JSON 규격대로 이스케이프 (cross_validate.sh:56-69) — 생성된 outcome JSON 자체는 유효 JSON (`JSON.parse` round-trip 완전 성립, 경계 가드 혼합 케이스에서 증명)
- parse 측 헬퍼 (parse-cross-validate-outcome.sh:88-96) 의 `grep -o` 패턴은 escape 된 `\` / 탭 / 개행 / CR 을 안전하게 보존 (경계 가드 5/5 케이스 통과)
- 해당 헬퍼가 consume 하는 outcome JSON 은 **오직 cross_validate.sh 가 생성** 하는 통제된 입력 (헬퍼 파일 주석 라인 81-87 에 이 계약이 명문화)
- v2.19.0 ~ v2.21.0 (3개 릴리스 / 47/47 통과) 에 걸친 실제 파이프라인 사용 중 파싱 실패 관찰 **0건**

### 알려진 한계 (parse 헬퍼 정규식 계약)

본 NO-OP 결정의 정직한 박제 — 이 한계가 실측 실패로 전환되는 순간이 곧 재검토 트리거.

- **parse 측 `grep -o "\"${key}\": *\"[^\"]*\""` 는 escape 된 `\"` 를 해석하지 못한다** — 값에 raw double-quote (`"`) 가 포함되면 첫 escaped quote 앞에서 조기 종료해 값이 잘림 (경계 가드 테스트 설계 중 실측 확인)
- 단, write 측 `json_escape()` 가 생성하는 **JSON 파일 자체는 유효** — `JSON.parse` 로는 완전 복원됨. 문제는 오직 grep/sed 기반 parse 헬퍼의 추출 단계에 국한
- 실 사용 필드 값 범위 (2026-04 기준):
  - `anchor` = `CROSS_VALIDATE_ANCHOR` enum (`MINOR-behavior-change` / `ADR-new-or-amendment` / `CRITICAL-directive-revision`) — raw `"` 없음
  - `pr_ref` = PR 번호 또는 URL — raw `"` 없음
  - `log_file` = 파일 경로 (공백/한글 가능) — raw `"` 없음
  - `context` = `TYPE` enum + 선택적 `TARGET` (PR 번호/파일 경로) — raw `"` 없음
  - `reminder_issue` = enum (`none` / `dryrun` / `created` / `create-failed`) — raw `"` 없음
  - `outcome` = enum (`applied` / `429-fallback-claude-only` / `fatal-error`) — raw `"` 없음
- **따라서 현재 값 범위에서 실측 파싱 실패 0건은 우연이 아니라 구조적** — 필드 값이 `"` 를 포함할 수 없는 enum/경로/번호로 제한되어 있기 때문. 이 제약이 깨지면 즉시 jq 전환 필요 (재검토 트리거 #6)

## 후보 비교

| 축 | A. jq 도입 + fallback | B. jq 필수 의존성 | **C. NO-OP (현행 유지 + 회귀 가드)** |
|---|---|---|---|
| 초기 구현 | 중 — jq 경로 + fallback 경로 + 테스트 매트릭스 2배 | 저 — jq 경로 단일 | **최저** — 경계 가드 테스트만 추가 |
| 의존성 증가 | 선택적 (jq 없어도 작동) | **필수** (macOS/Linux 기본 미포함) | 없음 |
| CLAUDE.md CRITICAL #6 (외부 패키지) | 경계선 — fallback 이 있어 완화 | **위배 가능** | 해당 없음 |
| 다운스트림 부담 | 낮음 — 자동 degrade | 중-고 — 각 프로젝트에 jq 설치 필요 | 없음 |
| 장기 안정성 | 높음 — 선언적 파싱 | 최고 — 단일 경로 | **현재와 동일** (현행 0건 실패 기준) |
| 유지 비용 | 2배 테스트 매트릭스, 환경별 분기 디버깅 | 작음 | **작음** — 경계 가드 1회 추가 후 |
| 회귀 위험 | "jq 환경에서만 드러나는 버그" 가능 | jq 버전 차이 | **없음 신규** |
| 실측 정당화 | 없음 | 없음 | **현재 실패율 0 = 전환 비용 정당화 불가** |

## 결정

**C. NO-OP — jq 전환하지 않는다. 대신 현행 grep/sed 파이프라인의 write/parse 라운드트립을 보호하는 경계 가드 테스트를 추가한다.**

### 함께 도입하는 회귀 가드

1. **`test/parse-cross-validate-outcome-boundary.test.js`** 신설
   - `CROSS_VALIDATE_ANCHOR` 에 경계 문자 (`\`, `"`, 개행, 탭) 주입 → cross_validate.sh 가 outcome JSON 생성 → parse 헬퍼 실행 → round-trip 로 원본 복구 검증
   - 목적: write 측 `json_escape()` 가 변경되거나 parse 측 정규식이 깨질 때 **즉시 실패** 유도
   - 테스트 이름에 `boundary regression guard` 명시하여 "jq 도입으로 제거하자" 는 추후 유혹 억제
2. CLAUDE.md `## 교차검증` 섹션에 이 ADR 포인터 1줄 추가 — 향후 재발굴 시 빠른 기각 근거

### 비결정 (명시적 비목표)

- jq 도입 금지를 **영구 규칙** 으로 박제하지는 않는다 — 아래 재검토 조건이 충족되면 재평가
- write 측 `json_escape()` 의 escape 범위 확장은 별도 이슈. 현행 scope (`\`, `"`, `\n`, `\r`, `\t`) 유지

## 결과·재검토 조건

### 즉시 효과

- PR #141 close (`Closes #141`)
- 테스트 카운트 47 → 48+ (경계 가드 케이스 수만큼 증가)
- `scripts/parse-cross-validate-outcome.sh` 코드 변경 없음 (문서 계약만 ADR 참조로 보강 가능)

### 재검토 트리거 (하나라도 해당 시 ADR 폐기 + 신규 결정 필요)

1. **실측 파싱 에러 발생** — 프로덕션 outcome JSON 파싱 실패가 이슈로 보고될 경우. 경계 가드 테스트가 잡지 못한 novel case 라면 즉시 재평가
2. **write 측 스키마 복잡화** — outcome JSON 에 배열/중첩 객체 등 `grep`+`sed` 로 감당 어려운 구조가 추가될 때 (현행은 flat 9 필드)
3. **jq 가 기본 포함되는 런타임** 으로 이동 — GitHub Actions runner, 표준 Docker base image 등에서 jq 가 보편화되면 "의존성 추가 비용" 축이 소멸
4. **다운스트림 요청** — 하네스 사용 프로젝트에서 구조화된 outcome 필드 소비 니즈가 커져 jq 기반 파이프라인을 유지보수하는 것이 이득일 때
5. **CROSS_VALIDATE 입력원 다변화** — parse 헬퍼가 cross_validate.sh 외 타 소스 (외부 도구 / 수동 편집) 의 JSON 도 consume 해야 할 때. 현 계약 (단일 write 소스) 이 깨지면 defensive parsing 필요
6. **필드 값 범위에 raw double-quote 도입 가능성** — 위 "알려진 한계" 의 구조적 전제 (enum/경로/번호로 제한) 가 깨지는 변경이 예정될 때. 예: 사용자 자유 입력 문자열을 outcome JSON 에 기록하는 신규 필드 추가, 임의 커밋 메시지/PR 제목을 필드로 편입 등. **이 경우 jq 전환이 즉시 정당화됨**

### 관측 지표

경계 가드 테스트가 CI 에서 지속 통과하는 한, 본 결정은 유효. 실패 시 재검토 트리거 1번에 해당하므로 ADR 상태를 `Superseded` 로 전환한다.
