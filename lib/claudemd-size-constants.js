'use strict';

// CLAUDE.md 각인 예산 정량 게이트 임계값 SSoT (#203).
//
// 과거에는 verify-claudemd-size.sh / lib/doctor.js / docs/guides/claudemd-governance.md §3
// 세 위치에 독립 하드코딩되어 drift 위험. 본 모듈로 단일 선언 + 참조 통일.
//
// 지침: docs/guides/claudemd-governance.md §3 (정량 게이트)
// 참조: harness #197 Phase 2 (가드 도입) + #203 (SSoT 추출)

module.exports = {
  // 경계 경보 — 가지치기 후보 탐색 권장 (exit 0 + stdout)
  WARN_BOUNDARY: 35000,
  // PR warn — 신규 인라인 블록 금지 안내 (exit 0 + stdout)
  WARN_PR: 40000,
  // fail — CI 머지 차단 (exit 1 + stderr)
  FAIL_THRESHOLD: 45000,
};
