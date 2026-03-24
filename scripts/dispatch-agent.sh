#!/usr/bin/env bash
# 특정 에이전트를 실행하여 이슈/PR을 처리하는 스크립트
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
AGENTS_DIR="${PROJECT_DIR}/.claude/agents"

usage() {
  echo "사용법: $0 <에이전트> [이슈번호|PR번호] [추가옵션]"
  echo ""
  echo "에이전트:"
  echo "  planner        - 주제/스펙 → 기획서 작성"
  echo "  pm             - 요구사항 분석 및 이슈 분해"
  echo "  architect      - 기술 설계"
  echo "  developer      - 기능 구현"
  echo "  reviewer       - 코드 리뷰"
  echo "  qa             - 테스트 수행"
  echo "  auditor          - 정적 분석/보안 스캔"
  echo "  skill-creator    - 스킬 생성/개선/검증"
  echo "  cross-validator  - Gemini CLI 교차검증"
  echo "  releaser         - 릴리스 생성"
  echo ""
  echo "예시:"
  echo "  $0 planner                 # Planner에게 기획 요청"
  echo "  $0 planner 5               # Planner에게 이슈 #5 기반 기획 요청"
  echo "  $0 pm                    # PM에게 새 요구사항 분석 요청"
  echo "  $0 architect 5           # Architect에게 이슈 #5 설계 요청"
  echo "  $0 developer 5           # Developer에게 이슈 #5 구현 요청"
  echo "  $0 auditor 12            # Auditor에게 PR #12 정적 분석 요청"
  echo "  $0 reviewer 12           # Reviewer에게 PR #12 리뷰 요청"
  echo "  $0 qa 12                 # QA에게 PR #12 테스트 요청"
  echo "  $0 skill-creator         # 새 스킬 생성 시작"
  echo "  $0 cross-validator       # 프로젝트 구조 교차검증"
  echo "  $0 releaser              # 릴리스 생성"
  exit 1
}

