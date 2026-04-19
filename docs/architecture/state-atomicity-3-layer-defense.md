# 상태 기록 원자성 — 3계층 직교 방어 패턴

> 원자성이 요구되는 상태 기록 시스템(매니페스트 / 캐시 / 인덱스 / 마이그레이션 레지스트리 등) 에서 **단일 방어선은 타이밍 blind spot 때문에 항상 부족하다**. 연산 도중 방어 / 연산 이후 자가 복구 / 사용자 안내의 **3계층 직교 방어** 로 설계하라. harness-setting 의 매니페스트 원자성 완성 과정(v2.8.0 → v2.9.0 → v2.10.0) 이 실증 사례다.

---

## 1. 배경 — 왜 단일 방어선으로는 부족한가

"상태 기록" 은 (1) 실세계 상태(파일/테이블/서브모듈 체크아웃) 와 (2) 그 상태를 기술하는 매니페스트(인덱스/레지스트리/캐시 메타데이터) 가 **함께** 갱신돼야 일관적이다. 대부분의 시스템은 이 두 쓰기가 **원자적 트랜잭션이 아니다**. 실세계 쓰기 직후·매니페스트 기록 직후·기록 이후의 어느 타이밍에라도 외부 간섭(pre-commit 훅, 비동기 워커, 다른 프로세스의 formatter, 병렬 편집 등) 이 끼어들 수 있다.

한 방어선은 자신이 담당하는 **타이밍 윈도우 밖의 간섭** 을 보지 못한다. 아래는 harness-setting 이 실제 관찰한 blind spot 연쇄다.

- **단일 계층으로 시작 (v2.8.0)** — 파일 적용 **직후** 해시를 재검증해 불일치면 매니페스트를 이전 값으로 유지 → 연산 내부 간섭은 잡지만, `git commit` 시점에 실행되는 lint-staged 가 파일을 재포맷해 드리프트를 만드는 **연산 종료 후 간섭**은 못 잡음
- **자가 복구 추가 (v2.9.0)** — 매니페스트에 `previousSha256` 을 기록해 다음 연산에서 "롤백된 상태" 를 식별·재적용 → 사후 드리프트는 해소되지만, 사용자가 "자가 복구가 가능하다" 는 사실을 모르면 매니페스트를 git checkout 으로 **수동 복구**하는 헛수고 반복
- **사용자 안내 추가 (v2.10.0)** — `harness doctor` 가 "외부 롤백 의심 N건 — `--apply-all-safe` 로 자가 복구 가능" 이라는 **복구 경로** 를 명시 노출 → 계층 2 의 기능이 비로소 사용자 손에 도달

세 단계는 **서로 커버 범위가 직교** 한다. 한 계층을 생략하면 다른 계층이 커버하지 못하는 타이밍에 노출된다.

---

## 2. 3계층 패턴 — 설계 목표 / 커버 범위 / blind spot

| 계층 | 설계 목표 | 커버하는 타이밍 | blind spot (상위 계층이 보완) |
|---|---|---|---|
| **계층 1 — 도중 방어** <br/> (post-apply 검증 게이트) | 상태 갱신 연산 **직후** 기대 해시와 실측 해시를 비교하여 불일치면 해당 엔트리의 매니페스트 기록을 **이전 값으로 유지**. 부분 실패 감지 시 exit code 1 + stderr 경고 | 연산 scope 내 부분 실패 / 외부 간섭 (즉시 실행 워커 / 병렬 편집 / 연산 중 중단) | 연산 종료 **이후** 에 발생하는 간섭 (pre-commit 훅, 비동기 formatter, 별도 프로세스 개입) |
| **계층 2 — 사후 복구** <br/> (previous-state self-healing) | 각 엔트리에 직전 상태 해시를 optional 필드(`previousSha256`) 로 기록. 다음 연산 시 `현재 파일 해시 === previousSha256` 이면 "외부 롤백 확정" 으로 분류해 **재적용 허용** | 계층 1 이 못 잡는 사후 간섭을 **다음 연산에서 자가 해소** (교착 상태 원천 제거) | 자가 복구 경로가 존재한다는 사실을 사용자가 모르면 수동 개입(매니페스트 git checkout 복원) 으로 회귀 |
| **계층 3 — 사용자 안내** <br/> (drift 분류 + 복구 경로 노출) | 상태 점검 명령(`harness doctor` / `fsck` / `db:status` 등) 이 **"복구 가능 드리프트"** 를 별도 카테고리로 분리 노출. 다음 행동("N건 — `--apply-all-safe` 로 자가 복구 가능") 을 한 줄로 안내 | 계층 2 의 복구 경로가 사용자에게 **가시적** 이 되어 즉시 활용됨. 수동 우회 회귀 방지 | (상위 보완 없음 — 최종 계층) |

