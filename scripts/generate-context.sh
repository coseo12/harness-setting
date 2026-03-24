#!/usr/bin/env bash
# 프로젝트 컨텍스트 맵 생성 — 에이전트에게 전역 지식 제공
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT="${PROJECT_DIR}/.harness/context.md"

mkdir -p "${PROJECT_DIR}/.harness"

echo "=== 프로젝트 컨텍스트 생성 ==="

cat > "${OUTPUT}" << 'HEADER'
# 프로젝트 컨텍스트 맵
<!-- 자동 생성 - 직접 수정 금지 -->
<!-- 에이전트가 작업 시작 전 참조하는 전역 컨텍스트 -->

HEADER

# 1. 프로젝트 기본 정보
{
  echo "## 프로젝트 정보"
  echo ""
  if [ -f "${PROJECT_DIR}/.harness/state.json" ] && command -v jq &> /dev/null; then
    local_project=$(jq -r '.project // "unknown"' "${PROJECT_DIR}/.harness/state.json")
    echo "- **이름**: ${local_project}"
    echo "- **현재 Phase**: $(jq -r '.current_phase // "unknown"' "${PROJECT_DIR}/.harness/state.json")"
  fi
  echo "- **생성 시각**: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
} >> "${OUTPUT}"

# 2. 디렉토리 구조 (깊이 3, .git 제외)
{
  echo "## 디렉토리 구조"
  echo ""
  echo '```'
  find "${PROJECT_DIR}" -maxdepth 3 \
    -not -path '*/.git/*' \
    -not -path '*/.git' \
    -not -path '*/.harness/logs/*' \
    -not -path '*/.harness/locks/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/__pycache__/*' \
    -not -path '*/target/*' \
    -not -path '*/.venv/*' \
    | sed "s|${PROJECT_DIR}/||" | sort
  echo '```'
  echo ""
} >> "${OUTPUT}"

# 3. 기술 스택 감지
{
  echo "## 기술 스택"
  echo ""

  [ -f "${PROJECT_DIR}/package.json" ] && echo "- **Node.js**: $(jq -r '.name // "unknown"' "${PROJECT_DIR}/package.json" 2>/dev/null)"
  [ -f "${PROJECT_DIR}/pyproject.toml" ] && echo "- **Python**: pyproject.toml 감지"
  [ -f "${PROJECT_DIR}/go.mod" ] && echo "- **Go**: $(head -1 "${PROJECT_DIR}/go.mod" 2>/dev/null)"
  [ -f "${PROJECT_DIR}/Cargo.toml" ] && echo "- **Rust**: Cargo.toml 감지"
  [ -f "${PROJECT_DIR}/build.gradle" ] || [ -f "${PROJECT_DIR}/pom.xml" ] && echo "- **Java/Kotlin**: 빌드 파일 감지"
  [ -f "${PROJECT_DIR}/Makefile" ] && echo "- **Makefile**: 빌드 자동화"
  [ -f "${PROJECT_DIR}/Dockerfile" ] && echo "- **Docker**: 컨테이너화"

  echo ""
} >> "${OUTPUT}"

# 4. 최근 변경 파일 (최근 10 커밋)
{
  echo "## 최근 변경 (최근 10 커밋)"
  echo ""
  if git -C "${PROJECT_DIR}" log --oneline -10 &> /dev/null; then
    echo '```'
    git -C "${PROJECT_DIR}" log --oneline -10 2>/dev/null || echo "(git 히스토리 없음)"
    echo '```'
  else
    echo "(git 히스토리 없음)"
  fi
  echo ""
} >> "${OUTPUT}"

# 5. 주요 파일 목록 (소스 코드)
{
  echo "## 주요 소스 파일"
  echo ""
  # 일반적 소스 파일 확장자
  local_count=$(find "${PROJECT_DIR}" \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/__pycache__/*' \
    -not -path '*/target/*' \
    -not -path '*/.venv/*' \
    \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.kt" \) \
    2>/dev/null | head -50 | wc -l | tr -d ' ')

  if [ "${local_count}" -gt 0 ]; then
    find "${PROJECT_DIR}" \
      -not -path '*/.git/*' \
      -not -path '*/node_modules/*' \
      -not -path '*/__pycache__/*' \
      \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.kt" \) \
      2>/dev/null | head -50 | sed "s|${PROJECT_DIR}/||" | sort
  else
    echo "(소스 파일 없음 — 프레임워크 설정만 존재)"
  fi
  echo ""
} >> "${OUTPUT}"

# 6. 활성 이슈/PR 요약
{
  echo "## 활성 이슈/PR"
  echo ""
  if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
    echo "### 이슈"
    gh issue list --limit 10 --json number,title,labels \
      --template '{{range .}}- #{{.number}} {{.title}} [{{range .labels}}{{.name}} {{end}}]{{"\n"}}{{end}}' 2>/dev/null || echo "(조회 불가)"
    echo ""
    echo "### PR"
    gh pr list --limit 10 --json number,title,labels \
      --template '{{range .}}- #{{.number}} {{.title}} [{{range .labels}}{{.name}} {{end}}]{{"\n"}}{{end}}' 2>/dev/null || echo "(조회 불가)"
  else
    echo "(GitHub 접근 불가)"
  fi
  echo ""
} >> "${OUTPUT}"

echo "컨텍스트 생성 완료: ${OUTPUT}"
echo "줄 수: $(wc -l < "${OUTPUT}")"
