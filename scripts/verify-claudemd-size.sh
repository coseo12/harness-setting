#!/usr/bin/env bash
# verify-claudemd-size.sh
# CLAUDE.md 의 char 수 (UTF-8 문자 단위) 를 측정하여 "각인 예산" 게이트를 강제한다.
# 3단 게이트:
#   - 35k 미만          : pass (조용)
#   - 35k ~ 40k         : 경계 경보 (stdout 경보, exit 0)
#   - 40k ~ 45k         : PR warn (신규 인라인 블록 금지 안내, exit 0)
#   - 45k 이상          : fail (stderr + 가지치기 안내, exit 1)
#
# 근거: harness #197 Phase 1 지침 (docs/guides/claudemd-governance.md §3)
# CLAUDE.md 는 매 세션 전량 어텐션 대상이라 크기가 커질수록 각 규칙의 상대적 비중이 희석.
#
# 호출 예:
#   bash scripts/verify-claudemd-size.sh
#     → 통과: exit 0, 경계/경고 상황에서도 exit 0
#     → 실패: 45k 초과 시 exit 1 + stderr 가이드 링크
#
# 환경변수 override (테스트/재조정 용이성):
#   CLAUDEMD_FILE           : 검사 대상 파일 경로 (기본 $PROJECT_DIR/CLAUDE.md)
#   CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY : 경계 경보 임계 (기본 35000)
#   CLAUDEMD_SIZE_LIMIT_WARN_PR       : PR warn 임계 (기본 40000)
#   CLAUDEMD_SIZE_LIMIT_FAIL          : fail 임계 (기본 45000)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CLAUDEMD_FILE="${CLAUDEMD_FILE:-${PROJECT_DIR}/CLAUDE.md}"
WARN_BOUNDARY="${CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY:-35000}"
WARN_PR="${CLAUDEMD_SIZE_LIMIT_WARN_PR:-40000}"
FAIL_THRESHOLD="${CLAUDEMD_SIZE_LIMIT_FAIL:-45000}"

if [ ! -f "${CLAUDEMD_FILE}" ]; then
  echo "verify-claudemd-size: 파일 없음: ${CLAUDEMD_FILE}" >&2
  exit 1
fi

# 한글 UTF-8 보정 — `wc -c` (바이트) 가 아닌 `wc -m` (문자) 사용.
# macOS 기본 wc 는 로케일 의존이라 LC_ALL 강제.
char_count=$(LC_ALL=en_US.UTF-8 wc -m < "${CLAUDEMD_FILE}" | tr -d ' ')

# 숫자 검증 (unexpected output 방어)
if ! [[ "${char_count}" =~ ^[0-9]+$ ]]; then
  echo "verify-claudemd-size: char 수 파싱 실패: '${char_count}'" >&2
  exit 1
fi

# 정량 게이트 판정
if [ "${char_count}" -ge "${FAIL_THRESHOLD}" ]; then
  echo "❌ CLAUDE.md 각인 예산 초과" >&2
  echo "   현재: ${char_count} chars (fail 임계 ${FAIL_THRESHOLD})" >&2
  echo "" >&2
  echo "   올바른 대응: 예외 박제가 아니라 기존 블록 가지치기" >&2
  echo "   - 상위 섹션 bytes 측정: awk '/^## /{if(n)print c\"\\t\"n; n=\$0; c=0; next} {c+=length(\$0)+1} END{if(n)print c\"\\t\"n}' CLAUDE.md | sort -rn" >&2
  echo "   - 추출 기준: 매트릭스 3행+ / 코드 5라인+ / 프로토콜 3스텝+ / 근거 2+" >&2
  echo "   - 상세: docs/guides/claudemd-governance.md §5 (가지치기 프로토콜)" >&2
  exit 1
fi

if [ "${char_count}" -ge "${WARN_PR}" ]; then
  echo "⚠️  CLAUDE.md 각인 예산 PR warn"
  echo "   현재: ${char_count} chars (PR warn ${WARN_PR} / fail ${FAIL_THRESHOLD})"
  echo "   신규 인라인 블록 금지 — 추가 규약은 docs/ 로 추출 후 포인터 1~3 줄만"
  echo "   상세: docs/guides/claudemd-governance.md §3"
  exit 0
fi

if [ "${char_count}" -ge "${WARN_BOUNDARY}" ]; then
  echo "🟡 CLAUDE.md 각인 예산 경계 경보"
  echo "   현재: ${char_count} chars (경계 ${WARN_BOUNDARY} / PR warn ${WARN_PR})"
  echo "   가지치기 후보 탐색 권장 — 6개월 미수정 + 매트릭스/코드 블록 보유 섹션 우선"
  exit 0
fi

echo "✅ CLAUDE.md 각인 예산 정상 (${char_count} / ${WARN_BOUNDARY} chars)"
exit 0
