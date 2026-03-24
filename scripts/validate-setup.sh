#!/usr/bin/env bash
# 프로젝트 설정 완성도 검증
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

ERRORS=0
WARNINGS=0

pass() { echo "  [OK] $1"; }
warn() { echo "  [WARN] $1"; WARNINGS=$((WARNINGS + 1)); }
fail() { echo "  [FAIL] $1"; ERRORS=$((ERRORS + 1)); }

echo "=== Harness 설정 검증 ==="
echo ""

# 1. 필수 도구
echo "--- 필수 도구 ---"
command -v git &>/dev/null && pass "git 설치됨" || fail "git 미설치"
command -v gh &>/dev/null && pass "gh 설치됨" || fail "gh 미설치"
command -v claude &>/dev/null && pass "claude 설치됨" || fail "claude 미설치"
command -v jq &>/dev/null && pass "jq 설치됨" || warn "jq 미설치 (권장)"
command -v gemini &>/dev/null && pass "gemini 설치됨" || warn "gemini 미설치 (교차검증용)"

# gh 인증
if command -v gh &>/dev/null; then
  gh auth status &>/dev/null 2>&1 && pass "gh 인증 확인" || warn "gh 미인증 (gh auth login 필요)"
fi

echo ""

# 2. 디렉토리 구조
echo "--- 디렉토리 구조 ---"
[ -d "${PROJECT_DIR}/.claude/agents" ] && pass ".claude/agents/ 존재" || fail ".claude/agents/ 없음"
[ -d "${PROJECT_DIR}/.claude/skills" ] && pass ".claude/skills/ 존재" || fail ".claude/skills/ 없음"
[ -d "${PROJECT_DIR}/scripts" ] && pass "scripts/ 존재" || fail "scripts/ 없음"
[ -d "${PROJECT_DIR}/.github" ] && pass ".github/ 존재" || fail ".github/ 없음"
[ -d "${PROJECT_DIR}/.harness" ] && pass ".harness/ 존재" || warn ".harness/ 없음 (init-project.sh 실행 필요)"
[ -d "${PROJECT_DIR}/docs" ] && pass "docs/ 존재" || warn "docs/ 없음"

echo ""

# 3. 핵심 파일
echo "--- 핵심 파일 ---"
[ -f "${PROJECT_DIR}/CLAUDE.md" ] && pass "CLAUDE.md 존재" || fail "CLAUDE.md 없음"
[ -f "${PROJECT_DIR}/.claude/settings.json" ] && pass "settings.json 존재" || fail "settings.json 없음"
[ -f "${PROJECT_DIR}/.gitignore" ] && pass ".gitignore 존재" || warn ".gitignore 없음"

echo ""

# 4. 에이전트 파일
echo "--- 에이전트 ---"
for agent in orchestrator pm architect developer reviewer qa auditor skill-creator cross-validator releaser; do
  [ -f "${PROJECT_DIR}/.claude/agents/${agent}.md" ] && pass "${agent}.md" || warn "${agent}.md 없음"
done

echo ""

# 5. 스킬 파일
echo "--- 스킬 ---"
for skill in create-issue create-pr review-pr run-tests sync-status create-skill cross-validate fix-error resolve-conflict static-analysis create-release generate-docs; do
  [ -f "${PROJECT_DIR}/.claude/skills/${skill}/SKILL.md" ] && pass "${skill}" || warn "${skill} 없음"
done

echo ""

# 6. 스크립트 실행 권한
echo "--- 스크립트 ---"
for script in dispatch-agent.sh orchestrator.sh init-project.sh setup-labels.sh; do
  if [ -f "${PROJECT_DIR}/scripts/${script}" ]; then
    [ -x "${PROJECT_DIR}/scripts/${script}" ] && pass "${script} (실행 가능)" || warn "${script} (실행 권한 없음)"
  else
    warn "${script} 없음"
  fi
done

echo ""

# 7. Git 설정
echo "--- Git ---"
[ -d "${PROJECT_DIR}/.git" ] && pass "Git 저장소" || warn "Git 초기화 필요"
if [ -d "${PROJECT_DIR}/.git" ]; then
  git -C "${PROJECT_DIR}" remote -v &>/dev/null && pass "리모트 설정됨" || warn "리모트 미설정"
  git -C "${PROJECT_DIR}" branch --show-current 2>/dev/null | grep -q "develop" && pass "develop 브랜치" || warn "develop 브랜치 없음"
fi

echo ""

# 8. GitHub 라벨 (리모트 있을 때만)
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  echo "--- GitHub 라벨 ---"
  label_count=$(gh label list --json name --jq 'length' 2>&1 | grep -oE '^[0-9]+$' || echo "0")
  if [ "${label_count}" -ge 20 ]; then
    pass "라벨 ${label_count}개 설정됨"
  elif [ "${label_count}" -gt 0 ]; then
    warn "라벨 ${label_count}개 (일부 누락 가능, setup-labels.sh 실행)"
  else
    warn "라벨 미설정 (setup-labels.sh 실행 필요)"
  fi
  echo ""
fi

# 결과 요약
echo "=== 검증 결과 ==="
echo "  에러: ${ERRORS}건"
echo "  경고: ${WARNINGS}건"

if [ "${ERRORS}" -eq 0 ]; then
  echo "  상태: 정상 (경고 사항은 선택적으로 해결)"
else
  echo "  상태: 설정 불완전 (에러 항목 해결 필요)"
fi

exit "${ERRORS}"
