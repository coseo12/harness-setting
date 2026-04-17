# Changelog

이 파일은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/) 포맷을 따르며, 버전은 [Semantic Versioning](https://semver.org/lang/ko/) 을 사용한다.

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
