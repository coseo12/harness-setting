#!/usr/bin/env bash
# 새 프로젝트에 harness 프레임워크를 초기화하는 스크립트
set -euo pipefail

HARNESS_REPO="https://github.com/YOUR_USERNAME/harness_setting.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${1:-.}"

echo "=== Harness Engineering Framework 초기화 ==="
echo ""

# 환경 검사
echo "환경 검사 중..."
MISSING=0

check_tool() {
  local cmd="$1"
  local url="$2"
  if command -v "${cmd}" &> /dev/null; then
    local ver
    ver=$("${cmd}" --version 2>&1 | head -1)
    echo "  [OK] ${cmd}: ${ver}"
  else
    echo "  [MISSING] ${cmd}: 설치 필요 → ${url}"
    MISSING=1
  fi
}

check_tool "git" "https://git-scm.com/"
check_tool "gh" "https://cli.github.com/"
check_tool "claude" "https://docs.anthropic.com/en/docs/claude-code"

if command -v jq &> /dev/null; then
  echo "  [OK] jq: $(jq --version 2>&1)"
else
  echo "  [WARN] jq: 미설치 (권장). 오케스트레이터 기능 일부 제한됨"
fi

# gh 인증 확인
if command -v gh &> /dev/null; then
  if gh auth status &> /dev/null 2>&1; then
    echo "  [OK] gh 인증 확인됨"
  else
    echo "  [WARN] gh 미인증. 나중에 'gh auth login' 필요"
  fi
fi

if [ "${MISSING}" -eq 1 ]; then
  echo ""
  echo "필수 도구가 누락되었습니다. 설치 후 다시 실행하세요."
  exit 1
fi

echo ""
echo "대상 디렉토리: ${PROJECT_DIR}"

# 대상 디렉토리 확인/생성
mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}"

# git 초기화 (이미 있으면 건너뜀)
if [ ! -d ".git" ]; then
  git init
  echo "Git 저장소 초기화 완료"
fi

# harness 설정 복사
echo "Harness 설정 파일 복사 중..."

# .claude 디렉토리 복사
if [ -d "${SCRIPT_DIR}/../.claude" ]; then
  cp -r "${SCRIPT_DIR}/../.claude" .
  echo "  - .claude/ 복사 완료"
fi

# .github 디렉토리 복사
if [ -d "${SCRIPT_DIR}/../.github" ]; then
  cp -r "${SCRIPT_DIR}/../.github" .
  echo "  - .github/ 복사 완료"
fi

# CLAUDE.md 복사
if [ -f "${SCRIPT_DIR}/../CLAUDE.md" ]; then
  cp "${SCRIPT_DIR}/../CLAUDE.md" .
  echo "  - CLAUDE.md 복사 완료"
fi

# scripts 복사
cp -r "${SCRIPT_DIR}" ./scripts
chmod +x ./scripts/*.sh
echo "  - scripts/ 복사 완료"

# .harness 상태 디렉토리 생성
mkdir -p .harness/logs

# 초기 상태 파일 생성
PROJECT_NAME=$(basename "$(pwd)")
cat > .harness/state.json << EOF
{
  "project": "${PROJECT_NAME}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "current_phase": "planning",
  "agents": {
    "orchestrator": { "status": "idle", "current_task": null },
    "planner": { "status": "idle", "current_task": null },
    "pm": { "status": "idle", "current_task": null },
    "architect": { "status": "idle", "current_task": null },
    "frontend-developers": [],
    "backend-developers": [],
    "developers": [],
    "reviewer": { "status": "idle", "current_task": null },
    "qa": { "status": "idle", "current_task": null },
    "auditor": { "status": "idle", "current_task": null },
    "integrator": { "status": "idle", "current_task": null }
  },
  "issues": [],
  "pull_requests": [],
  "blocked": []
}
EOF
echo "  - .harness/state.json 생성 완료"

# .gitignore 에 harness 관련 항목 추가
if [ ! -f ".gitignore" ]; then
  touch .gitignore
fi

# .harness/logs 는 무시 (상태 파일은 추적)
if ! grep -q ".harness/logs" .gitignore 2>/dev/null; then
  echo "" >> .gitignore
  echo "# Harness 로그 (상태 파일은 추적)" >> .gitignore
  echo ".harness/logs/" >> .gitignore
fi

# GitHub 라벨 생성
echo ""
echo "GitHub 라벨을 생성하시겠습니까? (GitHub 리모트 설정 필요)"
read -rp "(y/N): " CREATE_LABELS

if [[ "${CREATE_LABELS}" =~ ^[Yy]$ ]]; then
  echo "GitHub 라벨 생성 중..."
  ./scripts/setup-labels.sh
fi

# 기본 브랜치 설정
git checkout -b develop 2>/dev/null || true

echo ""
echo "=== 초기화 완료 ==="
echo ""
echo "다음 단계:"
echo "  1. GitHub 저장소 생성 후 리모트 연결"
echo "     git remote add origin <URL>"
echo "  2. 라벨 생성 (아직 안 했다면)"
echo "     ./scripts/setup-labels.sh"
echo "  3. 오케스트레이터 시작"
echo "     ./scripts/orchestrator.sh start"
echo "  4. 또는 개별 에이전트 실행"
echo "     ./scripts/dispatch-agent.sh <pm|architect|developer|reviewer|qa> <이슈번호>"
