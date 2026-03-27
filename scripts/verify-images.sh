#!/usr/bin/env bash
# 프로젝트 내 외부 이미지 URL을 추출하여 HTTP 접근성을 검증하는 스크립트
# 사용법: ./scripts/verify-images.sh [디렉토리]
set -euo pipefail

TARGET_DIR="${1:-.}"
ERRORS=0
TOTAL=0

echo "=== 이미지 URL 검증 ==="
echo "대상: ${TARGET_DIR}"
echo ""

# 소스 코드에서 이미지 URL 추출 (https:// 로 시작하는 이미지 URL)
URLS=$(grep -rhoE "https://[^\"')\`]+" "${TARGET_DIR}/src" 2>/dev/null \
  | grep -iE '\.(jpg|jpeg|png|gif|svg|webp)|unsplash|placehold|placeholder' \
  | sort -u || true)

if [ -z "${URLS}" ]; then
  echo "이미지 URL을 찾을 수 없습니다."
  exit 0
fi

echo "발견된 이미지 URL:"
echo ""

while IFS= read -r url; do
  TOTAL=$((TOTAL + 1))
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null || echo "000")

  if [ "${CODE}" = "200" ]; then
    echo "  [OK]   HTTP ${CODE}: ${url}"
  else
    echo "  [FAIL] HTTP ${CODE}: ${url}"
    ERRORS=$((ERRORS + 1))
  fi
done <<< "${URLS}"

echo ""
echo "=== 검증 결과 ==="
echo "  총 ${TOTAL}개 URL, 실패 ${ERRORS}개"

if [ "${ERRORS}" -gt 0 ]; then
  echo ""
  echo "  주의: HTTP 200이어도 이미지 내용이 의도와 다를 수 있습니다."
  echo "  이미지를 다운로드하여 직접 확인하세요."
  exit 1
else
  echo ""
  echo "  모든 이미지 URL 접근 가능."
  echo "  주의: HTTP 200이어도 이미지 내용이 의도와 다를 수 있습니다."
  exit 0
fi
