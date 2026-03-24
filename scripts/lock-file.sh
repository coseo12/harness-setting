#!/usr/bin/env bash
# 파일 잠금 관리 — 병렬 에이전트 간 동일 파일 수정 충돌 방지
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCK_DIR="${PROJECT_DIR}/.harness/locks"
LOCK_TIMEOUT="${HARNESS_LOCK_TIMEOUT:-300}"  # 5분 대기 후 타임아웃

mkdir -p "${LOCK_DIR}"

usage() {
  echo "사용법: $0 <명령> [파일경로]"
  echo ""
  echo "명령:"
  echo "  acquire <파일>   - 파일 잠금 획득 (이미 잠겨있으면 대기)"
  echo "  release <파일>   - 파일 잠금 해제"
  echo "  status           - 현재 잠금 상태 출력"
  echo "  cleanup          - 만료된 잠금 정리"
  exit 1
}

# 파일 경로를 잠금 파일명으로 변환
lock_path() {
  echo "${LOCK_DIR}/$(echo "$1" | tr '/' '_').lock"
}

acquire() {
  local file="$1"
  local lockfile
  lockfile=$(lock_path "${file}")
  local waited=0

  while [ -f "${lockfile}" ]; do
    # 잠금 소유자 확인
    local owner
    owner=$(cat "${lockfile}" 2>/dev/null || echo "unknown")
    local lock_age
    if [[ "$OSTYPE" == "darwin"* ]]; then
      lock_age=$(( $(date +%s) - $(stat -f %m "${lockfile}" 2>/dev/null || echo "$(date +%s)") ))
    else
      lock_age=$(( $(date +%s) - $(stat -c %Y "${lockfile}" 2>/dev/null || echo "$(date +%s)") ))
    fi

    # 잠금이 10분 이상 오래되면 자동 해제 (좀비 잠금 방지)
    if [ "${lock_age}" -gt 600 ]; then
      echo "경고: 오래된 잠금 해제 (${lock_age}초, 소유자: ${owner})"
      rm -f "${lockfile}"
      break
    fi

    if [ "${waited}" -ge "${LOCK_TIMEOUT}" ]; then
      echo "에러: 잠금 획득 타임아웃 (${LOCK_TIMEOUT}초). 소유자: ${owner}"
      exit 1
    fi

    echo "대기: ${file} 잠금 중 (소유자: ${owner}, ${waited}/${LOCK_TIMEOUT}초)..."
    sleep 5
    waited=$((waited + 5))
  done

  # 잠금 획득
  echo "$$:${HARNESS_AGENT:-unknown}:$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${lockfile}"
  echo "잠금 획득: ${file}"
}

release() {
  local file="$1"
  local lockfile
  lockfile=$(lock_path "${file}")

  if [ -f "${lockfile}" ]; then
    rm -f "${lockfile}"
    echo "잠금 해제: ${file}"
  else
    echo "경고: 잠금이 없음: ${file}"
  fi
}

show_status() {
  echo "=== 파일 잠금 상태 ==="
  if [ -z "$(ls -A "${LOCK_DIR}" 2>/dev/null)" ]; then
    echo "  활성 잠금 없음"
    return
  fi

  for lockfile in "${LOCK_DIR}"/*.lock; do
    [ -f "${lockfile}" ] || continue
    local name
    name=$(basename "${lockfile}" .lock | tr '_' '/')
    local owner
    owner=$(cat "${lockfile}" 2>/dev/null || echo "unknown")
    echo "  ${name} → ${owner}"
  done
}

cleanup() {
  echo "=== 만료된 잠금 정리 ==="
  local cleaned=0
  for lockfile in "${LOCK_DIR}"/*.lock; do
    [ -f "${lockfile}" ] || continue
    local lock_age
    if [[ "$OSTYPE" == "darwin"* ]]; then
      lock_age=$(( $(date +%s) - $(stat -f %m "${lockfile}") ))
    else
      lock_age=$(( $(date +%s) - $(stat -c %Y "${lockfile}") ))
    fi

    if [ "${lock_age}" -gt 600 ]; then
      rm -f "${lockfile}"
      cleaned=$((cleaned + 1))
    fi
  done
  echo "  ${cleaned}건 정리 완료"
}

case "${1:-}" in
  acquire)
    [ -z "${2:-}" ] && usage
    acquire "$2"
    ;;
  release)
    [ -z "${2:-}" ] && usage
    release "$2"
    ;;
  status)
    show_status
    ;;
  cleanup)
    cleanup
    ;;
  *)
    usage
    ;;
esac
