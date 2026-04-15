# Claude Code 워크플로우 템플릿

1인 개발자-AI 페어 프로그래밍에 최적화된 Claude Code 워크플로우 템플릿.
실전 프로젝트(portfolio-26, simple-shop 등) 경험에서 추출한 규칙과 교훈을 포함한다.

## 구조

```
CLAUDE.md                          # 워크플로우 규칙 + 실전 교훈
.claude/
  agents/
    developer.md                   # 풀스택 구현 에이전트
  skills/
    cross-validate/                # Gemini CLI 교차검증
    browser-test/                  # agent-browser 기반 E2E/시각적 검증
    create-issue/                  # GitHub 이슈 생성
    create-pr/                     # GitHub PR 생성
    run-tests/                     # 테스트 자동 감지 및 실행
```

## 워크플로우

```
사용자 → Developer → 검증(CI + browser-test) → PR → Merge
                       ↑
              cross-validate (선택, Gemini 교차검증)
```

## 시작하기

### 설치 (npx)

```bash
npx @seo/harness-setting init ./my-project
```

### 업데이트 확인/적용

설치된 harness의 업데이트를 확인하고 적용:

```bash
# 1. 변경 요약만 보기 (비파괴)
npx @seo/harness-setting@latest update --check

# 2. 충돌 없는 모든 변경 자동 적용 (frozen + pristine + added)
npx @seo/harness-setting@latest update --apply-all-safe

# 3. 카테고리별 세분화 적용
npx @seo/harness-setting@latest update --apply-frozen     # CI/스크립트만
npx @seo/harness-setting@latest update --apply-pristine   # 사용자 미수정 파일만
npx @seo/harness-setting@latest update --apply-added      # 신규 파일만

# 4. divergent/removed 파일별 결정 (TTY 필수)
npx @seo/harness-setting@latest update --interactive

# 5. 적용 없이 시뮬레이션
npx @seo/harness-setting@latest update --apply-all-safe --dry-run

# 6. 매니페스트 부재 시 — 현재 상태를 baseline으로 박제
npx @seo/harness-setting@latest update --bootstrap
```

적용 후 매니페스트는 **자동 갱신**됩니다 (별도 `--bootstrap` 불필요).

**Phase C 한계**: `divergent` 파일의 자동 3-way merge는 지원하지 않습니다. `--interactive` 모드에서 [k]eep/[n]ew/[d]iff/[s]kip 중 선택하거나, 표시된 `diff -u` 로 직접 비교 후 Edit 도구로 머지하세요. (Phase A에서 CLAUDE.md 센티널 + 자동 머지 도입 예정.)

파일 카테고리:
- **frozen** (`scripts/`, `.github/workflows/`) — 자동 덮어쓰기 안전
- **atomic** (스킬/에이전트/커맨드/템플릿) — 사용자 수정 시 충돌
- **managed-block** (`CLAUDE.md`) — Phase A에서 센티널 블록 도입 예정
- **user-only** (`.harness/`, `docs/decisions/`, `docs/retrospectives/` 사용자 추가분) — harness가 손대지 않음

### 셋업 자체 점검

초기화 후 프레임워크 규칙과 구성이 올바른지 확인:

```bash
npx @seo/harness-setting doctor
```

점검 항목: CLAUDE.md CRITICAL DIRECTIVES 블록, SessionStart hook, 한글 인코딩, `.claude/agents`·`.claude/skills` 디렉토리, 현재 브랜치(main/master 직접 작업 경고).

## 슬래시 커맨드 (Claude Code 세션 내)

9개 슬래시 커맨드 — 페르소나(`/pm /architect /dev /review /qa /next`) + 운영(`/team-status /harness-update`) + 지식 루프(`/capture-merge /volt-review`).

전체 인덱스 + 자주 쓰는 흐름: **[docs/commands-index.md](docs/commands-index.md)**

## 지식 컴파일 규약

volt 이슈(맥락) ↔ CLAUDE.md/스킬(행위 제약)의 양방향 컴파일 모델:
**[docs/knowledge-compilation.md](docs/knowledge-compilation.md)**

페르소나/라벨/정책 상세: **[docs/agents-guide.md](docs/agents-guide.md)**

## 버전 / 릴리스

전체 변경 이력: **[CHANGELOG.md](CHANGELOG.md)**

## 사전 요구사항

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub CLI (gh)](https://cli.github.com/)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (교차검증용, 선택)
- [agent-browser](https://github.com/vercel-labs/agent-browser) (브라우저 테스트용, 선택)

## 핵심 가치

이 템플릿이 제공하는 것:

1. **실전 교훈 기반 규칙** — "빌드 성공 ≠ 동작하는 앱", "HTTP 200 ≠ 올바른 리소스" 등
2. **스프린트 계약** — 구현 전 검증 가능한 완료 기준 합의 ([Anthropic 하네스 설계](docs/anthropic-harness-design.md) 기반)
3. **교차검증** — Gemini의 독립적 시각으로 설계/코드 의사결정 검증
4. **3단계 브라우저 검증** — 정적 → 인터랙션 → 흐름 (display-only 버그 방지)
5. **디자인 품질 루브릭** — Design Quality / Originality / Craft / Functionality 4축 평가
6. **자가 평가 경고** — AI의 과도한 긍정 평가 편향 방지

## 커스터마이징

- **규칙 수정**: `CLAUDE.md` 편집 (센티널 외부는 자유 영역, 내부는 update 시 갱신됨)
- **에이전트 수정**: `.claude/agents/<이름>.md` 편집
- **스킬 추가**: `.claude/skills/<스킬명>/SKILL.md` 형식으로 추가
- **슬래시 커맨드 추가**: `.claude/commands/<이름>.md` 형식으로 추가

설치 후 모든 파일은 사용자 소유. 업데이트는 `harness update` 의 카테고리별 정책으로 안전하게 반영한다.
