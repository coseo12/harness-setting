#!/usr/bin/env bash
# 프레임워크 전체 정합성을 기계적으로 검증하는 스크립트
# 1차 방어선: 파일 존재, 라우팅 무결성, 라벨 일치 등을 자동 검사
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
AGENTS_DIR="${PROJECT_DIR}/.claude/agents"
SKILLS_DIR="${PROJECT_DIR}/.claude/skills"
DISPATCH_SCRIPT="${PROJECT_DIR}/scripts/dispatch-agent.sh"
CLAUDE_MD="${PROJECT_DIR}/CLAUDE.md"
README_MD="${PROJECT_DIR}/README.md"

ERRORS=0
WARNINGS=0

error() {
  echo "  [ERROR] $1"
  ERRORS=$((ERRORS + 1))
}

warn() {
  echo "  [WARN] $1"
  WARNINGS=$((WARNINGS + 1))
}

ok() {
  echo "  [OK] $1"
}

echo "=== 프레임워크 정합성 검증 ==="
echo ""

# ─── 1. 에이전트 파일 vs CLAUDE.md 테이블 ───
echo "1. 에이전트 정합성 검사..."

AGENT_FILES=$(ls "${AGENTS_DIR}"/*.md 2>/dev/null | xargs -I{} basename {} .md | sort)
AGENT_COUNT=$(echo "${AGENT_FILES}" | wc -l | tr -d ' ')

for agent in ${AGENT_FILES}; do
  if grep -q "${agent}.md" "${CLAUDE_MD}" 2>/dev/null; then
    ok "CLAUDE.md에 ${agent} 등록됨"
  else
    error "CLAUDE.md에 ${agent} 에이전트 누락"
  fi
done

echo ""

# ─── 2. 에이전트 vs dispatch-agent.sh ───
echo "2. 디스패치 라우팅 검사..."

# orchestrator, releaser는 dispatch 대상이 아닐 수 있으므로 경고만
for agent in ${AGENT_FILES}; do
  # build_prompt 함수 내 case문에 에이전트가 있는지 확인
  if grep -q "^    ${agent})" "${DISPATCH_SCRIPT}" 2>/dev/null; then
    ok "dispatch-agent.sh에 ${agent} 라우팅 있음"
  else
    warn "dispatch-agent.sh에 ${agent} 라우팅 없음 (의도적 제외일 수 있음)"
  fi
done

echo ""

# ─── 3. 스킬 파일 vs 에이전트 참조 ───
echo "3. 스킬 참조 무결성 검사..."

SKILL_DIRS=$(ls -d "${SKILLS_DIR}"/*/SKILL.md 2>/dev/null | sed "s|${SKILLS_DIR}/||;s|/SKILL.md||" | sort)
SKILL_COUNT=$(echo "${SKILL_DIRS}" | wc -l | tr -d ' ')

for skill in ${SKILL_DIRS}; do
  # 하나 이상의 에이전트가 이 스킬을 참조하는지 확인
  REFS=$(grep -rl "\`${skill}\`" "${AGENTS_DIR}"/ 2>/dev/null | wc -l | tr -d ' ') || REFS=0
  if [ "${REFS}" -gt 0 ]; then
    ok "스킬 '${skill}' → ${REFS}개 에이전트에서 참조"
  else
    warn "스킬 '${skill}' → 어떤 에이전트도 참조하지 않음"
  fi
done

echo ""

# ─── 4. README.md 구조 트리 검사 ───
echo "4. README.md 구조 트리 검사..."

for agent in ${AGENT_FILES}; do
  if grep -q "${agent}" "${README_MD}" 2>/dev/null; then
    ok "README.md에 ${agent} 언급됨"
  else
    error "README.md에 ${agent} 에이전트 누락"
  fi
done

echo ""

# ─── 5. 라벨 정합성 검사 ───
echo "5. 라벨 정합성 검사..."

# CLAUDE.md의 agent: 라벨과 실제 에이전트 파일 비교
for agent in ${AGENT_FILES}; do
  if grep -q "agent:${agent}" "${CLAUDE_MD}" 2>/dev/null; then
    ok "라벨 agent:${agent} 등록됨"
  else
    warn "라벨 agent:${agent} 미등록 (의도적 제외일 수 있음)"
  fi
done

echo ""

# ─── 6. state.json 스키마 정합성 검사 (init-project.sh + copy-template.js) ───
echo "6. state.json 스키마 정합성 검사..."

STATE_REQUIRED_KEYS=("planner" "frontend-developers" "backend-developers" "auditor" "integrator")

# 6-1. copy-template.js 검사
COPY_TEMPLATE="${PROJECT_DIR}/lib/copy-template.js"
if [ -f "${COPY_TEMPLATE}" ]; then
  for key in "${STATE_REQUIRED_KEYS[@]}"; do
    # JS 객체 키는 따옴표 있거나 없을 수 있음 (planner: 또는 'planner': 또는 "planner":)
    if grep -qE "(\"${key}\"|'${key}'|${key})\s*:" "${COPY_TEMPLATE}" 2>/dev/null; then
      ok "copy-template.js에 ${key} 포함"
    else
      warn "copy-template.js state.json에 ${key} 누락"
    fi
  done
