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
  echo "  frontend-developer - 프론트엔드 구현"
  echo "  backend-developer  - 백엔드 구현"
  echo "  developer      - 풀스택 구현"
  echo "  reviewer       - 코드 리뷰"
  echo "  qa             - 테스트 수행"
  echo "  auditor          - 정적 분석/보안 스캔"
  echo "  skill-creator    - 스킬 생성/개선/검증"
  echo "  cross-validator  - Gemini CLI 교차검증"
  echo "  integrator       - 문서/설정 정합성 검증"
  echo "  releaser         - 릴리스 생성"
  echo ""
  echo "예시:"
  echo "  $0 planner                 # Planner에게 기획 요청"
  echo "  $0 planner 5               # Planner에게 이슈 #5 기반 기획 요청"
  echo "  $0 pm                    # PM에게 새 요구사항 분석 요청"
  echo "  $0 architect 5           # Architect에게 이슈 #5 설계 요청"
  echo "  $0 frontend-developer 5  # Frontend Dev에게 이슈 #5 구현 요청"
  echo "  $0 backend-developer 5   # Backend Dev에게 이슈 #5 구현 요청"
  echo "  $0 developer 5           # Fullstack Dev에게 이슈 #5 구현 요청"
  echo "  $0 auditor 12            # Auditor에게 PR #12 정적 분석 요청"
  echo "  $0 reviewer 12           # Reviewer에게 PR #12 리뷰 요청"
  echo "  $0 qa 12                 # QA에게 PR #12 테스트 요청"
  echo "  $0 skill-creator         # 새 스킬 생성 시작"
  echo "  $0 cross-validator       # 프로젝트 구조 교차검증"
  echo "  $0 integrator            # 정합성 검증"
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
        echo "이슈 #${number}를 분석하고 실행 가능한 하위 이슈로 분해해줘. .claude/agents/pm.md 의 규칙을 따르고, .claude/skills/create-issue/SKILL.md 의 형식으로 이슈를 생성해줘. UI 프로젝트라면 scope:frontend/backend/fullstack 라벨로 구분해줘."
      else
        echo "새로운 프로젝트 요구사항을 분석할 준비를 해줘. 사용자에게 요구사항을 물어보고, .claude/agents/pm.md 의 규칙에 따라 이슈로 분해해줘. UI 프로젝트라면 scope:frontend/backend/fullstack 라벨로 구분해줘."
      fi
      ;;
    architect)
      echo "이슈 #${number}에 대한 기술 설계를 수행해줘. .claude/agents/architect.md 의 규칙을 따르고, docs/architecture/ 에 설계 문서를 작성해줘. UI 프로젝트라면 프론트엔드 설계(컴포넌트 구조, 디자인 시스템)와 API 계약을 반드시 포함해줘."
      ;;
    frontend-developer)
      echo "이슈 #${number}를 구현해줘. .claude/agents/frontend-developer.md 의 규칙을 따라 feature 브랜치를 생성하고, UI를 구현한 후 PR을 생성해줘. Architect의 설계 문서(컴포넌트 구조, API 계약)와 Planner의 화면 흐름을 참고해줘."
      ;;
    backend-developer)
      echo "이슈 #${number}를 구현해줘. .claude/agents/backend-developer.md 의 규칙을 따라 feature 브랜치를 생성하고, API/비즈니스 로직을 구현한 후 PR을 생성해줘. Architect의 설계 문서(API 계약, DB 스키마)를 참고해줘."
      ;;
    developer)
      echo "이슈 #${number}를 풀스택으로 구현해줘. .claude/agents/developer.md 의 규칙을 따라 feature 브랜치를 생성하고, 구현 후 PR을 생성해줘. 설계 문서가 있으면 참고해줘."
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
    integrator)
      echo "프레임워크 전체의 문서/설정 정합성을 검증해줘. .claude/agents/integrator.md 의 규칙을 따라 먼저 scripts/validate-integrity.sh를 실행하고, 2차 문맥적 검증을 수행해줘. 불일치가 있으면 직접 수정하거나 이슈를 생성해줘."
      ;;
    devops)
      if [ -n "${number}" ]; then
        echo "이슈/PR #${number}에 대한 인프라 점검을 수행해줘. .claude/agents/devops.md 의 규칙을 따라 교착 상태 확인, 에이전트 로그 분석, 복구 조치를 수행해줘."
      else
        echo "프레임워크 전체의 인프라 건전성을 점검해줘. .claude/agents/devops.md 의 규칙을 따라 validate-integrity.sh, validate-setup.sh 실행, 교착 이슈 확인, 에이전트 상태 점검을 수행해줘."
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
# PR 기반 에이전트(auditor, reviewer, qa)는 gh pr view, 나머지는 gh issue view
ISSUE_CONTEXT=""
if [ -n "${TASK_NUMBER}" ]; then
  case "${AGENT}" in
    auditor|reviewer|qa)
      ISSUE_BODY=$(gh pr view "${TASK_NUMBER}" --json body --jq '.body' 2>/dev/null || true)
      if [ -n "${ISSUE_BODY}" ]; then
        ISSUE_CONTEXT="관련 PR #${TASK_NUMBER} 내용:\n${ISSUE_BODY}\n\n"
      fi
      ;;
    *)
      ISSUE_BODY=$(gh issue view "${TASK_NUMBER}" --json body --jq '.body' 2>/dev/null || true)
      if [ -n "${ISSUE_BODY}" ]; then
        ISSUE_CONTEXT="관련 이슈 #${TASK_NUMBER} 내용:\n${ISSUE_BODY}\n\n"
      fi
      ;;
  esac
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
    frontend-developer)
      # 전체 개발 도구 (프론트엔드 중심) + 브라우저 테스트
      echo "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(gh pr *),Bash(gh issue *),Bash(npm *),Bash(npx *),Bash(yarn *),Bash(pnpm *),Bash(make *),Bash(ls *),Bash(mkdir *),Bash(agent-browser *)"
      ;;
    backend-developer)
      # 전체 개발 도구 (백엔드 중심)
      echo "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(gh pr *),Bash(gh issue *),Bash(npm *),Bash(make *),Bash(go *),Bash(cargo *),Bash(pytest *),Bash(python *),Bash(ls *),Bash(mkdir *),Bash(docker *)"
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
      # 읽기 + gh PR 리뷰 + 브라우저 스냅샷/스크린샷 (읽기 전용)
      echo "Read,Glob,Grep,Bash(gh pr *),Bash(gh issue *),Bash(git diff *),Bash(git log *),Bash(agent-browser snapshot *),Bash(agent-browser screenshot *),Bash(agent-browser open *),Bash(agent-browser get *)"
      ;;
    qa)
      # 읽기 + 테스트 실행 + 결과 보고 + 브라우저 E2E 테스트
      echo "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(gh pr *),Bash(npm test*),Bash(make test*),Bash(pytest *),Bash(go test *),Bash(cargo test *),Bash(agent-browser *)"
      ;;
    skill-creator)
      # 읽기/쓰기 + 검증 스크립트
      echo "Read,Write,Edit,Glob,Grep,Bash(python3 *),Bash(ls *),Bash(mkdir *),Bash(chmod *)"
      ;;
    auditor)
      # 읽기 + 린트/보안 도구 + 브라우저 접근성/보안 테스트
      echo "Read,Glob,Grep,Bash(npm run lint*),Bash(npx eslint *),Bash(flake8 *),Bash(ruff *),Bash(golangci-lint *),Bash(cargo clippy *),Bash(gitleaks *),Bash(npm audit*),Bash(pip audit*),Bash(gh pr *),Bash(gh issue *),Bash(agent-browser *)"
      ;;
    integrator)
      # 읽기/쓰기 + 검증 스크립트 + gh 이슈
      echo "Read,Write,Edit,Glob,Grep,Bash(bash *),Bash(ls *),Bash(mkdir *),Bash(git *),Bash(gh issue *),Bash(gh pr *)"
      ;;
    devops)
      # 인프라 관리 — 검증 스크립트, 로그 분석, gh 이슈/PR, 프로세스 확인
      echo "Read,Write,Edit,Glob,Grep,Bash(bash *),Bash(ls *),Bash(cat *),Bash(grep *),Bash(git *),Bash(gh issue *),Bash(gh pr *),Bash(gh run *),Bash(gh label *),Bash(ps *),Bash(lsof *)"
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

# 병렬 에이전트용 파일 잠금 — 개발자 에이전트만 적용
LOCK_ACQUIRED=""
if [[ "${AGENT}" =~ ^(frontend-developer|backend-developer|developer)$ ]] && [ -n "${TASK_NUMBER}" ]; then
  if [ -f "${SCRIPT_DIR}/lock-file.sh" ]; then
    HARNESS_AGENT="${AGENT}" "${SCRIPT_DIR}/lock-file.sh" acquire "issue-${TASK_NUMBER}" 2>/dev/null && \
      LOCK_ACQUIRED="issue-${TASK_NUMBER}" || true
  fi
fi

# Claude Code 실행
cd "${PROJECT_DIR}"

EXIT_CODE=0
timeout "${AGENT_TIMEOUT}" claude -p "${FULL_PROMPT}" --allowedTools "${ALLOWED_TOOLS}" 2>&1 | tee -a "${LOG_FILE}" || EXIT_CODE=$?

# 파일 잠금 해제
if [ -n "${LOCK_ACQUIRED}" ] && [ -f "${SCRIPT_DIR}/lock-file.sh" ]; then
  "${SCRIPT_DIR}/lock-file.sh" release "${LOCK_ACQUIRED}" 2>/dev/null || true
fi

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
