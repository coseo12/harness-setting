#!/usr/bin/env bash
# 프레임워크 회귀 테스트 — 에이전트/스킬/스크립트/예제 정합성 검증
# 사용법: ./scripts/regression-test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ERRORS=0
PASS=0

pass() { PASS=$((PASS + 1)); echo "  [PASS] $1"; }
fail() { ERRORS=$((ERRORS + 1)); echo "  [FAIL] $1"; }

echo "=== 프레임워크 회귀 테스트 ==="
echo ""

# ─── 1. 에이전트 파일 존재 검증 ───
echo "1. 에이전트 파일 검증..."
EXPECTED_AGENTS="orchestrator planner pm architect frontend-developer backend-developer developer evaluator qa"
for agent in ${EXPECTED_AGENTS}; do
  if [ -f "${PROJECT_DIR}/.claude/agents/${agent}.md" ]; then
    pass "${agent}.md 존재"
  else
    fail "${agent}.md 누락"
  fi
done

# 제거된 에이전트가 남아있지 않은지
REMOVED_AGENTS="auditor reviewer integrator devops releaser cross-validator skill-creator"
for agent in ${REMOVED_AGENTS}; do
  if [ -f "${PROJECT_DIR}/.claude/agents/${agent}.md" ]; then
    fail "${agent}.md 가 여전히 존재 (제거 필요)"
  else
    pass "${agent}.md 정상 제거됨"
  fi
done

echo ""

# ─── 2. CLAUDE.md 정합성 ───
echo "2. CLAUDE.md 정합성..."
if grep -q "agent:evaluator" "${PROJECT_DIR}/CLAUDE.md"; then
  pass "CLAUDE.md에 evaluator 라벨 존재"
else
  fail "CLAUDE.md에 evaluator 라벨 누락"
fi

if grep -q "status:evaluating" "${PROJECT_DIR}/CLAUDE.md"; then
  pass "CLAUDE.md에 evaluating 상태 존재"
else
  fail "CLAUDE.md에 evaluating 상태 누락"
fi

if grep -q "적응형 파이프라인" "${PROJECT_DIR}/CLAUDE.md"; then
  pass "CLAUDE.md에 적응형 파이프라인 존재"
else
  fail "CLAUDE.md에 적응형 파이프라인 누락"
fi

if grep -q "사용자 명시적 지시" "${PROJECT_DIR}/CLAUDE.md"; then
  pass "CLAUDE.md에 원칙 우선순위 존재"
else
  fail "CLAUDE.md에 원칙 우선순위 누락"
fi

echo ""

# ─── 3. 스크립트 실행 가능 검증 ───
echo "3. 스크립트 검증..."
REQUIRED_SCRIPTS="dispatch-agent.sh orchestrator.sh setup-labels.sh validate-integrity.sh verify-images.sh"
for script in ${REQUIRED_SCRIPTS}; do
  if [ -f "${PROJECT_DIR}/scripts/${script}" ]; then
    pass "${script} 존재"
  else
    fail "${script} 누락"
  fi
done

# dispatch-agent.sh에서 제거된 에이전트 기능 코드 잔존 확인
if grep -qE "^\s+(auditor|reviewer|integrator|devops|releaser)\)" "${PROJECT_DIR}/scripts/dispatch-agent.sh" 2>/dev/null; then
  fail "dispatch-agent.sh에 제거된 에이전트 라우팅 잔존"
else
  pass "dispatch-agent.sh 제거된 에이전트 정리 완료"
fi

echo ""

# ─── 4. 스킬 디렉토리 검증 ───
echo "4. 스킬 검증..."
SKILL_COUNT=$(ls -d "${PROJECT_DIR}/.claude/skills"/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')
if [ "${SKILL_COUNT}" -ge 10 ]; then
  pass "스킬 ${SKILL_COUNT}개 존재"
else
  fail "스킬 ${SKILL_COUNT}개 (10개 이상 필요)"
fi

echo ""

# ─── 5. 예제 프로젝트 빌드 검증 ───
echo "5. 예제 프로젝트 검증..."
for example in recipe-hub simple-shop chat-app todo-app; do
  EXAMPLE_DIR="${PROJECT_DIR}/examples/${example}"
  if [ -d "${EXAMPLE_DIR}" ]; then
    if [ -f "${EXAMPLE_DIR}/package.json" ]; then
      pass "${example}: package.json 존재"
    else
      fail "${example}: package.json 누락"
    fi

    # src 디렉토리 존재
    if [ -d "${EXAMPLE_DIR}/src" ]; then
      pass "${example}: src/ 존재"
    else
      fail "${example}: src/ 누락"
    fi
  else
    fail "${example}: 디렉토리 없음"
  fi
done

echo ""

# ─── 6. 이미지 URL 검증 ───
echo "6. 이미지 URL 검증..."
for example in recipe-hub simple-shop chat-app todo-app; do
  EXAMPLE_DIR="${PROJECT_DIR}/examples/${example}"
  if [ -d "${EXAMPLE_DIR}/src" ]; then
    RESULT=$("${PROJECT_DIR}/scripts/verify-images.sh" "${EXAMPLE_DIR}" 2>&1)
    if echo "${RESULT}" | grep -q "실패 0개"; then
      pass "${example}: 이미지 전체 OK"
    else
      fail "${example}: 이미지 검증 실패"
    fi
  fi
done

echo ""

# ─── 결과 ───
TOTAL=$((PASS + ERRORS))
echo "=== 회귀 테스트 결과 ==="
echo "  통과: ${PASS}/${TOTAL}"
echo "  실패: ${ERRORS}/${TOTAL}"

if [ "${ERRORS}" -gt 0 ]; then
  echo ""
  echo "회귀 테스트 실패 — ${ERRORS}건의 문제를 수정하세요."
  exit 1
else
  echo ""
  echo "회귀 테스트 통과"
  exit 0
fi
