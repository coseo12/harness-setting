# Changelog

이 파일은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/) 포맷을 따르며, 버전은 [Semantic Versioning](https://semver.org/lang/ko/) 을 사용한다.

> **NOTICE — 버저닝 정책 변경 (v2.6.2~)**
>
> "규약 추가 = MINOR" 선례(v2.5.0~v2.6.0) 폐기. v2.6.3 부터 **에이전트 지시어·스킬 절차의 행동 변화는 MINOR**, **행동 변화 없는 문서/문구/오타는 PATCH** 로 분기한다. MINOR/MAJOR 릴리스는 `### Behavior Changes` 섹션을 필수로 포함한다.
> 분류 기준 전문: [CLAUDE.md `### 릴리스`](CLAUDE.md#릴리스).

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