계층 간 역할 차이의 핵심은 **"언제 개입하는가"** 이다. 계층 1 은 쓰기 직후, 계층 2 는 다음 쓰기 시점, 계층 3 은 점검 명령 실행 시점. 각자 다른 타이밍에 주둔하므로 한 계층이 꺼져도 다른 계층이 대신 설 수 없다.

---

## 3. 다른 시스템에 일반화 — 4가지 적용 예시

아래 표는 패턴을 다른 영역의 "상태 기록 시스템" 에 대응시킨 예시다. 구현 세부는 생략하고 각 계층이 무엇에 해당하는지만 매핑한다.

| 시스템 | 계층 1 — 도중 방어 | 계층 2 — 사후 복구 | 계층 3 — 사용자 안내 |
|---|---|---|---|
| **파일 시스템 인덱스** (fs journal, inode table) | fsync 후 checksum 검증. 실패 시 journal rollback | journal 에 previous-state 기록 → 비정상 종료 후 재mount 에서 자가 복구 | `fsck` 가 "복구 가능 항목 N개" 와 "수동 개입 필요 N개" 를 분리 리포트 |
| **DB 마이그레이션 레지스트리** (`schema_migrations` 테이블) | post-migrate assertion (예상 테이블/컬럼 존재 확인). 실패 시 migration 기록 롤백 | shadow table / down-migration + previous schema snapshot 보존 | `rake db:status` / `migrate:status` 가 "drift 감지 — `db:migrate:redo` 로 복구" 안내 |
| **빌드 캐시** (turbo / bazel / sccache) | 빌드 완료 후 산출물 해시가 cache key 와 일치하는지 재검증 | 이전 빌드 산출물 해시 보존 → 다음 빌드에서 캐시 오염 탐지 시 재사용 차단 + 자가 재빌드 | `build --diagnose` / `bazel info` 가 "캐시 오염 N건 — `clean --expunge` 권장" 메시지 |
| **git 서브모듈** (`.gitmodules` + gitlink) | pre-commit **훅** 으로 submodule HEAD 가 gitlink 과 일치하는지 검증 (git 자체는 자동 차단하지 않음 — 훅 기반 방어 필요) | `.git/modules/*/HEAD` 이전 SHA 기록 → `submodule update` 가 드리프트 시 이전 SHA 기준 recover | `git status` / `git submodule status` 가 "+/-/U" prefix 로 drift 유형 명시 |

패턴을 이식할 때의 체크리스트:
- **계층 1**: "쓰기 직후 기대 상태 = 실측 상태" 검증이 가능한가? 검증 단위(파일/row/산출물) 의 해시/체크섬이 싸게 계산되는가?
- **계층 2**: 직전 상태를 저장할 여유 공간/필드가 있는가? "현재 == previous" 비교로 **롤백 여부가 확정적으로 식별** 되는가? (확정적이지 않으면 false positive 재적용 위험)
- **계층 3**: 사용자가 정기적으로 실행하는 점검 명령이 이미 있는가? 없다면 계층 3 은 알람/배너로 대체 가능한가?

---

## 4. 적용 조건 분기 — 어디까지 가야 충분한가

모든 시스템이 3계층 전부를 요구하지는 않는다. 과설계를 피하기 위한 판단 기준:

### 4.1 계층 1 만으로 충분한 조건

- 연산 프로세스가 **짧고 내부에서 종료** 됨 (외부 간섭 창이 연산 내부로만 제한)
- 연산 종료 후 상태가 **immutable** 로 취급됨 (예: 로그 append-only, 읽기 전용 아티팩트 레지스트리)
- 드리프트 발생 시 복구 비용보다 **재실행 비용이 더 쌈** (재빌드가 1초 안에 끝나면 자가 복구 설계는 과투자)

### 4.2 계층 1 + 2 가 필요한 조건

