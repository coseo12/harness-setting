#!/usr/bin/env bash
# 에이전트 감사 로그 — 모든 에이전트 활동을 추적
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
AUDIT_FILE="${PROJECT_DIR}/.harness/audit.log"

mkdir -p "${PROJECT_DIR}/.harness"

usage() {
  echo "사용법: $0 <명령>"
  echo ""
  echo "명령:"
  echo "  log <agent> <action> <detail>  - 감사 로그 기록"
  echo "  show [--agent <name>] [--last N]  - 감사 로그 조회"
  echo "  summary                         - 에이전트별 활동 요약"
  exit 1
}

log_entry() {
  local agent="$1"
  local action="$2"
  local detail="${3:-}"
  local timestamp
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  echo "${timestamp}|${agent}|${action}|${detail}" >> "${AUDIT_FILE}"
}

show_log() {
  if [ ! -f "${AUDIT_FILE}" ]; then
    echo "감사 로그가 비어있습니다."
    return
  fi

  local agent_filter=""
  local last_n=0

  while [ $# -gt 0 ]; do
    case "$1" in
      --agent) agent_filter="$2"; shift 2 ;;
      --last) last_n="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  echo "=== 감사 로그 ==="
  printf "%-22s %-18s %-20s %s\n" "시각" "에이전트" "작업" "상세"
  printf "%s\n" "-------------------------------------------------------------------------------------"

  local cmd="cat"
  [ "${last_n}" -gt 0 ] && cmd="tail -${last_n}"

  ${cmd} "${AUDIT_FILE}" | while IFS='|' read -r ts ag act det; do
    if [ -z "${agent_filter}" ] || [ "${ag}" = "${agent_filter}" ]; then
      printf "%-22s %-18s %-20s %s\n" "${ts}" "${ag}" "${act}" "${det}"
    fi
  done
}

show_summary() {
  if [ ! -f "${AUDIT_FILE}" ]; then
    echo "감사 로그가 비어있습니다."
    return
  fi

  echo "=== 에이전트 활동 요약 ==="
  echo ""

  # 에이전트별 활동 수
  printf "%-20s %s\n" "에이전트" "활동 수"
  printf "%s\n" "--------------------------------"
  awk -F'|' '{count[$2]++} END {for (a in count) printf "%-20s %d\n", a, count[a]}' "${AUDIT_FILE}" | sort -t' ' -k2 -rn

  echo ""

  # 최근 24시간 활동
  echo "### 최근 활동 (마지막 10건)"
  tail -10 "${AUDIT_FILE}" | while IFS='|' read -r ts ag act det; do
    printf "  %s %s: %s %s\n" "${ts}" "${ag}" "${act}" "${det}"
  done
}

case "${1:-}" in
  log)
    [ $# -lt 3 ] && usage
    log_entry "$2" "$3" "${4:-}"
    ;;
  show)
    shift
    show_log "$@"
    ;;
  summary)
    show_summary
    ;;
  *)
    usage
    ;;
esac
