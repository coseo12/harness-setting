'use strict';

/**
 * 파일 경로를 4종 카테고리 중 하나로 분류한다.
 *   - frozen        : 사용자 수정 의도 없음 (CI/스크립트 보일러플레이트). 자동 덮어쓰기 안전.
 *   - managed-block : 일부만 harness 소유 (Phase A에서 센티널 블록으로 분리). Phase B는 atomic처럼 취급.
 *   - atomic        : 단일 단위 교체 (스킬/에이전트/커맨드/PR 템플릿). 사용자 수정 시 충돌.
 *   - user-only     : init 후엔 harness가 손대지 않음 (state, logs, 사용자 추가 파일).
 */
function categorize(relPath) {
  // 정규화: 윈도우 경로 대비
  const p = relPath.replace(/\\/g, '/');

  if (p.startsWith('.harness/')) return 'user-only';
  if (p === '.gitignore') return 'user-only';
  if (p.startsWith('scripts/')) return 'frozen';
  if (p.startsWith('.github/workflows/')) return 'frozen';
  if (p === 'CLAUDE.md') return 'managed-block';

  // 사용자가 자유롭게 추가하는 디렉토리의 README만 atomic, 나머지는 user-only
  if (p.startsWith('docs/decisions/') && p !== 'docs/decisions/README.md') return 'user-only';
  if (p.startsWith('docs/retrospectives/') && p !== 'docs/retrospectives/README.md') return 'user-only';

  // 기본: atomic (스킬/에이전트/커맨드/템플릿/문서)
  return 'atomic';
}

module.exports = { categorize };
