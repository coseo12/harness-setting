#!/usr/bin/env bash
# 프로젝트 내 외부 이미지 URL을 추출하여 HTTP 접근성을 검증하는 스크립트
# 사용법: ./scripts/verify-images.sh [디렉토리]
#
# 개선사항:
# - 데이터 파일(src/data/)을 우선 스캔하고, 컴포넌트는 imageUrl/src 패턴만 추출
# - example.com, placeholder 힌트 등 코드 예시 URL 자동 제외
# - 템플릿 리터럴(${ }) 포함 URL 제외
set -euo pipefail

TARGET_DIR="${1:-.}"
ERRORS=0
TOTAL=0

# 무시 패턴 — 코드 예시, placeholder 힌트, 템플릿 리터럴
IGNORE_PATTERNS="example\.com|placeholder\.com|localhost|\\\$\{|encodeURI"

echo "=== 이미지 URL 검증 ==="
echo "대상: ${TARGET_DIR}"
echo ""

# 1순위: 데이터 파일(src/data/)에서 이미지 URL 추출
DATA_URLS=""
if [ -d "${TARGET_DIR}/src/data" ]; then
  DATA_URLS=$(grep -rhoE "https://[^\"')\`]+" "${TARGET_DIR}/src/data" 2>/dev/null \
    | grep -iE '\.(jpg|jpeg|png|gif|svg|webp)|unsplash|placehold' \
    | grep -vE "${IGNORE_PATTERNS}" \
    | sort -u || true)
fi

# 2순위: 페이지/컴포넌트에서 img src 또는 배경 이미지 URL 추출
COMPONENT_URLS=""
if [ -d "${TARGET_DIR}/src/app" ] || [ -d "${TARGET_DIR}/src/components" ]; then
  COMPONENT_URLS=$(grep -rhE '(src=|imageUrl|backgroundImage|background-image)' \
    "${TARGET_DIR}/src/app" "${TARGET_DIR}/src/components" 2>/dev/null \
    | grep -oE "https://[^\"')\`]+" \
    | grep -iE '\.(jpg|jpeg|png|gif|svg|webp)|unsplash|placehold' \
    | grep -vE "${IGNORE_PATTERNS}" \
    | sort -u || true)
fi

# 합치고 중복 제거
URLS=$(echo -e "${DATA_URLS}\n${COMPONENT_URLS}" | grep -v '^$' | sort -u || true)

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