- 연산 종료 **이후** 에도 상태가 변조될 경로가 있음 (pre-commit 훅, 비동기 워커, 다른 사용자의 편집 세션)
- 드리프트가 발생하면 **다음 연산이 교착** 됨 (수동 개입 없이는 전진 불가)
- 자가 복구가 **자동 실행 경로** 에 들어와 있음 (예: 매 연산마다 모든 엔트리의 previousSha256 비교)

### 4.3 3계층 전부 필요한 조건

- 자가 복구가 **사용자 action 을 요구** 하고, 자동 실행되지 않음 (예: 사용자가 `--apply-all-safe` 명령을 직접 실행해야 계층 2 가 활성화)
- 사용자가 **복구 경로의 존재 자체를 모를 가능성** 이 높음 (숨겨진 기능, 문서화 부족)
- 안내 없으면 **수동 우회** 가 관례화되어 계층 2 가 사장됨 (harness 의 "매니페스트 git checkout 복구" 회귀 사례)

### 4.4 판정 애매 시

**낮은 쪽(계층 수를 줄이는 쪽) 을 선택** 하고, 실운영에서 drift 가 관찰될 때마다 상위 계층을 1개씩 올린다. harness-setting 자체가 그 경로(v2.8.0 → v2.9.0 → v2.10.0 의 3 릴리스 점진 진화) 를 따른 실증 사례다.

---

## 5. 실증 근거 — harness-setting 자기 사례

| 계층 | 릴리스 | 이슈 | 무엇을 추가했는가 |
|---|---|---|---|
| 계층 1 | [v2.8.0](https://github.com/coseo12/harness-setting/releases/tag/v2.8.0) | [#89](https://github.com/coseo12/harness-setting/issues/89) | post-apply 검증 게이트 (파일 적용 직후 해시 재검증, 불일치 시 매니페스트 해시는 이전 값 유지). `harness doctor` 에 "매니페스트 해시 정합성" 항목 추가 |
| 계층 2 | [v2.9.0](https://github.com/coseo12/harness-setting/releases/tag/v2.9.0) | [#92](https://github.com/coseo12/harness-setting/issues/92) Phase 1 | 매니페스트에 `previousSha256` 필드 자동 기록. `userSha === previousSha256` 인 파일을 `modified-pristine` 으로 재분류해 `--apply-all-safe` 가 자가 복구 |
| 계층 3 | [v2.10.0](https://github.com/coseo12/harness-setting/releases/tag/v2.10.0) | [#92](https://github.com/coseo12/harness-setting/issues/92) Phase 2 | `harness doctor` 가 "외부 롤백 의심" 을 별도 분류로 노출 + 복구 명령 안내 |

각 단계가 왜 **이전 단계만으로 부족** 했는지는 CLAUDE.md 의 "매니페스트 최신 ≠ 파일 적용 완료" 섹션에 연대기로 기록돼 있다. 이 문서는 그 연대기를 **일반화된 설계 지식** 으로 승격한 것이다.

### 교차검증의 기여

계층 2 의 `previousSha256` 설계는 Gemini cross-validate 에서 도출됐다 (volt [#23](https://github.com/coseo12/volt/issues/23), volt [#29](https://github.com/coseo12/volt/issues/29)). 단일 모델이 계층 1 만으로 만족하려는 편향을 교차검증이 깨뜨린 사례 — **"정책/설계 박제 직후 1회 cross-validate"** 루틴의 실효를 보여준다.

---

## 참고 링크

- volt [#27](https://github.com/coseo12/volt/issues/27) — 매니페스트 원자성 교착 상태 원본 관찰 (계층 1/2 구현 동기)
- volt [#28](https://github.com/coseo12/volt/issues/28) — 본 문서의 지식 출처 (harness 실증 → 일반화)
- volt [#13](https://github.com/coseo12/volt/issues/13) — lint-staged silent partial commit (계층 2 의 방어 대상 타이밍)
- volt [#23](https://github.com/coseo12/volt/issues/23) — 교차검증 수용/분리 3단 프로토콜 (계층 2 는 cross-validate 고유 발견)
- harness [#89](https://github.com/coseo12/harness-setting/issues/89) / [#92](https://github.com/coseo12/harness-setting/issues/92) — 구현 이슈
- harness [#99](https://github.com/coseo12/harness-setting/pull/99) — `Builds on` 발의 PR (v2.12.0 에서 후속 분리 명시 → 본 문서 이슈 #100 으로 귀결)
- CLAUDE.md `### 매니페스트 최신 ≠ 파일 적용 완료` — 연대기 + 복구 recipe
