#!/usr/bin/env node
'use strict';

// CLAUDE.md 의 char 수 (Unicode code point 단위) 를 측정해 "각인 예산" 게이트를 강제한다.
//
// 3단 게이트:
//   - 35k 미만            : pass (조용)
//   - 35k ~ 40k           : 경계 경보 (stdout, exit 0)
//   - 40k ~ 45k           : PR warn (신규 인라인 블록 금지 안내, exit 0)
//   - 45k 이상            : fail (stderr + 가지치기 안내, exit 1)
//
// 본 파일은 기존 shell 스크립트 (scripts/verify-claudemd-size.sh) 를 Node 포트 한 구현.
// 포트 근거 (#203):
//   - `LC_ALL=en_US.UTF-8 wc -m` 가 self-hosted runner 에서 locale 미설치 시 POSIX 로 폴백 →
//     바이트 수 (62% 부풀림, 실측: 70,500 vs 43,305) 로 오탐 발생
//   - JS 의 `[...str].length` 는 Unicode code point 를 세며 locale 영향 없음 → 이식성 확보
//   - 임계값 SSoT 연동 (lib/claudemd-size-constants.js) — 이전에는 shell 기본값 / doctor.js /
//     가이드 문서 3곳에 독립 하드코딩되던 drift 위험 제거
//
// 환경변수 override (기존 shell 인터페이스와 호환):
//   CLAUDEMD_FILE                     : 검사 대상 파일 (기본 PROJECT_ROOT/CLAUDE.md)
//   CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY : 경계 경보 임계 (기본 SSoT WARN_BOUNDARY)
//   CLAUDEMD_SIZE_LIMIT_WARN_PR       : PR warn 임계 (기본 SSoT WARN_PR)
//   CLAUDEMD_SIZE_LIMIT_FAIL          : fail 임계 (기본 SSoT FAIL_THRESHOLD)

const fs = require('node:fs');
const path = require('node:path');

const {
  WARN_BOUNDARY: SSOT_WARN_BOUNDARY,
  WARN_PR: SSOT_WARN_PR,
  FAIL_THRESHOLD: SSOT_FAIL_THRESHOLD,
} = require('./claudemd-size-constants');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CLAUDEMD_FILE = process.env.CLAUDEMD_FILE || path.join(PROJECT_ROOT, 'CLAUDE.md');

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    console.error(`verify-claudemd-size: 잘못된 임계값 (양의 정수 기대): '${value}'`);
    process.exit(1);
  }
  return n;
}

const WARN_BOUNDARY = parsePositiveInt(
  process.env.CLAUDEMD_SIZE_LIMIT_WARN_BOUNDARY,
  SSOT_WARN_BOUNDARY
);
const WARN_PR = parsePositiveInt(process.env.CLAUDEMD_SIZE_LIMIT_WARN_PR, SSOT_WARN_PR);
const FAIL_THRESHOLD = parsePositiveInt(
  process.env.CLAUDEMD_SIZE_LIMIT_FAIL,
  SSOT_FAIL_THRESHOLD
);

if (!fs.existsSync(CLAUDEMD_FILE)) {
  console.error(`verify-claudemd-size: 파일 없음: ${CLAUDEMD_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(CLAUDEMD_FILE, 'utf8');
// Unicode code point 단위 (한글 포함 locale-independent) — [...str] 은 surrogate pair 결합
const charCount = [...content].length;

if (charCount >= FAIL_THRESHOLD) {
  console.error('❌ CLAUDE.md 각인 예산 초과');
  console.error(`   현재: ${charCount} chars (fail 임계 ${FAIL_THRESHOLD})`);
  console.error('');
  console.error('   올바른 대응: 예외 박제가 아니라 기존 블록 가지치기');
  console.error(
    '   - 상위 섹션 bytes 측정: awk \'/^## /{if(n)print c"\\t"n; n=$0; c=0; next} {c+=length($0)+1} END{if(n)print c"\\t"n}\' CLAUDE.md | sort -rn'
  );
  console.error('   - 추출 기준: 매트릭스 3행+ / 코드 5라인+ / 프로토콜 3스텝+ / 근거 2+');
  console.error('   - 상세: docs/guides/claudemd-governance.md §5 (가지치기 프로토콜)');
  process.exit(1);
}

if (charCount >= WARN_PR) {
  console.log('⚠️  CLAUDE.md 각인 예산 PR warn');
  console.log(`   현재: ${charCount} chars (PR warn ${WARN_PR} / fail ${FAIL_THRESHOLD})`);
  console.log('   신규 인라인 블록 금지 — 추가 규약은 docs/ 로 추출 후 포인터 1~3 줄만');
  console.log('   상세: docs/guides/claudemd-governance.md §3');
  process.exit(0);
}

if (charCount >= WARN_BOUNDARY) {
  console.log('🟡 CLAUDE.md 각인 예산 경계 경보');
  console.log(`   현재: ${charCount} chars (경계 ${WARN_BOUNDARY} / PR warn ${WARN_PR})`);
  console.log('   가지치기 후보 탐색 권장 — 6개월 미수정 + 매트릭스/코드 블록 보유 섹션 우선');
  process.exit(0);
}

console.log(`✅ CLAUDE.md 각인 예산 정상 (${charCount} / ${WARN_BOUNDARY} chars)`);
process.exit(0);
