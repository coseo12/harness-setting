#!/usr/bin/env node
'use strict';

// CLAUDE.md 내 상대 링크 (docs/, .github/, scripts/, .claude/, test/ 등) 의 파일 존재를 검증.
// 비대화 방지 지침에 따라 추출이 많아질수록 link rot 위험 증가 — 본 스크립트로 구조적 방어.
//
// 검증 범위:
//   - 코드펜스 (```...```) 블록 내부 스킵
//   - 인라인 코드 (`...`) 내부 스킵 (placeholder 표기로 간주)
//   - 외부 URL (http*, //, mailto:, ftp:, data:) 스킵
//   - 앵커 전용 링크 (#section) 스킵
//   - 파일#anchor 링크는 파일 부분만 존재 확인
//
// 환경변수:
//   CLAUDEMD_FILE : 검사 대상 파일 (기본 PROJECT_ROOT/CLAUDE.md)
//
// 근거: harness #197 Phase 2, docs/guides/claudemd-governance.md §4.3

const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TARGET_FILE = process.env.CLAUDEMD_FILE || path.join(PROJECT_ROOT, 'CLAUDE.md');

if (!fs.existsSync(TARGET_FILE)) {
  console.error(`verify-docs-links: 파일 없음: ${TARGET_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(TARGET_FILE, 'utf8');
const lines = content.split('\n');

// 마크다운 링크 매처 — `[text](url)` 의 url 부분 추출
const LINK_PATTERN = /\]\(([^)]+)\)/g;
// 외부 URL 프리픽스
const EXTERNAL_PREFIXES = [/^https?:\/\//, /^\/\//, /^mailto:/, /^ftp:/, /^data:/];

let inFence = false;
const extracted = [];

for (const line of lines) {
  if (line.startsWith('```')) {
    inFence = !inFence;
    continue;
  }
  if (inFence) continue;

  // 인라인 코드 (단일 백틱 쌍) 제거 — 내부 예시 링크 표기 (예: `[foo](경로)`) 는 실제 링크 아님
  const stripped = line.replace(/`[^`]*`/g, '');

  let match;
  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(stripped)) !== null) {
    const url = match[1].trim();
    if (!url) continue;
    if (url.startsWith('#')) continue;
    if (EXTERNAL_PREFIXES.some((re) => re.test(url))) continue;
    extracted.push(url);
  }
}

const missing = [];
for (const url of extracted) {
  // 파일#anchor 에서 파일 부분만 취함
  const filePart = url.split('#')[0];
  if (!filePart) continue;

  // path.join 은 leading slash 를 무시하고 concat 하므로 `/docs/...` 와 `docs/...` 모두
  // 프로젝트 루트 기준으로 올바르게 해석됨. path.resolve 로 바꾸면 leading slash 입력이
  // 파일 시스템 루트로 빠져나가므로 금지 (volt 교차검증 오탐 케이스 — 회귀 가드는 테스트 참조).
  const target = path.join(PROJECT_ROOT, filePart);

  if (!fs.existsSync(target)) {
    missing.push({ url, target });
  }
}

if (missing.length > 0) {
  console.error(`❌ CLAUDE.md 내 깨진 상대 링크 ${missing.length}건:`);
  for (const m of missing) {
    console.error(`   - ${m.url} → ${m.target}`);
  }
  console.error('');
  console.error('   원인: 파일 이동/삭제/오타 또는 Phase 3 감축 시 경로 업데이트 누락');
  console.error('   대응: docs/guides/claudemd-governance.md §7.3 (SSoT 결합 체크리스트)');
  process.exit(1);
}

console.log(`✅ CLAUDE.md 상대 링크 ${extracted.length}건 모두 유효`);
process.exit(0);
