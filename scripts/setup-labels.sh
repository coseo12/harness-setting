#!/usr/bin/env bash
# GitHub 이슈 라벨을 생성하는 스크립트
set -euo pipefail

echo "=== GitHub 라벨 설정 ==="

# gh CLI 확인
if ! command -v gh &> /dev/null; then
  echo "에러: gh CLI가 설치되어 있지 않습니다."
  echo "설치: https://cli.github.com/"
  exit 1
fi

# 인증 확인
if ! gh auth status &> /dev/null; then
  echo "에러: gh CLI 인증이 필요합니다. 'gh auth login' 을 실행하세요."
  exit 1
fi

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label create "${name}" --color "${color}" --description "${description}" 2>/dev/null; then
    echo "  ✓ ${name}"
  else
    # 이미 존재하면 업데이트
    gh label edit "${name}" --color "${color}" --description "${description}" 2>/dev/null && \
      echo "  ~ ${name} (업데이트)" || echo "  ✗ ${name} (실패)"
  fi
}

echo "에이전트 라벨 생성..."
create_label "agent:pm"        "7057FF" "PM 에이전트 담당"
create_label "agent:architect" "FF6B35" "Architect 에이전트 담당"
create_label "agent:developer" "00C853" "Developer 에이전트 담당"
create_label "agent:reviewer"  "FFD600" "Reviewer 에이전트 담당"
create_label "agent:qa"        "00B8D4" "QA 에이전트 담당"

echo "우선순위 라벨 생성..."
create_label "priority:critical" "B60205" "긴급 - 즉시 처리"
create_label "priority:high"     "D93F0B" "높음"
create_label "priority:medium"   "FBCA04" "보통"
create_label "priority:low"      "0E8A16" "낮음"

echo "크기 라벨 생성..."
create_label "size:s"  "C2E0C6" "소규모 (1-2시간)"
create_label "size:m"  "BFD4F2" "중규모 (반나절)"
create_label "size:l"  "D4C5F9" "대규모 (1일)"
create_label "size:xl" "F9D0C4" "초대규모 (2일+)"

echo "상태 라벨 생성..."
create_label "status:todo"        "E4E669" "할 일"
create_label "status:in-progress" "0075CA" "진행 중"
create_label "status:review"      "D876E3" "리뷰 대기"
create_label "status:qa"          "1D76DB" "QA 대기"
create_label "status:done"        "0E8A16" "완료"
create_label "status:blocked"     "B60205" "블로커 있음"
create_label "status:reviewing"   "C9DEF8" "리뷰 진행 중"
create_label "status:testing"     "BFD4F2" "테스트 진행 중"
create_label "status:audit-passed" "0E8A16" "정적 분석 통과"
create_label "needs:re-review"    "FBCA04" "재리뷰 필요"

echo "타입 라벨 생성..."
create_label "type:feature"  "A2EEEF" "새 기능"
create_label "type:bug"      "D73A4A" "버그 수정"
create_label "type:refactor" "FEF2C0" "리팩토링"
create_label "type:infra"    "D4C5F9" "인프라/설정"

echo ""
echo "=== 라벨 설정 완료 ==="
