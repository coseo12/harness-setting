# Harness Engineering Framework

AI 에이전트 기반 자동화 개발 프레임워크. 역할별 에이전트가 GitHub Issues/PR을 통해 병렬로 협업하며 개발을 진행한다.

## 구조

```
.claude/
  agents/          # 역할별 에이전트 정의
    orchestrator.md  # 워크플로우 조율
    pm.md            # 요구사항 → 이슈 분해
    architect.md     # 기술 설계
    developer.md     # 구현
    reviewer.md      # 코드 리뷰
    qa.md              # 테스트
    skill-creator.md     # 스킬 생성/개선
    cross-validator.md   # Gemini 교차검증
  skills/          # 에이전트 공유 스킬 (Anthropic skill 형식)
    create-issue/SKILL.md    # 이슈 생성
    create-pr/SKILL.md       # PR 생성
    review-pr/SKILL.md       # PR 리뷰
    run-tests/SKILL.md       # 테스트 실행
    sync-status/SKILL.md     # 상태 동기화
    create-skill/            # 스킬 생성 (메타 스킬)
      SKILL.md               #   메인 정의
      agents/                #   서브에이전트 (grader, analyzer)
      scripts/               #   검증/평가 스크립트
      references/            #   스키마 참조 문서
    cross-validate/          # 교차검증 (Gemini CLI)
      SKILL.md               #   메인 정의
      scripts/               #   검증 실행 스크립트
scripts/           # 실행 스크립트
.github/           # GitHub 템플릿 및 워크플로우
.harness/          # 런타임 상태 (로그 제외 추적)
```

## 워크플로우

```
요구사항 → PM(분해) → Architect(설계) → Developer(구현, 병렬) → Reviewer(리뷰) → QA(테스트) → Merge
```

## 시작하기

### 1. 새 프로젝트에 적용

**npx로 즉시 설치 (권장):**

```bash
# GitHub에서 직접 실행 (npm publish 불필요)
npx github:seo/harness_setting init ./my-project

# npm publish 후
npx @seo/harness-setting init ./my-project
```

**또는 수동 설치:**

```bash
# 이 저장소를 클론
git clone <this-repo> /tmp/harness

# 새 프로젝트에 초기화
/tmp/harness/scripts/init-project.sh /path/to/new-project
```

### 2. GitHub 라벨 설정

```bash
harness labels          # npx로 설치한 경우
./scripts/setup-labels.sh  # 수동 설치한 경우
```

### 3. 에이전트 실행

```bash
# 개별 에이전트 실행 (npx 설치: harness dispatch <agent> [n])
./scripts/dispatch-agent.sh pm              # PM: 요구사항 분석
./scripts/dispatch-agent.sh architect 5     # Architect: 이슈 #5 설계
./scripts/dispatch-agent.sh developer 5     # Developer: 이슈 #5 구현
./scripts/dispatch-agent.sh reviewer 12     # Reviewer: PR #12 리뷰
./scripts/dispatch-agent.sh qa 12           # QA: PR #12 테스트
./scripts/dispatch-agent.sh skill-creator   # 새 스킬 생성
./scripts/dispatch-agent.sh cross-validator # 구조 교차검증
./scripts/dispatch-agent.sh cross-validator 12  # PR #12 교차검증

# 전체 파이프라인 (순차)
./scripts/orchestrator.sh pipeline 5

# 병렬 개발
./scripts/orchestrator.sh parallel 5 6 7

# 오케스트레이터 자동 모드 (폴링)
./scripts/orchestrator.sh start
```

## 사전 요구사항

- [Node.js](https://nodejs.org/) >= 16.7.0 (npx 설치 시)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub CLI (gh)](https://cli.github.com/)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) (교차검증용)
- jq (권장)

## 커스터마이징

- **에이전트 규칙 수정**: `.claude/agents/*.md` 편집
- **스킬 추가**: `.claude/skills/<스킬명>/SKILL.md` 형식으로 추가 (Anthropic skill 형식)
- **워크플로우 변경**: `scripts/orchestrator.sh` 수정
- **CI/CD 확장**: `.github/workflows/` 에 워크플로우 추가