else
  warn "copy-template.js 파일 없음 (npm 패키지 미구성 환경)"
fi

# 6-2. init-project.sh 검사
INIT_SCRIPT="${PROJECT_DIR}/scripts/init-project.sh"
if [ -f "${INIT_SCRIPT}" ]; then
  for key in "${STATE_REQUIRED_KEYS[@]}"; do
    if grep -q "\"${key}\"" "${INIT_SCRIPT}" 2>/dev/null; then
      ok "init-project.sh에 ${key} 포함"
    else
      warn "init-project.sh state.json에 ${key} 누락"
    fi
  done
else
  warn "init-project.sh 파일 없음"
fi

echo ""

# ─── 7. README.md 스킬 목록 검사 ───
echo "7. README.md 스킬 목록 검사..."

for skill in ${SKILL_DIRS}; do
  if grep -q "${skill}" "${README_MD}" 2>/dev/null; then
    ok "README.md에 스킬 '${skill}' 언급됨"
  else
    error "README.md에 스킬 '${skill}' 누락"
  fi
done

# README의 에이전트 개수 표기 확인
README_AGENT_COUNT=$(grep -oE "에이전트 정의 \([0-9]+개\)" "${README_MD}" 2>/dev/null | grep -oE "[0-9]+" || echo "0")
if [ "${README_AGENT_COUNT}" = "${AGENT_COUNT}" ]; then
  ok "README.md 에이전트 개수 (${README_AGENT_COUNT}개) 일치"
else
  error "README.md 에이전트 개수 불일치: README=${README_AGENT_COUNT}, 실제=${AGENT_COUNT}"
fi

echo ""

# ─── 8. 에이전트 frontmatter 검사 ───
echo "8. 에이전트 frontmatter 검사..."

for f in "${AGENTS_DIR}"/*.md; do
  agent=$(basename "$f" .md)
  if head -1 "$f" | grep -q "^---"; then
    ok "${agent}: frontmatter 존재"
  else
    warn "${agent}: frontmatter 없음 (플러그인 사용 시 필요)"
  fi
done

echo ""

# ─── 9. 플러그인 구조 검사 ───
echo "9. 플러그인 구조 검사..."

PLUGIN_JSON="${PROJECT_DIR}/.claude-plugin/plugin.json"
MARKETPLACE_JSON="${PROJECT_DIR}/.claude-plugin/marketplace.json"

if [ -f "${PLUGIN_JSON}" ]; then
  ok ".claude-plugin/plugin.json 존재"
else
  warn ".claude-plugin/plugin.json 없음 (플러그인 배포 불가)"
fi

if [ -f "${MARKETPLACE_JSON}" ]; then
  ok ".claude-plugin/marketplace.json 존재"
else
  warn ".claude-plugin/marketplace.json 없음 (마켓플레이스 배포 불가)"
fi

# 루트 symlink 확인
if [ -L "${PROJECT_DIR}/agents" ] && [ -L "${PROJECT_DIR}/skills" ]; then
  ok "루트 agents/skills symlink 존재"
else
  warn "루트 agents/skills symlink 없음 (--plugin-dir 사용 불가)"
fi

# plugins/ 구조 확인
NESTED_PLUGIN="${PROJECT_DIR}/plugins/harness-setting/.claude-plugin/plugin.json"
if [ -f "${NESTED_PLUGIN}" ]; then
  ok "plugins/harness-setting 구조 존재"
else
  warn "plugins/harness-setting 구조 없음 (마켓플레이스 설치 불가)"
fi

echo ""

# ─── 10. package.json files 필드 검사 ───
echo "10. package.json files 필드 검사..."

PACKAGE_JSON="${PROJECT_DIR}/package.json"
if [ -f "${PACKAGE_JSON}" ]; then
  REQUIRED_FILES=(".claude/" ".claude-plugin/" "bin/" "lib/" "scripts/" "agents" "skills" "plugins/" "CLAUDE.md")
  for entry in "${REQUIRED_FILES[@]}"; do
    if grep -q "\"${entry}\"" "${PACKAGE_JSON}" 2>/dev/null; then
      ok "package.json files에 '${entry}' 포함"
    else
      warn "package.json files에 '${entry}' 누락"
    fi
  done
fi

echo ""

# ─── 결과 요약 ───
echo "=== 검증 결과 ==="
echo "  에이전트: ${AGENT_COUNT}개"
echo "  스킬: ${SKILL_COUNT}개"
echo "  에러: ${ERRORS}개"
echo "  경고: ${WARNINGS}개"
echo ""

if [ "${ERRORS}" -gt 0 ]; then
  echo "❌ 정합성 검증 실패 — ${ERRORS}개의 에러를 수정해야 합니다."
  exit 1
else
  if [ "${WARNINGS}" -gt 0 ]; then
    echo "⚠️  정합성 검증 통과 (경고 ${WARNINGS}개 — 확인 권장)"
  else
    echo "✅ 정합성 검증 완료 — 문제 없음"
  fi
  exit 0
fi