if [ $# -lt 1 ]; then
  usage
fi

AGENT="$1"
TASK_NUMBER="${2:-}"

# 입력값 검증 — 셸 인젝션 방지
if [[ ! "${AGENT}" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "에러: 에이전트 이름은 영문 소문자, 숫자, 하이픈만 허용됩니다."
  exit 1
fi
if [ -n "${TASK_NUMBER}" ] && [[ ! "${TASK_NUMBER}" =~ ^[0-9]+$ ]]; then
  echo "에러: 작업 번호는 숫자만 허용됩니다."
  exit 1
fi

# 에이전트 파일 확인
AGENT_FILE="${AGENTS_DIR}/${AGENT}.md"
if [ ! -f "${AGENT_FILE}" ]; then
  echo "에러: 알 수 없는 에이전트 '${AGENT}'"
  echo "사용 가능한 에이전트:"
  ls "${AGENTS_DIR}"/*.md 2>/dev/null | xargs -I{} basename {} .md | sed 's/^/  - /'
  exit 1
fi

# 필수 의존성 확인
check_dependency() {
  local cmd="$1"
  local install_hint="$2"
  if ! command -v "${cmd}" &> /dev/null; then
    echo "에러: ${cmd}가 설치되어 있지 않습니다. ${install_hint}"
    exit 1
  fi
}

check_dependency "claude" "https://docs.anthropic.com/en/docs/claude-code"
check_dependency "gh" "https://cli.github.com/"

# GitHub 인증 상태 확인
if ! gh auth status &> /dev/null 2>&1; then
  echo "경고: GitHub 인증이 안 되어 있습니다. 'gh auth login'을 실행하세요."
  echo "GitHub 기능 없이 로컬 모드로 계속 진행합니다."
fi

# 에이전트별 프롬프트 구성
build_prompt() {
  local agent="$1"
  local number="$2"

  case "${agent}" in
    planner)
      if [ -n "${number}" ]; then
        echo "이슈 #${number}를 기반으로 기획서를 작성해줘. .claude/agents/planner.md 의 규칙을 따르고, docs/plans/ 에 기획 문서를 작성해줘. 불명확한 부분은 질문해줘."
      else
        echo "새로운 기획을 시작해줘. 사용자에게 주제나 스펙을 물어보고, .claude/agents/planner.md 의 규칙에 따라 기획서를 작성해줘. docs/plans/ 에 문서를 생성해줘."
      fi
      ;;
    pm)
      if [ -n "${number}" ]; then
        echo "이슈 #${number}를 분석하고 실행 가능한 하위 이슈로 분해해줘. .claude/agents/pm.md 의 규칙을 따르고, .claude/skills/create-issue/SKILL.md 의 형식으로 이슈를 생성해줘."
      else
        echo "새로운 프로젝트 요구사항을 분석할 준비를 해줘. 사용자에게 요구사항을 물어보고, .claude/agents/pm.md 의 규칙에 따라 이슈로 분해해줘."
      fi
      ;;
    architect)
      echo "이슈 #${number}에 대한 기술 설계를 수행해줘. .claude/agents/architect.md 의 규칙을 따르고, docs/architecture/ 에 설계 문서를 작성해줘."
      ;;
    developer)
      echo "이슈 #${number}를 구현해줘. .claude/agents/developer.md 의 규칙을 따라 feature 브랜치를 생성하고, 구현 후 PR을 생성해줘. 설계 문서가 있으면 참고해줘."
      ;;
    reviewer)
      echo "PR #${number}를 리뷰해줘. .claude/agents/reviewer.md 의 체크리스트에 따라 리뷰하고, 승인 또는 변경 요청을 해줘."
      ;;
    qa)
      echo "PR #${number}의 변경 사항을 테스트해줘. .claude/agents/qa.md 의 규칙을 따라 테스트를 실행하고, 결과를 PR에 코멘트로 보고해줘."
      ;;
    skill-creator)
      if [ -n "${number}" ]; then
        echo "이슈 #${number}에 정의된 스킬을 생성해줘. .claude/agents/skill-creator.md 의 워크플로우를 따르고, .claude/skills/create-skill/SKILL.md 의 절차대로 진행해줘. 검증까지 완료해줘."
      else
        echo "새로운 스킬을 생성해줘. .claude/agents/skill-creator.md 의 워크플로우를 따르고, .claude/skills/create-skill/SKILL.md 의 절차대로 진행해줘. 먼저 사용자에게 어떤 스킬이 필요한지 물어봐줘."
      fi
      ;;
    auditor)
      echo "PR #${number}에 대해 정적 분석을 수행해줘. .claude/agents/auditor.md 의 규칙을 따르고, .claude/skills/static-analysis/SKILL.md 의 절차대로 린트, 보안 스캔을 실행해줘. 결과를 PR에 코멘트로 보고해줘."
      ;;
    cross-validator)
      if [ -n "${number}" ]; then
        echo "PR #${number}의 코드를 Gemini CLI로 교차검증해줘. .claude/agents/cross-validator.md 의 규칙을 따르고, .claude/skills/cross-validate/scripts/cross_validate.sh code ${number} 를 실행한 뒤 Gemini 피드백을 분석하여 교차검증 보고서를 작성해줘."
      else
        echo "이 프로젝트의 전체 구조를 Gemini CLI로 교차검증해줘. .claude/agents/cross-validator.md 의 규칙을 따르고, .claude/skills/cross-validate/scripts/cross_validate.sh structure 를 실행한 뒤 Gemini 피드백을 분석하여 교차검증 보고서를 작성해줘."
      fi
      ;;
    releaser)
      echo "릴리스를 생성해줘. .claude/agents/releaser.md 의 규칙을 따르고, .claude/skills/create-release/SKILL.md 의 절차대로 버전 결정, CHANGELOG 갱신, GitHub Release 생성을 수행해줘."
      ;;
  esac
}

PROMPT=$(build_prompt "${AGENT}" "${TASK_NUMBER}")

# 컨텍스트 주입 — 에이전트에게 전역 지식 제공
CONTEXT_PREFIX=""
if [ -f "${PROJECT_DIR}/.harness/context.md" ]; then
  CONTEXT_PREFIX="먼저 .harness/context.md 파일을 읽고 프로젝트 전체 구조를 파악해줘.\n\n"
fi

# 이슈/PR 본문을 프롬프트에 사전 로드
ISSUE_CONTEXT=""
if [ -n "${TASK_NUMBER}" ]; then
  ISSUE_BODY=$(gh issue view "${TASK_NUMBER}" --json body --jq '.body' 2>/dev/null || true)
  if [ -n "${ISSUE_BODY}" ]; then
    ISSUE_CONTEXT="관련 이슈 #${TASK_NUMBER} 내용:\n${ISSUE_BODY}\n\n"
  fi
fi

FULL_PROMPT="${CONTEXT_PREFIX}${ISSUE_CONTEXT}${PROMPT}"

echo "=== ${AGENT} 에이전트 실행 ==="
echo "작업: ${PROMPT}"
echo ""

# 상태 업데이트
mkdir -p "${PROJECT_DIR}/.harness/logs"

LOG_FILE="${PROJECT_DIR}/.harness/logs/${AGENT}-$(date +%Y%m%d-%H%M%S).log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ${AGENT} 에이전트 시작 - 작업: ${TASK_NUMBER:-신규}" >> "${LOG_FILE}"

# 감사 로그 기록
if [ -f "${SCRIPT_DIR}/audit-log.sh" ]; then
  "${SCRIPT_DIR}/audit-log.sh" log "${AGENT}" "start" "task:${TASK_NUMBER:-신규}" 2>/dev/null || true
fi

# 에이전트별 도구 권한 — 역할에 따라 최소 권한 부여
get_allowed_tools() {
  local agent="$1"
  case "${agent}" in
    planner)
      # 읽기 + 기획 문서 작성
      echo "Read,Write,Edit,Glob,Grep,Bash(mkdir *),Bash(ls *)"
      ;;
    pm)
      # 읽기 + gh 이슈 관리만
      echo "Read,Glob,Grep,Bash(gh issue *),Bash(gh label *)"
      ;;
    architect)
      # 읽기 + 설계 문서 작성
      echo "Read,Write,Edit,Glob,Grep,Bash(mkdir *),Bash(ls *)"
      ;;
    developer)
      # 전체 개발 도구 (Bash는 git/gh/빌드 관련)
      echo "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(gh pr *),Bash(gh issue *),Bash(npm *),Bash(make *),Bash(go *),Bash(cargo *),Bash(pytest *),Bash(python *),Bash(ls *),Bash(mkdir *)"
      ;;
    reviewer)
      # 읽기 + gh PR 리뷰만
      echo "Read,Glob,Grep,Bash(gh pr *),Bash(gh issue *),Bash(git diff *),Bash(git log *)"
      ;;
    qa)
      # 읽기 + 테스트 실행 + 결과 보고
      echo "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(gh pr *),Bash(npm test*),Bash(make test*),Bash(pytest *),Bash(go test *),Bash(cargo test *)"
      ;;
    skill-creator)
      # 읽기/쓰기 + 검증 스크립트
      echo "Read,Write,Edit,Glob,Grep,Bash(python3 *),Bash(ls *),Bash(mkdir *),Bash(chmod *)"
      ;;
    auditor)
      # 읽기 + 린트/보안 도구
      echo "Read,Glob,Grep,Bash(npm run lint*),Bash(npx eslint *),Bash(flake8 *),Bash(ruff *),Bash(golangci-lint *),Bash(cargo clippy *),Bash(gitleaks *),Bash(npm audit*),Bash(pip audit*),Bash(gh pr *),Bash(gh issue *)"
      ;;
    cross-validator)
      # 읽기 + gemini/gh 실행
      echo "Read,Glob,Grep,Bash(gemini *),Bash(gh pr *),Bash(gh issue *),Bash(git diff *),Bash(.claude/skills/cross-validate/scripts/*)"
      ;;
    releaser)
      # 읽기/쓰기 + git 태그 + gh 릴리스
      echo "Read,Write,Edit,Glob,Grep,Bash(git tag *),Bash(git push origin v*),Bash(git log *),Bash(gh release *),Bash(gh pr list *)"
      ;;
    *)
      echo "Read,Glob,Grep"
      ;;
  esac
}

ALLOWED_TOOLS=$(get_allowed_tools "${AGENT}")

# 타임아웃 설정 (기본 30분)
AGENT_TIMEOUT="${HARNESS_AGENT_TIMEOUT:-1800}"

# Claude Code 실행
cd "${PROJECT_DIR}"

EXIT_CODE=0
timeout "${AGENT_TIMEOUT}" claude -p "${FULL_PROMPT}" --allowedTools "${ALLOWED_TOOLS}" 2>&1 | tee -a "${LOG_FILE}" || EXIT_CODE=$?

# 타임아웃 감지 (exit code 124)
if [ "${EXIT_CODE}" -eq 124 ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ${AGENT} 에이전트 타임아웃 (${AGENT_TIMEOUT}초)" >> "${LOG_FILE}"
  echo "=== ${AGENT} 에이전트 타임아웃 ==="
elif [ "${EXIT_CODE}" -eq 0 ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ${AGENT} 에이전트 정상 완료 (exit: ${EXIT_CODE})" >> "${LOG_FILE}"
  echo "=== ${AGENT} 에이전트 완료 ==="
else
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ${AGENT} 에이전트 비정상 종료 (exit: ${EXIT_CODE})" >> "${LOG_FILE}"
  echo "=== ${AGENT} 에이전트 실패 (exit: ${EXIT_CODE}) ==="
fi

# 감사 로그 기록
if [ -f "${SCRIPT_DIR}/audit-log.sh" ]; then
  "${SCRIPT_DIR}/audit-log.sh" log "${AGENT}" "end" "task:${TASK_NUMBER:-신규},exit:${EXIT_CODE}" 2>/dev/null || true
fi

echo "로그: ${LOG_FILE}"
exit "${EXIT_CODE}"
